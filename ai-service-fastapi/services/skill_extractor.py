import os
import re
import json
import requests

OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://127.0.0.1:11434/api/chat")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.2:3b")

# Pre-defined skills list (General — Multi-industry fallback)
SKILLS_LIST = [
    # Programming Languages
    "python", "java", "javascript", "php", "c++", "c#", "ruby", "swift",
    "kotlin", "typescript", "r", "matlab", "scala", "go", "rust", "dart",
    "c", "html", "css", "sql", "bash", "shell",

    # Web & Mobile Development
    "react", "reactjs", "react native", "flutter", "angular", "vue", "vuejs",
    "node", "nodejs", "laravel", "django", "flask", "fastapi", "spring", "spring boot",
    "express", "expressjs", "bootstrap", "tailwind", "tailwindcss", "jquery",
    "next.js", "nextjs", "nuxt", "svelte",

    # Databases & Caches
    "mysql", "postgresql", "postgres", "mongodb", "sqlite", "redis", "oracle",
    "nosql", "firebase", "firestore", "supabase", "cassandra", "mariadb",

    # Cloud, DevOps & Tools
    "git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp",
    "google cloud", "linux", "rest api", "restful api", "graphql", "postman",
    "jira", "figma", "photoshop", "ci/cd", "jenkins", "terraform",

    # Data Science / AI / ML
    "machine learning", "deep learning", "nlp", "natural language processing",
    "tensorflow", "keras", "pytorch", "scikit-learn", "pandas", "numpy",
    "data analysis", "data science", "artificial intelligence", "computer vision",
    "rag", "langchain", "llamaindex", "chromadb", "vector database", "llm", "genai",

    # Microsoft Office & Productivity
    "ms office", "microsoft office", "excel", "word", "powerpoint",
    "ms excel", "ms word", "power bi", "tableau",

    # Finance & Accounting
    "tally", "quickbooks", "financial reporting", "accounting",
    "bookkeeping", "taxation", "auditing", "budgeting", "forecasting",
    "sap", "oracle financials", "financial analysis",

    # Marketing
    "seo", "sem", "google analytics", "social media marketing",
    "content marketing", "email marketing", "digital marketing",
    "brand management", "market research", "google ads",

    # Soft Skills
    "communication", "teamwork", "leadership", "problem solving",
    "time management", "critical thinking", "project management",
    "customer service", "presentation", "negotiation", "adaptability",
    "creativity", "attention to detail", "multitasking",

    # Other
    "agile", "scrum", "devops", "testing", "debugging", "qa",
    "android", "ios", "crm", "erp",
]


# Skill alias map for intelligent flexible matching
SKILL_ALIASES = {
    "react": ["react", "reactjs", "react.js"],
    "reactjs": ["react", "reactjs", "react.js"],
    "node": ["node", "nodejs", "node.js"],
    "nodejs": ["node", "nodejs", "node.js"],
    "vue": ["vue", "vuejs", "vue.js"],
    "vuejs": ["vue", "vuejs", "vue.js"],
    "angular": ["angular", "angularjs", "angular.js"],
    "tailwind": ["tailwind", "tailwindcss"],
    "tailwindcss": ["tailwind", "tailwindcss"],
    "machine learning": ["machine learning", "ml"],
    "ml": ["machine learning", "ml"],
    "deep learning": ["deep learning", "dl"],
    "dl": ["deep learning", "dl"],
    "natural language processing": ["natural language processing", "nlp"],
    "nlp": ["natural language processing", "nlp"],
    "artificial intelligence": ["artificial intelligence", "ai"],
    "ai": ["artificial intelligence", "ai"],
    "rest api": ["rest api", "rest apis", "restful api", "restful apis", "rest"],
    "ci/cd": ["ci/cd", "cicd", "ci cd"],
    "postgresql": ["postgresql", "postgres", "psql"],
    "postgres": ["postgresql", "postgres", "psql"],
    "golang": ["golang", "go"],
    "go": ["golang", "go"],
    "k8s": ["k8s", "kubernetes"],
    "kubernetes": ["k8s", "kubernetes"],
}


def extract_skills_from_text(text: str) -> list:
    """
    Extracts skills from resume text using fast regex pattern matching.
    Returns a unique list of matched skills (lowercase).
    """
    if not text:
        return []

    text_lower = text.lower()
    matched_skills = []

    for skill in SKILLS_LIST:
        # Match as whole word/phrase
        pattern = r'(?:\b|_)' + re.escape(skill) + r'(?:\b|_)'
        if re.search(pattern, text_lower):
            matched_skills.append(skill)

    return sorted(list(set(matched_skills)))


def match_required_skills(text: str, required_skills: list) -> dict:
    """
    Matches company's required skills against resume text with alias intelligence.
    Returns matched and missing skills.
    """
    if not text:
        return {"matched": [], "missing": required_skills}

    text_lower = text.lower()
    matched = []
    missing = []

    for skill in required_skills:
        skill_clean = skill.strip().lower()
        if not skill_clean:
            continue

        aliases = SKILL_ALIASES.get(skill_clean, [skill_clean])
        is_found = False

        for alias in aliases:
            pattern = r'(?:\b|_)' + re.escape(alias) + r'(?:\b|_)'
            if re.search(pattern, text_lower):
                is_found = True
                break

        if is_found:
            matched.append(skill.strip())
        else:
            missing.append(skill.strip())

    return {
        "matched": matched,
        "missing": missing
    }


def extract_skills_llm(resume_text: str, timeout: int = 15) -> dict | None:
    """
    Uses local Ollama LLM to extract dynamic, structured technical & soft skills
    from any multi-domain resume (engineering, finance, marketing, design, etc.).
    Returns dict or None if LLM is unavailable.
    """
    if not resume_text:
        return None

    prompt = f"""You are an expert HR AI Skill Extractor.
Extract all technical skills, soft skills, and tools mentioned in the following resume text.
Return ONLY a valid JSON object with the following structure, and no extra text or markdown:

{{
  "technical_skills": ["skill1", "skill2"],
  "soft_skills": ["skill1", "skill2"],
  "tools_and_platforms": ["tool1", "tool2"],
  "domain": "Domain name (e.g., Software Engineering, Accounts, Marketing)"
}}

Resume Text:
\"\"\"
{resume_text[:2500]}
\"\"\"
"""
    try:
        response = requests.post(
            OLLAMA_CHAT_URL,
            json={
                "model": CHAT_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "format": "json"
            },
            timeout=timeout
        )
        if response.status_code == 200:
            content = response.json().get("message", {}).get("content", "")
            return json.loads(content)
    except Exception:
        pass

    return None