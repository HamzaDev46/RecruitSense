from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_similarity(resume_text: str, job_description: str) -> float:
    """
    Calculates cosine similarity between resume text and job description
    using TF-IDF vectorization.
    Returns similarity score as percentage (0-100).
    """
    if not resume_text or not job_description:
        return 0.0

    vectorizer = TfidfVectorizer(stop_words='english')

    try:
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0