import os
from typing import Optional, Dict, Any
import requests
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

OLLAMA_EMBED_URL = os.getenv("OLLAMA_EMBED_URL", "http://127.0.0.1:11434/api/embed")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")


def _get_ollama_embedding(text: str, timeout: int = 10) -> Optional[np.ndarray]:
    """
    Fetches vector embedding from local Ollama nomic-embed-text model.
    """
    try:
        # Take first 2000 chars for fast and dense embedding representation
        truncated_text = text[:2000]
        response = requests.post(
            OLLAMA_EMBED_URL,
            json={
                "model": EMBED_MODEL,
                "input": truncated_text
            },
            timeout=timeout
        )
        if response.status_code == 200:
            data = response.json()
            embeddings = data.get("embeddings", [])
            if embeddings:
                return np.array(embeddings[0], dtype=np.float32)
    except Exception:
        pass
    return None


def calculate_tfidf_similarity(resume_text: str, job_description: str) -> float:
    """
    Calculates TF-IDF keyword cosine similarity (0 - 100).
    """
    if not resume_text or not job_description:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0


def calculate_semantic_similarity(resume_text: str, job_description: str) -> Optional[float]:
    """
    Calculates Dense Semantic Vector Cosine Similarity using nomic-embed-text (0 - 100).
    Returns None if embedding service is unreachable.
    """
    if not resume_text or not job_description:
        return 0.0

    emb_resume = _get_ollama_embedding(resume_text)
    emb_job = _get_ollama_embedding(job_description)

    if emb_resume is not None and emb_job is not None:
        norm_r = np.linalg.norm(emb_resume)
        norm_j = np.linalg.norm(emb_job)
        if norm_r > 0 and norm_j > 0:
            cosine_sim = np.dot(emb_resume, emb_job) / (norm_r * norm_j)
            # Clip between 0 and 1
            cosine_sim = max(0.0, min(1.0, float(cosine_sim)))
            return round(cosine_sim * 100, 2)

    return None


def calculate_similarity(resume_text: str, job_description: str) -> float:
    """
    Main entry point for backward compatibility with Laravel & Flutter.
    Prioritizes Dense Semantic Embedding (AI Roadmap Topic 11),
    falling back seamlessly to TF-IDF if Ollama is offline.
    """
    semantic_score = calculate_semantic_similarity(resume_text, job_description)
    tfidf_score = calculate_tfidf_similarity(resume_text, job_description)

    if semantic_score is not None:
        # Weighted hybrid: 70% Semantic Deep Meaning + 30% Keyword Matching
        hybrid_score = (semantic_score * 0.7) + (tfidf_score * 0.3)
        return round(hybrid_score, 2)

    return tfidf_score


def calculate_detailed_similarity(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Provides comprehensive similarity breakdown for rich UI reporting.
    """
    semantic_score = calculate_semantic_similarity(resume_text, job_description)
    tfidf_score = calculate_tfidf_similarity(resume_text, job_description)

    if semantic_score is not None:
        hybrid_score = round((semantic_score * 0.7) + (tfidf_score * 0.3), 2)
        method = "hybrid_semantic"
    else:
        hybrid_score = tfidf_score
        method = "tfidf_fallback"

    return {
        "overall_score": hybrid_score,
        "semantic_score": semantic_score,
        "tfidf_score": tfidf_score,
        "method": method
    }