<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to RecruitSense</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #0891b2, #0e7490); padding:35px 30px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:0.5px;">RecruitSense</h1>
            <p style="color:#cffafe; margin:5px 0 0; font-size:13px;">AI-Powered Recruitment Decision Support</p>
        </div>

        <!-- Body -->
        <div style="padding:35px 30px;">
            <h2 style="color:#1e293b; font-size:20px; margin-top:0;">Welcome, {{ $user->name }} 🏢</h2>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                Your company account has been successfully created on RecruitSense. You now have access to AI-powered candidate matching, explainable scoring, and skill-gap insights to help you make smarter hiring decisions.
            </p>

            <div style="background:#f0fdfa; border-left:4px solid #0891b2; padding:16px 20px; border-radius:6px; margin:25px 0;">
                <p style="margin:0; color:#334155; font-size:14px; font-weight:600;">What you can do now:</p>
                <ul style="color:#475569; font-size:14px; line-height:1.8; margin:10px 0 0; padding-left:18px;">
                    <li>Complete your company profile</li>
                    <li>Post your first job opening</li>
                    <li>Review AI-ranked candidates</li>
                    <li>Shortlist top matches with transparent scoring</li>
                </ul>
            </div>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                We're excited to support your hiring journey with smarter, data-driven decisions.
            </p>

            <div style="text-align:center; margin-top:30px;">
                <span style="display:inline-block; background:#0891b2; color:#ffffff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    Post Your First Job
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