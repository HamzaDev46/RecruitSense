from flask import Blueprint, jsonify, request
from services.pdf_extractor import extract_text_from_pdf
from services.skill_extractor import extract_skills_from_text, match_required_skills
from services.similarity_calculator import calculate_similarity

resume_bp = Blueprint('resume_bp', __name__)


@resume_bp.route('/extract-text', methods=['POST'])
def extract_text():
    """
    Accepts a PDF file upload and returns extracted text.
    """
    if 'resume' not in request.files:
        return jsonify({"error": "No file uploaded. Use key 'resume'."}), 400

    file = request.files['resume']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        text = extract_text_from_pdf(file)

        if not text:
            return jsonify({"error": "Could not extract text from PDF"}), 422

        return jsonify({
            "message": "Text extracted successfully",
            "extracted_text": text,
            "character_count": len(text)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@resume_bp.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    """
    Main AI endpoint:
    - Extracts text from PDF
    - Matches company required skills
    - Finds bonus skills (from pre-defined list)
    - Calculates TF-IDF cosine similarity score
    - Returns skill gap analysis
    """

    # Validate file
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400

    file = request.files['resume']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    # Validate required fields
    required_skills_raw = request.form.get('required_skills', '')
    job_description = request.form.get('job_description', '')

    if not required_skills_raw:
        return jsonify({"error": "required_skills field is required"}), 400

    if not job_description:
        return jsonify({"error": "job_description field is required"}), 400

    try:
        # Step 1: Extract text from PDF
        resume_text = extract_text_from_pdf(file)

        if not resume_text:
            return jsonify({"error": "Could not extract text from PDF"}), 422

        # Step 2: Parse required skills (comma-separated)
        required_skills_list = [
            s.strip() for s in required_skills_raw.split(',') if s.strip()
        ]

        # Step 3: Match required skills against resume
        skill_match = match_required_skills(resume_text, required_skills_list)

        # Step 4: Extract bonus skills from pre-defined list
        all_resume_skills = extract_skills_from_text(resume_text)
        bonus_skills = [
            s for s in all_resume_skills
            if s.lower() not in [r.lower() for r in skill_match['matched']]
        ]

        # Step 5: Calculate skill gap score
        total_required = len(required_skills_list)
        matched_count = len(skill_match['matched'])
        skill_gap_score = round((matched_count / total_required) * 100, 2) if total_required > 0 else 0

        # Step 6: Calculate TF-IDF Cosine Similarity
        similarity_score = calculate_similarity(resume_text, job_description)

        return jsonify({
            "message": "Resume analyzed successfully",
            "similarity_score": similarity_score,
            "skill_gap_score": skill_gap_score,
            "matched_skills": skill_match['matched'],
            "missing_skills": skill_match['missing'],
            "bonus_skills": bonus_skills,
            "total_required_skills": total_required,
            "matched_count": matched_count,
            "extracted_text": resume_text
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500