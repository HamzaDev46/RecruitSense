"""
RecruitSense AI Microservice
Hugging Face Gradio + FastAPI Entrypoint
"""
import os
import uvicorn
import gradio as gr
import spaces
import torch
from main import app as fastapi_app

# Official ZeroGPU Initialization
zero = torch.Tensor([0]).cuda()

@spaces.GPU
def gpu_health(n=0):
    return f"🟢 ZeroGPU Online (Tensor: {zero.device})"

# Status dashboard for Hugging Face Space UI
with gr.Blocks(title="RecruitSense AI Engine") as demo:
    gr.Markdown("# 🚀 RecruitSense FastAPI AI Microservice")
    gr.Markdown("### 🟢 AI Engine Status: Online & Healthy")
    
    status_box = gr.Textbox(label="Hardware State", value="Initializing...")
    demo.load(fn=gpu_health, outputs=status_box)

    gr.Markdown("""
    #### 🔗 Available REST API Endpoints:
    - `POST /analyze-resume` - Semantic Matching & Skill Extraction
    - `POST /extract-text` - Resume PDF Text Extraction
    - `POST /generate-quiz` - AI Assessment Quiz Generator
    - `POST /rag/ingest` - Ingest Resume into ChromaDB
    - `POST /rag/query` - Ask Candidate Questions via RAG
    - `GET /health` - Service Health Check
    - `GET /docs` - **Interactive Swagger UI API Documentation**
    """)
    gr.HTML("<a href='/docs' target='_blank' style='display:inline-block;padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;'>Open Swagger /docs 📖</a>")

# Mount Gradio onto the FastAPI application
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
