# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import sqlite3, json, os, shutil
import chromadb
from pydantic import BaseModel
from typing import List, Annotated, Union

# Import your existing functions and modules
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from skill_extractor import get_skills_from_jd, generate_feedback
from scorer import calculate_hard_match, calculate_semantic_match, calculate_final_score, model
from parser import extract_text

app = FastAPI(title="Resume Analyzer API")
DB_NAME = "analyzer.db"
CHROMA_PATH = "chroma_db"
os.makedirs("temp_uploads", exist_ok=True)
os.makedirs(CHROMA_PATH, exist_ok=True)

# --- ChromaDB Setup ---
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
resume_collection = chroma_client.get_or_create_collection(name="resumes")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# --- Pydantic Models ---
class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str

class FeedbackRequest(BaseModel):
    jd_text: str
    resume_text: str
    found_skills: List[str]
    required_skills: List[str]

class KeywordSearchRequest(BaseModel):
    # UPDATED: Make keywords flexible to accept a string or list
    keywords: Union[List[str], str]

# --- API Endpoints ---

@app.get("/analytics/")
async def get_system_analytics(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    total_analyses = conn.execute("SELECT COUNT(*) FROM analysis_results").fetchone()[0]
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    total_indexed_resumes = resume_collection.count()
    return {
        "total_analyses": total_analyses,
        "total_users": total_users,
        "total_indexed_resumes": total_indexed_resumes,
    }

@app.get("/users/")
async def get_all_users(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    users = conn.execute("SELECT id, username FROM users").fetchall()
    conn.close()
    return [dict(row) for row in users]

@app.delete("/users/{username}")
async def delete_user(username: str, user: dict = Depends(get_current_user)):
    if user['username'] == username:
        raise HTTPException(status_code=400, detail="Cannot delete your own user account.")
    conn = get_db_connection()
    conn.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"User '{username}' deleted."}

@app.get("/resumes/")
async def get_all_indexed_resumes(user: dict = Depends(get_current_user)):
    results = resume_collection.get()
    return {"resumes": results['ids']}

@app.delete("/resumes/{filename:path}")
async def delete_indexed_resume(filename: str, user: dict = Depends(get_current_user)):
    try:
        resume_collection.delete(ids=[filename])
        return {"status": "success", "message": f"Resume '{filename}' deleted from vector store."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete resume: {e}")


@app.post("/register/")
async def register_user(user: UserCreate):
    conn = get_db_connection()
    hashed_password = get_password_hash(user.password)
    try:
        conn.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", (user.username, hashed_password))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already registered")
    finally:
        conn.close()
    return {"message": "User created successfully"}


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (form_data.username,)).fetchone()
    conn.close()
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user['username']})
    return {"access_token": access_token, "token_type": "bearer", "username": user['username']}


@app.post("/index/")
async def index_resume(resume_file: UploadFile, user: dict = Depends(get_current_user)):
    file_path = os.path.join("temp_uploads", resume_file.filename)
    with open(file_path, "wb") as buffer: shutil.copyfileobj(resume_file.file, buffer)
    try:
        resume_text = extract_text(file_path)
        resume_embedding = model.encode(resume_text).tolist()
        resume_collection.add(
            embeddings=[resume_embedding],
            documents=[resume_text],
            metadatas=[{"filename": resume_file.filename}],
            ids=[resume_file.filename]
        )
        return {"status": "success", "filename": resume_file.filename, "message": "Resume indexed."}
    finally:
        os.remove(file_path)


@app.post("/evaluate/")
async def evaluate_resume_against_jd(jd_file: UploadFile, resume_file: UploadFile, user: dict = Depends(get_current_user)):
    jd_path = os.path.join("temp_uploads", jd_file.filename)
    resume_path = os.path.join("temp_uploads", resume_file.filename)
    with open(jd_path, "wb") as buffer: shutil.copyfileobj(jd_file.file, buffer)
    with open(resume_path, "wb") as buffer: shutil.copyfileobj(resume_file.file, buffer)
    try:
        jd_content, resume_content = extract_text(jd_path), extract_text(resume_path)
        required_skills = get_skills_from_jd(jd_content)
        hard_score, found_skills = calculate_hard_match(resume_content, required_skills)
        semantic_score = calculate_semantic_match(resume_content, jd_content)
        final_score = calculate_final_score(hard_score, semantic_score)
        score_val = float(f"{final_score:.2f}")
        verdict = "High" if score_val > 80 else "Medium" if score_val > 60 else "Low"
        
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO analysis_results (job_description, resume_filename, final_score, verdict, identified_skills, found_skills) VALUES (?, ?, ?, ?, ?, ?)",
            (jd_file.filename, resume_file.filename, score_val, verdict, json.dumps(required_skills), json.dumps(found_skills))
        )
        conn.commit()
        conn.close()
        
        return {
            "identified_skills": required_skills, "found_skills_in_resume": found_skills,
            "scores": {
                "hard_match_percent": f"{hard_score:.2f}", "semantic_fit_percent": f"{semantic_score:.2f}",
                "final_relevance_score": f"{score_val}", "verdict": verdict
            }
        }
    finally:
        os.remove(jd_path)
        os.remove(resume_path)


@app.post("/feedback/")
async def get_ai_feedback(request: FeedbackRequest, user: dict = Depends(get_current_user)):
    feedback = generate_feedback(
        jd_text=request.jd_text, resume_text=request.resume_text,
        found_skills=request.found_skills, required_skills=request.required_skills
    )
    return {"feedback": feedback}


@app.get("/jobs/")
async def get_all_jobs():
    conn = get_db_connection()
    jobs = conn.execute("SELECT DISTINCT job_description FROM analysis_results ORDER BY job_description").fetchall()
    conn.close()
    return [job['job_description'] for job in jobs]


@app.get("/results/{job_description:path}")
async def get_results_for_job(job_description: str):
    conn = get_db_connection()
    results = conn.execute(
        "SELECT * FROM analysis_results WHERE job_description = ? ORDER BY final_score DESC", (job_description,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in results]


@app.delete("/history/clear")
async def clear_history(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("DELETE FROM analysis_results")
    conn.commit()
    conn.close()
    return {"status": "success", "message": "All analysis history has been deleted."}


@app.delete("/history/clear/{job_description:path}")
async def clear_job_history(job_description: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("DELETE FROM analysis_results WHERE job_description = ?", (job_description,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"History for job '{job_description}' has been deleted."}


@app.post("/keyword-search/")
async def keyword_search_resumes(request: KeywordSearchRequest):
    search_query = request.keywords if isinstance(request.keywords, str) else " ".join(request.keywords)
    query_embedding = model.encode(search_query).tolist()
    
    results = resume_collection.query(query_embeddings=[query_embedding], n_results=10)
    
    matches = []
    if results and results['ids'][0]:
        for i, doc_id in enumerate(results['ids'][0]):
            distance = results['distances'][0][i]
            similarity_score = 100 / (1 + distance)
            matches.append({"resume_filename": doc_id, "score": f"{similarity_score:.2f}"})
    
    return {"status": "success", "top_matches": matches}


@app.post("/analyze-bulk/")
async def analyze_bulk(
    jd_file: UploadFile, 
    resume_files: Annotated[List[UploadFile], File(description="List of resumes to analyze")],
    user: dict = Depends(get_current_user)
):
    jd_path = os.path.join("temp_uploads", jd_file.filename)
    with open(jd_path, "wb") as buffer: shutil.copyfileobj(jd_file.file, buffer)
    jd_content = extract_text(jd_path)
    required_skills = get_skills_from_jd(jd_content)

    results_list = []
    conn = get_db_connection()
    
    try:
        for resume_file in resume_files:
            resume_path = os.path.join("temp_uploads", resume_file.filename)
            with open(resume_path, "wb") as buffer: shutil.copyfileobj(resume_file.file, buffer)
            
            try:
                resume_content = extract_text(resume_path)
                hard_score, found_skills = calculate_hard_match(resume_content, required_skills)
                semantic_score = calculate_semantic_match(resume_content, jd_content)
                final_score = calculate_final_score(hard_score, semantic_score)
                score_val = float(f"{final_score:.2f}")
                verdict = "High" if score_val > 80 else "Medium" if score_val > 60 else "Low"

                conn.execute(
                    "INSERT INTO analysis_results (job_description, resume_filename, final_score, verdict, identified_skills, found_skills) VALUES (?, ?, ?, ?, ?, ?)",
                    (jd_file.filename, resume_file.filename, score_val, verdict, json.dumps(required_skills), json.dumps(found_skills))
                )
                conn.commit()
                
                results_list.append({
                    "resume_filename": resume_file.filename,
                    "final_score": score_val,
                    "verdict": verdict,
                    "found_skills": found_skills
                })
            except Exception as e:
                print(f"Error processing {resume_file.filename}: {e}")
            finally:
                os.remove(resume_path)
    finally:
        os.remove(jd_path)
        conn.close()
    
    results_list.sort(key=lambda x: x['final_score'], reverse=True)
    return {"status": "success", "results": results_list}


# --- Serve React frontend build ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Serve static assets
app.mount("/static", StaticFiles(directory="frontend/dist/assets"), name="static")

# Catch-all route for React
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    index_path = os.path.join("frontend", "dist", "index.html")
    return FileResponse(index_path)
