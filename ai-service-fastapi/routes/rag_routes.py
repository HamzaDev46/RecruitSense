from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, File, Form, UploadFile, status
from fastapi.responses import JSONResponse

from services.rag_service import ingest_resume_pdf, ask_resume_rag, get_rag_health

rag_router = APIRouter(prefix="/rag", tags=["RAG Vector Assistant"])


class RagAskRequest(BaseModel):
    question: str = Field(..., description="Query about the candidate or resume")
    resume_id: Optional[str] = Field(default=None, description="Candidate ID or resume reference ID")
    top_k: Optional[int] = Field(default=3, description="Number of context chunks to retrieve (1 to 10)")


@rag_router.post("/ingest")
def ingest_resume(
    resume: UploadFile = File(...),
    resume_id: Optional[str] = Form(None)
):
    """
    Ingests a candidate resume PDF into ChromaDB vector database.
    Form-data:
      - resume (File, required)
      - resume_id (String/Integer, optional - e.g. candidate application ID)
    """
    if not resume.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No file selected."}
        )

    if not resume.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only PDF files are supported for vector indexing."}
        )

    effective_resume_id = resume_id or resume.filename.rsplit(".", 1)[0]

    try:
        result = ingest_resume_pdf(
            file_obj=resume,
            resume_id=str(effective_resume_id),
            filename=resume.filename
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=result
        )

    except ValueError as ve:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": str(ve)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Failed to ingest resume into RAG vector DB: {str(e)}"}
        )


@rag_router.post("/ask")
def ask_rag(payload: RagAskRequest):
    """
    Answers questions about a candidate's resume using RAG.
    JSON Body:
      - question (String, required)
      - resume_id (String, optional - filters to a specific candidate)
      - top_k (Integer, optional - default: 3)
    """
    question = payload.question.strip() if payload.question else ""

    if not question:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Field 'question' is required."}
        )

    top_k = payload.top_k or 3
    top_k = max(1, min(int(top_k), 10))

    try:
        response = ask_resume_rag(
            question=question,
            resume_id=str(payload.resume_id) if payload.resume_id else None,
            top_k=top_k
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response
        )

    except ValueError as ve:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(ve)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "question": question,
                "answer": "I could not retrieve enough details from the resume for this question at this time. Please try asking again or rephrase your question.",
                "sources": [],
                "resume_id": payload.resume_id,
                "degraded": True,
                "warning": str(e)
            }
        )


@rag_router.get("/health")
def rag_status():
    """
    Returns the operational status of ChromaDB and local AI models.
    """
    try:
        status_data = get_rag_health()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=status_data
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
