import json
import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://127.0.0.1:11434/api/chat")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.2:3b")


def _clean_question(raw_question, fallback_category):
    category = str(raw_question.get('category') or fallback_category).strip()
    question_text = str(raw_question.get('question_text') or '').strip()
    correct_answer = str(raw_question.get('correct_answer') or '').strip()

    options = raw_question.get('options') or []
    options = [str(option).strip() for option in options if str(option).strip()]
    options = list(dict.fromkeys(options))

    if not question_text or len(options) != 4 or correct_answer not in options:
        return None

    return {
        "category": category,
        "question_text": question_text,
        "options": options,
        "correct_answer": correct_answer,
    }


def generate_quiz_groq(category: str, count: int = 5, job_title: str = '', required_skills: str = '', timeout: int = 15) -> dict:
    """
    Generates professional multiple-choice questions using Groq Cloud API (LPU Inference).
    Speed: ~0.5 - 1.0s (Blazing fast, 100% Free).
    """
    GROQ_API_KEY = None
    api_key = os.getenv("GROQ_API_KEY", "").strip() or GROQ_API_KEY
    if not api_key:
        return {"error": "GROQ_API_KEY is not configured."}

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    prompt = f"""You are an expert recruiter and assessment creator for RecruitSense.
Generate exactly {count} high-quality, professional multiple-choice questions for candidate screening.
Category: {category}
Job Title Context: {job_title or 'General Professional'}
Required Skills Context: {required_skills or 'Workplace soft skills & technical acumen'}

Rules:
1. Each question must test situational judgment, workplace behavior, or practical competence.
2. Each question must have EXACTLY 4 distinct options.
3. The "correct_answer" must exactly match one of the 4 options verbatim.
4. Return ONLY valid JSON with this exact schema:

{{
  "questions": [
    {{
      "category": "{category}",
      "question_text": "Question text here?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option A"
    }}
  ]
}}
"""

    try:
        response = requests.post(
            GROQ_CHAT_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a professional HR assessment engine. You output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_tokens": 1500
            },
            timeout=timeout
        )

        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            payload = json.loads(content)
            questions_raw = payload.get("questions", [])

            seen = set()
            cleaned_questions = []

            for q in questions_raw:
                cleaned = _clean_question(q, category)
                if cleaned:
                    key = cleaned["question_text"].lower()
                    if key not in seen:
                        seen.add(key)
                        cleaned_questions.append(cleaned)

            if cleaned_questions:
                return {
                    "questions": cleaned_questions[:count],
                    "source": f"groq_cloud ({model})"
                }
        else:
            return {"error": f"Groq API returned status {response.status_code}: {response.text}"}

    except Exception as e:
        return {"error": f"Groq quiz generation failed: {str(e)}"}

    return {"error": "Groq returned no valid quiz questions."}


def generate_quiz_ollama(category: str, count: int = 5, job_title: str = '', required_skills: str = '', timeout: int = 60) -> dict:
    """
    Generates professional multiple-choice questions using local Ollama (Llama 3.2 3B).
    100% Free, Offline, and Zero API Cost.
    """
    prompt = f"""You are an expert recruiter and assessment creator for RecruitSense.
Generate exactly {count} professional multiple-choice questions for candidate screening in category: {category}.
Job Title: {job_title or 'General Role'}
Required Skills: {required_skills or 'General Skills'}

Rules:
1. Each question must have EXACTLY 4 options.
2. The correct_answer must exactly match one of the 4 options.
3. Return ONLY valid JSON with this exact structure:

{{
  "questions": [
    {{
      "category": "{category}",
      "question_text": "Question here?",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correct_answer": "Option 1"
    }}
  ]
}}
"""

    try:
        response = requests.post(
            OLLAMA_CHAT_URL,
            json={
                "model": CHAT_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json"
            },
            timeout=timeout
        )
        if response.status_code == 200:
            content = response.json().get("message", {}).get("content", "")
            payload = json.loads(content)
            questions_raw = payload.get("questions", [])

            seen = set()
            cleaned_questions = []

            for q in questions_raw:
                cleaned = _clean_question(q, category)
                if cleaned:
                    key = cleaned["question_text"].lower()
                    if key not in seen:
                        seen.add(key)
                        cleaned_questions.append(cleaned)

            if cleaned_questions:
                return {
                    "questions": cleaned_questions[:count],
                    "source": "ollama_local"
                }

    except Exception as e:
        return {"error": f"Ollama quiz generation failed: {str(e)}"}

    return {"error": "Ollama returned no valid quiz questions."}


def generate_quiz_openai(category: str, count: int = 5, job_title: str = '', required_skills: str = '') -> dict:
    """
    Generates questions using OpenAI API.
    """
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or "sk-proj" not in api_key:
        return {"error": "OPENAI_API_KEY is not configured."}

    model = os.getenv('OPENAI_QUIZ_MODEL', 'gpt-4o-mini')

    prompt = (
        f"Create {count} professional multiple-choice quiz questions for candidate screening.\n"
        f"Category: {category}\n"
        f"Job title context: {job_title or 'General hiring'}\n"
        f"Required skills context: {required_skills or 'General workplace soft skills'}\n\n"
        "Rules:\n"
        "- Each question must test judgment, behavior, or workplace decision-making.\n"
        "- Each question must have exactly 4 answer options.\n"
        "- correct_answer must exactly match one option.\n"
        "- Return JSON object with 'questions' list."
    )

    try:
        res = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            },
            timeout=20
        )
        if res.status_code == 200:
            payload = json.loads(res.json()["choices"][0]["message"]["content"])
            questions_raw = payload.get('questions', [])
            cleaned_questions = []
            for raw_q in questions_raw:
                c = _clean_question(raw_q, category)
                if c:
                    cleaned_questions.append(c)
            if cleaned_questions:
                return {"questions": cleaned_questions[:count], "source": "openai"}
    except Exception as exc:
        return {"error": str(exc)}

    return {"error": "OpenAI returned no valid questions."}


def _get_smart_fallback_quiz(category: str, count: int = 5) -> dict:
    """
    Guaranteed zero-downtime instant fallback bank.
    Ensures the application never returns 500/503 errors under any circumstances.
    """
    bank = {
        "Communication": [
            {
                "category": "Communication",
                "question_text": "When communicating technical blockers to non-technical stakeholders, what is the best approach?",
                "options": [
                    "Translate technical terms into business impact and estimated resolution timelines",
                    "Forward raw error logs directly to management",
                    "Wait until the deadline has passed to explain the blockage",
                    "Avoid mentioning the issue until a complete fix is deployed"
                ],
                "correct_answer": "Translate technical terms into business impact and estimated resolution timelines"
            },
            {
                "category": "Communication",
                "question_text": "How should a professional handle constructive feedback on a pull request or project deliverable?",
                "options": [
                    "Acknowledge the feedback, ask clarifying questions, and implement agreed improvements",
                    "Immediately reject all suggestions to protect personal pride",
                    "Ignore the comments and merge changes anyway",
                    "Escalate the discussion into an argument"
                ],
                "correct_answer": "Acknowledge the feedback, ask clarifying questions, and implement agreed improvements"
            },
            {
                "category": "Communication",
                "question_text": "What is the most effective way to communicate urgent status updates in a remote or hybrid team?",
                "options": [
                    "Post a structured update in the designated team channel with clear action items",
                    "Send individual vague direct messages to multiple colleagues",
                    "Post subtle hints on social media",
                    "Assume everyone already knows without sending any update"
                ],
                "correct_answer": "Post a structured update in the designated team channel with clear action items"
            },
            {
                "category": "Communication",
                "question_text": "When resolving a disagreement during a sprint planning session, what is the best strategy?",
                "options": [
                    "Focus on data, user requirements, and project priorities to find consensus",
                    "Insist on your personal opinion until others yield",
                    "Leave the meeting abruptly without voting",
                    "Agree passively while refusing to work on the assigned tasks"
                ],
                "correct_answer": "Focus on data, user requirements, and project priorities to find consensus"
            },
            {
                "category": "Communication",
                "question_text": "What is the primary purpose of active listening in client requirements meetings?",
                "options": [
                    "To fully understand the client's underlying business needs before proposing solutions",
                    "To prepare your rebuttal while the client is still talking",
                    "To record notes without engaging or asking questions",
                    "To agree to all requests even if they are technically impossible"
                ],
                "correct_answer": "To fully understand the client's underlying business needs before proposing solutions"
            }
        ],
        "Leadership": [
            {
                "category": "Leadership",
                "question_text": "When leading a team through an unexpected deadline crunch, what is the most effective approach?",
                "options": [
                    "Prioritize core deliverables, remove obstacles, and maintain transparent team morale",
                    "Assign all overtime work exclusively to junior members",
                    "Blame external teams for the aggressive timeline",
                    "Cancel all quality assurance steps without notice"
                ],
                "correct_answer": "Prioritize core deliverables, remove obstacles, and maintain transparent team morale"
            },
            {
                "category": "Leadership",
                "question_text": "How should a team lead foster professional growth among team members?",
                "options": [
                    "Delegate challenging tasks, provide regular mentorship, and recognize accomplishments",
                    "Micromanage every commit and line of code",
                    "Prevent team members from learning new technologies",
                    "Only communicate with the highest-performing team member"
                ],
                "correct_answer": "Delegate challenging tasks, provide regular mentorship, and recognize accomplishments"
            },
            {
                "category": "Leadership",
                "question_text": "What is the best way to handle conflicting priorities between two major stakeholders?",
                "options": [
                    "Facilitate an alignment session reviewing ROI, project goals, and available capacity",
                    "Secretly choose one stakeholder and ignore the other",
                    "Halt all work indefinitely until they resolve it themselves",
                    "Promise identical delivery dates to both without adjusting scope"
                ],
                "correct_answer": "Facilitate an alignment session reviewing ROI, project goals, and available capacity"
            }
        ],
        "Problem Solving": [
            {
                "category": "Problem Solving",
                "question_text": "When encountering an intermittent bug in production, what is the first logical step?",
                "options": [
                    "Analyze logs, reproduce the issue in staging, and identify root cause",
                    "Randomly restart servers until the bug disappears",
                    "Blame user error without investigation",
                    "Delete recent database entries"
                ],
                "correct_answer": "Analyze logs, reproduce the issue in staging, and identify root cause"
            },
            {
                "category": "Problem Solving",
                "question_text": "How should an engineer approach optimizing a slow database query?",
                "options": [
                    "Examine the execution plan, evaluate index coverage, and reduce redundant data retrieval",
                    "Increase server hardware specifications without checking the query",
                    "Remove all WHERE clauses from the SQL statement",
                    "Cache the outdated data permanently"
                ],
                "correct_answer": "Examine the execution plan, evaluate index coverage, and reduce redundant data retrieval"
            },
            {
                "category": "Problem Solving",
                "question_text": "When designing a resilient system architecture, what principle ensures high availability?",
                "options": [
                    "Eliminating single points of failure with redundancy and failover mechanisms",
                    "Hosting the entire application on a single physical workstation",
                    "Disabling all error logging to speed up response times",
                    "Hardcoding all configurations in client code"
                ],
                "correct_answer": "Eliminating single points of failure with redundancy and failover mechanisms"
            }
        ]
    }

    selected_category = category if category in bank else "Communication"
    questions = bank[selected_category]
    return {
        "questions": questions[:count],
        "source": "smart_curated_bank"
    }


def generate_quiz_questions(category: str, count: int = 5, job_title: str = '', required_skills: str = '') -> dict:
    """
    Multi-Tier Ultra-Fast AI Quiz Pipeline:
    1. Tier 1: Groq Cloud LLaMA 3.3 70B (0.5 - 1.0s, 100% Free, High Quality).
    2. Tier 2: Local Ollama LLaMA 3.2 3B (Offline fallback).
    3. Tier 3: OpenAI API (Backup if configured).
    4. Tier 4: Smart Curated Assessment Bank (Guaranteed 0.001s zero-failure).
    """
    # 1. Try Groq Cloud first (Fastest & Free)
    if os.getenv("GROQ_API_KEY", "").strip():
        groq_res = generate_quiz_groq(
            category=category,
            count=count,
            job_title=job_title,
            required_skills=required_skills
        )
        if not groq_res.get("error") and groq_res.get("questions"):
            return groq_res

    # 2. Try Local Ollama as offline backup
    ollama_res = generate_quiz_ollama(
        category=category,
        count=count,
        job_title=job_title,
        required_skills=required_skills,
        timeout=15
    )
    if not ollama_res.get("error") and ollama_res.get("questions"):
        return ollama_res

    # 3. Try OpenAI if configured
    openai_res = generate_quiz_openai(
        category=category,
        count=count,
        job_title=job_title,
        required_skills=required_skills
    )
    if not openai_res.get("error") and openai_res.get("questions"):
        return openai_res

    # 4. Zero-failure Smart Bank fallback
    return _get_smart_fallback_quiz(category=category, count=count)
