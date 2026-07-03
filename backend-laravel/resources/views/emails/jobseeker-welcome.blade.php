<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to RecruitSense</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #4f46e5, #7c3aed); padding:35px 30px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:0.5px;">RecruitSense</h1>
            <p style="color:#e0e7ff; margin:5px 0 0; font-size:13px;">AI-Powered Recruitment Decision Support</p>
        </div>

        <!-- Body -->
        <div style="padding:35px 30px;">
            <h2 style="color:#1e293b; font-size:20px; margin-top:0;">Welcome aboard, {{ $user->name }} 👋</h2>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                You've successfully joined RecruitSense as a <strong>Job Seeker</strong>. Our platform uses NLP-driven resume analysis and intelligent matching to connect you with the right opportunities — faster and smarter.
            </p>

            <div style="background:#f1f5f9; border-left:4px solid #4f46e5; padding:16px 20px; border-radius:6px; margin:25px 0;">
                <p style="margin:0; color:#334155; font-size:14px; font-weight:600;">Your next steps:</p>
                <ul style="color:#475569; font-size:14px; line-height:1.8; margin:10px 0 0; padding-left:18px;">
                    <li>Complete your profile</li>
                    <li>Upload your resume for AI analysis</li>
                    <li>Browse and apply to job postings</li>
                    <li>Take the soft-skill assessment quiz</li>
                </ul>
            </div>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                We're glad to have you with us. Let's find your next opportunity together.
            </p>

            <div style="text-align:center; margin-top:30px;">
                <span style="display:inline-block; background:#4f46e5; color:#ffffff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    Let's Get Started
                </span>
            </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">
                © {{ date('Y') }} RecruitSense — Smarter Hiring, Better Matches
            </p>
        </div>

    </div>
</body>
</html>