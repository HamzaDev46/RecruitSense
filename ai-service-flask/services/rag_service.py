import os
import re
from typing import List, Dict, Optional, Any
import requests
# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from services.pdf_extractor import extract_text_from_pdf

# =========================================================
# CONFIGURATION
# =========================================================
OLLAMA_EMBED_URL = os.getenv("OLLAMA_EMBED_URL", "http://127.0.0.1:11434/api/embed")
OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://127.0.0.1:11434/api/chat")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.2:3b")

CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
COLLECTION_NAME = "resume_documents"


def get_chroma_collection():
    """
    Initializes and returns the persistent ChromaDB collection.
    """
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client.get_or_create_collection(name=COLLECTION_NAME)


def get_embedding(text: str, timeout: int = 60) -> List[float]:
    """
    Generates vector embedding using Ollama nomic-embed-text.
    """
    response = requests.post(
        OLLAMA_EMBED_URL,
        json={
            "model": EMBED_MODEL,
            "input": text[:2000]
        },
        timeout=timeout
    )
    response.raise_for_status()
    data = response.json()
    return data["embeddings"][0]


# =========================================================
# SECTION-AWARE CHUNKING
# =========================================================
SECTION_KEYWORDS = [
    "CONTACT",
    "PERSONAL INFORMATION",
    "OBJECTIVE",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "EDUCATION",
    "ACADEMIC QUALIFICATION",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "SKILLS",
    "TECHNICAL SKILLS",
    "PROJECTS",
    "ACADEMIC PROJECTS",
    "CERTIFICATIONS",
    "COURSES",
    "LANGUAGES",
    "HONORS",
    "AWARDS",
]


def chunk_resume_text(text: str) -> List[Dict[str, str]]:
    """
    Splits resume text into meaningful, section-based chunks.
    """
    if not text:
        return []

    lines = text.split("\n")
    chunks = []
    current_section = "GENERAL INFO"
    current_lines = []

    pattern = r"^(?:[A-Z\s]{3,30}|[0-9]+\.\s+[A-Z\s]{3,30})$"

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue

        upper_line = cleaned_line.upper().replace(":", "")

        is_heading = False
        for kw in SECTION_KEYWORDS:
            if kw in upper_line and (len(cleaned_line) < 40 or re.match(pattern, cleaned_line)):
                is_heading = True
                matched_kw = kw
                break

        if is_heading:
            if current_lines:
                chunk_text = "\n".join(current_lines).strip()
                if len(chunk_text) > 20:
                    chunks.append({
                        "section": current_section,
                        "text": chunk_text
                    })
                current_lines = []
            current_section = matched_kw
        else:
            current_lines.append(cleaned_line)

    if current_lines:
        chunk_text = "\n".join(current_lines).strip()
        if len(chunk_text) > 20:
            chunks.append({
                "section": current_section,
                "text": chunk_text
            })

    # Fallback if text didn't match section headers: chunk by paragraph
    if not chunks:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
        for idx, p in enumerate(paragraphs):
            chunks.append({
                "section": f"PARAGRAPH_{idx + 1}",
                "text": p
            })

    return chunks


# =========================================================
# INGESTION PIPELINE
# =========================================================
def ingest_resume_pdf(file_obj: Any, resume_id: str, filename: str = "resume.pdf") -> Dict[str, Any]:
    """
    Extracts, chunks, embeds, and stores a resume in ChromaDB.
    """
    resume_text = extract_text_from_pdf(file_obj)
    if not resume_text:
        raise ValueError("Could not extract any readable text from the PDF.")

    chunks = chunk_resume_text(resume_text)
    if not chunks:
        raise ValueError("Resume text was too short or could not be chunked.")

    collection = get_chroma_collection()

    # Clean previous chunks for this resume_id to prevent duplicates
    try:
        collection.delete(where={"resume_id": str(resume_id)})
    except Exception:
        pass

    ids = []
    documents = []
    embeddings = []
    metadatas = []

    for index, chunk in enumerate(chunks):
        chunk_id = f"res_{resume_id}_chunk_{index}"
        emb = get_embedding(chunk["text"])

        ids.append(chunk_id)
        documents.append(chunk["text"])
        embeddings.append(emb)
        metadatas.append({
            "resume_id": str(resume_id),
            "source_file": filename,
            "section": chunk["section"],
            "chunk_index": index
        })

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return {
        "status": "success",
        "resume_id": str(resume_id),
        "total_chunks_indexed": len(chunks),
        "sections_detected": list(dict.fromkeys(c["section"] for c in chunks)),
        "character_count": len(resume_text)
    }


# =========================================================
# RAG QUERY & GENERATION PIPELINE
# =========================================================
def ask_resume_rag(question: str, resume_id: Optional[str] = None, top_k: int = 3) -> Dict[str, Any]:
    """
    Answers questions about a candidate's resume using RAG with anti-hallucination grounding.
    """
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    collection = get_chroma_collection()
    query_vector = get_embedding(question)

    query_params: Dict[str, Any] = {
        "query_embeddings": [query_vector],
        "n_results": top_k
    }

    if resume_id is not None and str(resume_id).strip():
        query_params["where"] = {"resume_id": str(resume_id).strip()}

    results = collection.query(**query_params)

    matched_docs = results.get("documents", [[]])[0]
    matched_metas = results.get("metadatas", [[]])[0]
    matched_distances = results.get("distances", [[]])[0] if "distances" in results else []

    if not matched_docs:
        return {
            "question": question,
            "answer": "I could not find any relevant information in the uploaded resume.",
            "sources": [],
            "resume_id": resume_id
        }

    # Assemble structured context
    context_blocks = []
    sources = []
    for idx, doc in enumerate(matched_docs):
        meta = matched_metas[idx] if idx < len(matched_metas) else {}
        section = meta.get("section", "GENERAL")
        context_blocks.append(f"### SECTION: {section}\n{doc}")
        sources.append({
            "section": section,
            "resume_id": meta.get("resume_id", resume_id),
            "distance": matched_distances[idx] if idx < len(matched_distances) else None
        })

    context_str = "\n\n".join(context_blocks)

    # Prompt Engineering with strict anti-hallucination instruction
    prompt = f"""You are an expert, objective AI Resume Analyst for RecruitSense.
Answer the user's question using ONLY the provided resume context below.

Rules:
1. Ground your answer completely on the provided context.
2. If the information is not present or cannot be clearly deduced, state: "I could not find this information in the candidate's resume."
3. Do not invent, speculate, or extrapolate facts.
4. Keep the answer clear, professional, and well-structured.

Resume Context:
----------------------------------------
{context_str}
----------------------------------------

User Question: {question}

Answer:"""

    response = requests.post(
        OLLAMA_CHAT_URL,
        json={
            "model": CHAT_MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "stream": False
        },
        timeout=180
    )
    response.raise_for_status()
    answer_text = response.json().get("message", {}).get("content", "").strip()

    return {
        "question": question,
        "answer": answer_text,
        "sources": sources,
        "resume_id": resume_id
    }


def get_rag_health() -> Dict[str, Any]:
    """
    Returns the status of ChromaDB and local AI models.
    """
    status: Dict[str, Any] = {
        "chromadb_connected": False,
        "total_documents_indexed": 0,
        "ollama_connected": False,
        "models_available": []
    }

    try:
        coll = get_chroma_collection()
        status["chromadb_connected"] = True
        status["total_documents_indexed"] = coll.count()
    except Exception as e:
        status["chromadb_error"] = str(e)

    try:
        res = requests.get("http://127.0.0.1:11434/api/tags", timeout=3)
        if res.status_code == 200:
            status["ollama_connected"] = True
            models = res.json().get("models", [])
            status["models_available"] = [m.get("name") for m in models]
    except Exception:
        pass

    return status
