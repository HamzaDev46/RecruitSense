import os
from dotenv import load_dotenv

load_dotenv()

import uvicorn
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.resume_routes import resume_router
from routes.quiz_routes import quiz_router
from routes.rag_routes import rag_router

app = FastAPI(
    title="RecruitSense AI Engine",
    description="High-performance FastAPI microservice powering Dense Semantic Matching, ChromaDB RAG Vector Store, and Ollama LLaMA 3.2 Quiz Generation for RecruitSense ATS.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend and cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount APIRouters
app.include_router(resume_router)
app.include_router(quiz_router)
app.include_router(rag_router)


@app.api_route("/", methods=["GET", "HEAD"], tags=["System"])
async def root():
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "online",
            "framework": "FastAPI",
            "service": "RecruitSense AI Engine",
            "version": "2.0.0",
            "docs": "/docs",
            "endpoints": [
                "/analyze-resume",
                "/extract-text",
                "/generate-quiz",
                "/rag/ingest",
                "/rag/query",
                "/rag/ask",
                "/rag/health"
            ]
        }
    )


@app.api_route("/health", methods=["GET", "HEAD"], tags=["System"])
async def health_check():
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "healthy",
            "framework": "FastAPI",
            "engine": "RecruitSense AI Microservice v2.0"
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    print("=" * 60)
    print(f"🚀 RecruitSense FastAPI AI Microservice running on port {port}")
    print(f"📚 Swagger UI Docs: http://0.0.0.0:{port}/docs")
    print(f"📖 ReDoc: http://0.0.0.0:{port}/redoc")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=port)
