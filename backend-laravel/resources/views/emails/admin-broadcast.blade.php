<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }} — RecruitSense</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.15);">

        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #4f46e5, #7c3aed); padding:35px 30px; text-align:center;">
            <div style="display:inline-block; background:rgba(255,255,255,0.18); color:#ffffff; padding:4px 14px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">
                System Announcement
            </div>
            <h1 style="color:#ffffff; margin:0; font-size:24px; letter-spacing:0.5px; font-weight:800;">RecruitSense</h1>
            <p style="color:#e0e7ff; margin:6px 0 0; font-size:13px;">Official Platform Notification</p>
        </div>

        <!-- Body -->
        <div style="padding:35px 30px;">
            <p style="color:#64748b; font-size:14px; margin:0 0 15px 0;">
                Hello <strong>{{ $recipientName ?? ($user->name ?? 'RecruitSense Member') }}</strong> 👋,
            </p>

            <h2 style="color:#0f172a; font-size:20px; margin:0 0 16px 0; font-weight:700; line-height:1.4;">
                {{ $title }}
            </h2>

            <div style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 20px; border-radius:8px; margin:20px 0;">
                <p style="color:#334155; font-size:15px; line-height:1.7; margin:0; white-space:pre-line;">{{ $messageContent }}</p>
            </div>

            <p style="color:#64748b; font-size:13px; line-height:1.6; margin:20px 0 0 0;">
                This notification was dispatched by <strong>{{ $sentBy }}</strong> to keep your RecruitSense account updated regarding platform status and essential announcements.
            </p>

            <div style="text-align:center; margin-top:32px;">
                <a href="{{ $portalUrl }}" style="display:inline-block; background:linear-gradient(135deg, #4f46e5, #7c3aed); color:#ffffff; padding:13px 32px; border-radius:8px; font-size:14px; font-weight:700; text-decoration:none; box-shadow:0 4px 14px rgba(79,70,229,0.35);">
                    Open RecruitSense Portal
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; padding:22px 30px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#64748b; font-size:12px; margin:0 0 6px 0;">
                Questions or urgent issues? Reach our team at <a href="mailto:support@recruitsense.online" style="color:#4f46e5; text-decoration:none; font-weight:600;">support@recruitsense.online</a>
            </p>
            <p style="color:#94a3b8; font-size:11px; margin:0;">
                © {{ date('Y') }} RecruitSense Inc. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>

