from flask import Blueprint, jsonify, request
from services.pdf_extractor import extract_text_from_pdf

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
            return jsonify({"error": "Could not extract any text from this PDF"}), 422

        return jsonify({
            "message": "Text extracted successfully",
            "extracted_text": text,
            "character_count": len(text)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500