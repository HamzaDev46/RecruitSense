from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from services.quiz_generator import generate_quiz_questions

quiz_router = APIRouter(tags=["Quiz Generation"])


class QuizGenerateRequest(BaseModel):
    category: Optional[str] = Field(default="Communication", description="Quiz category or skill area")
    count: Optional[int] = Field(default=5, description="Number of questions to generate (1 to 10)")
    job_title: Optional[str] = Field(default=None, description="Job title context")
    required_skills: Optional[str] = Field(default=None, description="Required skills list")


@quiz_router.post("/generate-quiz")
async def generate_quiz(payload: QuizGenerateRequest):
    """
    Generate dynamic MCQs using Ollama LLaMA 3.2 local LLM.
    """
    category = (payload.category or "Communication").strip()
    job_title = (payload.job_title or "").strip()
    required_skills = (payload.required_skills or "").strip()

    count = payload.count or 5
    count = max(1, min(int(count), 10))

    if not category:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "category is required"}
        )

    result = generate_quiz_questions(
        category=category,
        count=count,
        job_title=job_title,
        required_skills=required_skills,
    )

    if result.get("error"):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=result
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result
    )
