# backend/scorer.py
from thefuzz import fuzz
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2') 

def calculate_hard_match(resume_text, required_skills):
    score = 0
    found_skills = []
    
    resume_lower = resume_text.lower()
    for skill in required_skills:
        skill_lower = skill.lower()
        
        # Check for direct or close matches and append them to the list
        if skill_lower in resume_lower or fuzz.partial_ratio(skill_lower, resume_lower) > 85:
            score += 1
            # Correction: Append the original skill name, not the lowercase one.
            found_skills.append(skill) 
            
    return ((score / len(required_skills)) * 100 if required_skills else 100), found_skills

def calculate_semantic_match(resume_text, jd_text):
    resume_embedding = model.encode(resume_text)
    jd_embedding = model.encode(jd_text)
    cos_sim = np.dot(resume_embedding, jd_embedding) / (np.linalg.norm(resume_embedding) * np.linalg.norm(jd_embedding))
    return (cos_sim.item() + 1) / 2 * 100

def calculate_final_score(hard_match_score, semantic_match_score, weights=(0.4, 0.6)):
    return (weights[0] * hard_match_score) + (weights[1] * semantic_match_score)