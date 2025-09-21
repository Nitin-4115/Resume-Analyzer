# backend/skill_extractor.py
import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import List

load_dotenv()

class SkillExtractor(BaseModel):
    skills: List[str] = Field(description="A list of key skills.")

def get_skills_from_jd(jd_text: str) -> List[str]:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.0)
    parser = JsonOutputParser(pydantic_object=SkillExtractor)
    prompt = PromptTemplate(
        template="Extract a list of the most important skills from this job description.\n{format_instructions}\nJob Description:\n{jd}\n",
        input_variables=["jd"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    chain = prompt | llm | parser
    try:
        return chain.invoke({"jd": jd_text}).get('skills', [])
    except Exception as e:
        print(f"LLM skill extraction failed: {e}")
        return []
def generate_feedback(jd_text: str, resume_text: str, found_skills: List[str], required_skills: List[str]) -> str:
    """Uses an LLM to generate personalized feedback for a candidate."""
    
    missing_skills = list(set(required_skills) - set(found_skills))
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.5)

    prompt = PromptTemplate(
        template="""
        You are an expert career coach for Innomatics Research Labs in Bengaluru.
        Your task is to provide concise, actionable feedback for a candidate.

        Analyze the following Job Description and the key skills found in the candidate's resume.
        The candidate is missing these specific skills: {missing_skills}.

        Provide 3 constructive, numbered bullet points of advice for the candidate.
        Focus on how they can better align their resume with this type of job role.
        Keep the tone encouraging and professional.

        JOB DESCRIPTION:
        ---
        {jd}
        ---

        CANDIDATE'S MATCHED SKILLS:
        ---
        {found_skills}
        ---
        """,
        input_variables=["jd", "found_skills", "missing_skills"],
    )

    chain = prompt | llm
    
    try:
        response_content = chain.invoke({
            "jd": jd_text,
            "found_skills": ", ".join(found_skills),
            "missing_skills": ", ".join(missing_skills) if missing_skills else "None"
        }).content
        return response_content
    except Exception as e:
        print(f"LLM feedback generation failed: {e}")
        return "Could not generate feedback at this time."