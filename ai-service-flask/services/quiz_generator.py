import json
import os
import requests

try:
    # pyrefly: ignore [missing-import]
    from openai import OpenAI
except ImportError:
    OpenAI = None

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


def generate_quiz_ollama(category: str, count: int = 5, job_title: str = '', required_skills: str = '', timeout: int = 120) -> dict:
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

    if OpenAI is None:
        return {"error": "OpenAI SDK is not installed."}

    if not api_key:
        return {"error": "OPENAI_API_KEY is not configured."}

    model = os.getenv('OPENAI_QUIZ_MODEL', 'gpt-4.1-mini')
    client = OpenAI(api_key=api_key)

    prompt = (
        f"Create {count} professional multiple-choice quiz questions for candidate screening.\n"
        f"Category: {category}\n"
        f"Job title context: {job_title or 'General hiring'}\n"
        f"Required skills context: {required_skills or 'General workplace soft skills'}\n\n"
        "Rules:\n"
        "- Each question must test judgment, behavior, or workplace decision-making.\n"
        "- Each question must have exactly 4 answer options.\n"
        "- correct_answer must exactly match one option.\n"
        "- Avoid repeated wording.\n"
        "- Keep questions concise and suitable for a recruitment app."
    )

    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "questions": {
                "type": "array",
                "minItems": 1,
                "maxItems": 10,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "category": {"type": "string"},
                        "question_text": {"type": "string"},
                        "options": {
                            "type": "array",
                            "minItems": 4,
                            "maxItems": 4,
                            "items": {"type": "string"},
                        },
                        "correct_answer": {"type": "string"},
                    },
                    "required": ["category", "question_text", "options", "correct_answer"],
                },
            },
        },
        "required": ["questions"],
    }

    try:
        response = client.responses.create(
            model=model,
            input=[
                {
                    "role": "system",
                    "content": "You generate recruitment quiz questions. Return JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "quiz_questions",
                    "schema": schema,
                    "strict": True,
                }
            },
        )

        payload = json.loads(response.output_text)
        seen = set()
        questions = []

        for raw_question in payload.get('questions', []):
            question = _clean_question(raw_question, category)
            if not question:
                continue

            key = question['question_text'].lower()
            if key in seen:
                continue

            seen.add(key)
            questions.append(question)

        if not questions:
            return {"error": "OpenAI returned no valid quiz questions."}

        return {"questions": questions[:count], "source": "openai"}

    except Exception as exc:
        return {"error": str(exc)}


def generate_quiz_questions(category: str, count: int = 5, job_title: str = '', required_skills: str = '') -> dict:
    """
    Main entry point:
    1. First tries local Ollama (Free, zero API cost, offline capable).
    2. If Ollama is offline or unavailable, automatically falls back to OpenAI API.
    3. If OpenAI is also not configured, returns clean fallback error.
    """
    # 1. Try Ollama local first
    ollama_res = generate_quiz_ollama(
        category=category,
        count=count,
        job_title=job_title,
        required_skills=required_skills
    )

    if not ollama_res.get("error") and ollama_res.get("questions"):
        return ollama_res

    # 2. Fallback to OpenAI API if Ollama fails
    openai_res = generate_quiz_openai(
        category=category,
        count=count,
        job_title=job_title,
        required_skills=required_skills
    )

    if not openai_res.get("error") and openai_res.get("questions"):
        return openai_res

    # Return informative error if both fail
    return {
        "error": "Could not generate quiz from Ollama or OpenAI.",
        "ollama_detail": ollama_res.get("error"),
        "openai_detail": openai_res.get("error")
    }
