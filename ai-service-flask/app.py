from flask import Flask, jsonify
from flask_cors import CORS
from routes.resume_routes import resume_bp

app = Flask(__name__)
CORS(app)

# Register blueprints (route groups)
app.register_blueprint(resume_bp)


@app.route('/')
def home():
    return jsonify({"message": "RecruitSense AI Service is running"})


@app.route('/health')
def health():
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)