"""
RecruitSense AI Microservice
Main application entry point (FastAPI + Uvicorn)
"""
import os
import uvicorn
from main import app

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print(f"🚀 RecruitSense FastAPI AI Microservice running on http://127.0.0.1:{port}")
    print(f"📚 Swagger UI Docs: http://127.0.0.1:{port}/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
