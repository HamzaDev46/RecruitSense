import io
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile, status
from fastapi.responses import JSONResponse

from services.pdf_extractor import extract_text_from_pdf
from services.skill_extractor import extract_skills_from_text, match_required_skills
from services.similarity_calculator import calculate_similarity
from services.course_recommender import get_recommended_course

resume_router = APIRouter(tags=["Resume Analysis"])


@resume_router.post("/extract-text")
async def extract_text(resume: UploadFile = File(...)):
    """
    Accepts a PDF file upload and returns extracted text.
    """
    if not resume.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No file selected"}
        )

    if not resume.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only PDF files are supported"}
        )

    try:
        text = extract_text_from_pdf(resume)

        if not text:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"error": "Could not extract text from PDF"}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Text extracted successfully",
                "extracted_text": text,
                "character_count": len(text)
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )


@resume_router.post("/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...),
    required_skills: str = Form(...),
    job_description: str = Form(...)
):
    """
    Main AI endpoint:
    - Extracts text from PDF
    - Matches company required skills
    - Finds bonus skills (from pre-defined list)
    - Calculates Dense Semantic & Hybrid Cosine similarity score
    - Returns skill gap analysis with course recommendations
    """
    if not resume.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No file selected"}
        )

    if not resume.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only PDF files are supported"}
        )

    if not required_skills.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "required_skills field is required"}
        )

    if not job_description.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "job_description field is required"}
        )

    try:
        # Step 1: Extract text from PDF
        resume_text = extract_text_from_pdf(resume)

        if not resume_text:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"error": "Could not extract text from PDF"}
            )

        # Step 2: Parse required skills (comma-separated)
        required_skills_list = [
            s.strip() for s in required_skills.split(",") if s.strip()
        ]

        # Step 3: Match required skills against resume
        skill_match = match_required_skills(resume_text, required_skills_list)

        # Step 4: Extract bonus skills from pre-defined list
        all_resume_skills = extract_skills_from_text(resume_text)
        bonus_skills = [
            s for s in all_resume_skills
            if s.lower() not in [r.lower() for r in skill_match["matched"]]
        ]

        # Step 5: Calculate skill gap score
        total_required = len(required_skills_list)
        matched_count = len(skill_match["matched"])
        skill_gap_score = round((matched_count / total_required) * 100, 2) if total_required > 0 else 0

        # Step 6: Generate detailed course recommendations for missing skills
        skill_gaps_detailed = [
            get_recommended_course(skill) for skill in skill_match["missing"]
        ]

        # Step 7: Calculate Hybrid Cosine Similarity
        similarity_score = calculate_similarity(resume_text, job_description)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Resume analyzed successfully",
                "similarity_score": similarity_score,
                "skill_gap_score": skill_gap_score,
                "matched_skills": skill_match["matched"],
                "missing_skills": skill_match["missing"],
                "skill_gaps_detailed": skill_gaps_detailed,
                "bonus_skills": bonus_skills,
                "total_required_skills": total_required,
                "matched_count": matched_count,
                "extracted_text": resume_text
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )