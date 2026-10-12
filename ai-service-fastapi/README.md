# 🚀 RecruitSense AI Engine

High-performance FastAPI microservice powering Dense Semantic Matching, ChromaDB RAG Vector Store, Skill Extraction, and Quiz Generation for the RecruitSense ATS.

## 🌟 Endpoints
- `GET /` - Service Status & API Directory
- `GET /docs` - Swagger UI API Documentation
- `GET /health` - Liveness Check
- `POST /analyze-resume` - Semantic & Keyword Resume Analysis
- `POST /extract-text` - PDF Text Extraction
- `POST /generate-quiz` - AI Assessment Quiz Generator
- `POST /rag/ingest` - Ingest Resume into ChromaDB Vector Store
- `POST /rag/query` - Ask candidate questions via RAG
- `GET /rag/health` - RAG System Diagnostics
