import json
import os

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


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


def generate_quiz_questions(category, count=5, job_title='', required_skills=''):
    api_key = os.getenv('OPENAI_API_KEY')

    if OpenAI is None:
        return {"error": "OpenAI SDK is not installed. Run pip install -r requirements.txt."}

    if not api_key:
        return {"error": "OPENAI_API_KEY is not configured in the AI service environment."}

    model = os.getenv('OPENAI_QUIZ_MODEL', 'gpt-5-mini')
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
