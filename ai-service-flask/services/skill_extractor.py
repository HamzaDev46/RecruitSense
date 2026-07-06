import re

# Pre-defined skills list (General — Multi-industry)
SKILLS_LIST = [
    # Programming Languages
    "python", "java", "javascript", "php", "c++", "c#", "ruby", "swift",
    "kotlin", "typescript", "r", "matlab", "scala", "go", "rust",

    # Web Development
    "html", "css", "react", "reactjs", "angular", "vue", "vuejs",
    "node", "nodejs", "laravel", "django", "flask", "spring", "express",
    "bootstrap", "tailwind", "jquery",

    # Databases
    "mysql", "postgresql", "mongodb", "sqlite", "redis", "oracle",
    "sql", "nosql", "firebase",

    # Tools & Technologies
    "git", "github", "docker", "kubernetes", "aws", "azure", "linux",
    "rest api", "graphql", "postman", "jira", "figma", "photoshop",

    # Data Science / AI
    "machine learning", "deep learning", "nlp", "tensorflow", "keras",
    "scikit-learn", "pandas", "numpy", "data analysis", "data science",
    "artificial intelligence", "computer vision",

    # Microsoft Office
    "ms office", "microsoft office", "excel", "word", "powerpoint",
    "ms excel", "ms word",

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
    "agile", "scrum", "devops", "ci/cd", "testing", "debugging",
    "android", "ios", "flutter", "crm", "erp",
]


def extract_skills_from_text(text: str) -> list:
    """
    Extracts skills from resume text using pre-defined skills list.
    Returns a list of matched skills (lowercase, unique).
    """
    text_lower = text.lower()
    matched_skills = []

    for skill in SKILLS_LIST:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            matched_skills.append(skill)

    return list(set(matched_skills))


def match_required_skills(text: str, required_skills: list) -> dict:
    """
    Matches company's required skills against resume text.
    Returns matched and missing skills.
    """
    text_lower = text.lower()
    matched = []
    missing = []

    for skill in required_skills:
        skill_clean = skill.strip().lower()
        pattern = r'\b' + re.escape(skill_clean) + r'\b'
        if re.search(pattern, text_lower):
            matched.append(skill.strip())
        else:
            missing.append(skill.strip())

    return {
        "matched": matched,
        "missing": missing
    }