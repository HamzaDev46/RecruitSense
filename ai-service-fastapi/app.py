"""
RecruitSense AI Microservice
FastAPI Production Entrypoint (Render & Cloud Deployment)
"""
import os
import uvicorn
from main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print("=" * 60)
    print(f"🚀 RecruitSense FastAPI AI Microservice running on port {port}")
    print(f"📚 Swagger UI Docs: http://0.0.0.0:{port}/docs")
    print(f"📖 ReDoc: http://0.0.0.0:{port}/redoc")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=port)

