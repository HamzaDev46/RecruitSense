from flask import Blueprint, jsonify, request
from services.quiz_generator import generate_quiz_questions

quiz_bp = Blueprint('quiz_bp', __name__)


@quiz_bp.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.get_json(silent=True) or {}
    category = str(data.get('category') or 'Communication').strip()
    job_title = str(data.get('job_title') or '').strip()
    required_skills = str(data.get('required_skills') or '').strip()

    try:
        count = int(data.get('count') or 5)
    except (TypeError, ValueError):
        count = 5

    count = max(1, min(count, 10))

    if not category:
        return jsonify({"error": "category is required"}), 400

    result = generate_quiz_questions(
        category=category,
        count=count,
        job_title=job_title,
        required_skills=required_skills,
    )

    if result.get('error'):
        return jsonify(result), 503

    return jsonify(result), 200
