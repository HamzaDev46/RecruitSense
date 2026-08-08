<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Application Update</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg, #475569, #1e293b); padding:35px 30px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:0.5px;">RecruitSense</h1>
            <p style="color:#cbd5e1; margin:5px 0 0; font-size:13px;">AI-Powered Recruitment Decision Support</p>
        </div>

        <div style="padding:35px 30px;">
            <h2 style="color:#1e293b; font-size:20px; margin-top:0;">
                Application update, {{ $application->jobSeeker->user->name }}
            </h2>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                Thank you for applying for the position of
                <strong>{{ $application->jobPosting->title }}</strong> at
                <strong>{{ $application->jobPosting->company->name }}</strong>.
            </p>

            <div style="background:#f8fafc; border-left:4px solid #64748b; padding:16px 20px; border-radius:6px; margin:25px 0;">
                <p style="margin:0; color:#334155; font-size:14px; line-height:1.7;">
                    After reviewing your application, the company has decided not to move forward with your profile for this role.
                </p>
            </div>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                This does not affect your RecruitSense profile. You can continue improving your resume, skills, and applications for future opportunities.
            </p>

            <div style="text-align:center; margin-top:30px;">
                <span style="display:inline-block; background:#475569; color:#ffffff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    View Application Status
                </span>
            </div>
        </div>

        <div style="background:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">
                © {{ date('Y') }} RecruitSense - Smarter Hiring, Better Matches
            </p>
        </div>
    </div>
</body>
</html>
