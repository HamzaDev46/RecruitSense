<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Complete Your Profile — RecruitSense</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Arial, sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.15);">

        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef); padding:35px 30px; text-align:center;">
            <div style="display:inline-block; background:rgba(255,255,255,0.22); color:#ffffff; padding:4px 14px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">
                Profile Strength Alert
            </div>
            <h1 style="color:#ffffff; margin:0; font-size:24px; letter-spacing:0.5px; font-weight:800;">RecruitSense</h1>
            <p style="color:#f3e8ff; margin:6px 0 0; font-size:13px;">Boost Your Visibility to Top Employers</p>
        </div>

        <!-- Body -->
        <div style="padding:35px 30px;">
            <h2 style="color:#0f172a; font-size:20px; margin:0 0 12px 0; font-weight:700;">
                Hi {{ $user->name }} 👋
            </h2>

            <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 20px 0;">
                We noticed your candidate profile is currently <strong>{{ $completion }}% complete</strong>. Profiles with 80%+ completion receive up to <strong>4x more interview invitations</strong> and rank higher in automated AI employer searches.
            </p>

            <!-- Visual Progress Bar -->
            <div style="background:#f1f5f9; border-radius:12px; padding:18px 20px; margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="font-size:13px; font-weight:700; color:#1e293b;">Profile Completion</span>
                    <span style="font-size:13px; font-weight:800; color:#6366f1; float:right;">{{ $completion }}%</span>
                </div>
                <div style="background:#e2e8f0; height:10px; border-radius:5px; overflow:hidden; clear:both; margin-top:6px;">
                    <div style="background:linear-gradient(90deg, #6366f1, #a855f7); width:{{ max(5, min(100, $completion)) }}%; height:10px; border-radius:5px;"></div>
                </div>
            </div>

            <!-- Missing Steps Checklist -->
            @if(!empty($missingTasks))
                <div style="border:1px solid #e2e8f0; border-radius:10px; padding:18px 20px; margin-bottom:26px; background:#fafafa;">
                    <p style="color:#1e293b; font-size:13px; font-weight:700; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:0.5px;">
                        Quick actions to hit 100%:
                    </p>
                    <ul style="margin:0; padding:0 0 0 18px; color:#475569; font-size:13px; line-height:1.8;">
                        @foreach($missingTasks as $task)
                            <li>
                                <strong>{{ $task['task'] ?? 'Add details' }}</strong>
                                @if(!empty($task['description']))
                                    <span style="color:#64748b;">— {{ $task['description'] }}</span>
                                @endif
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 24px 0;">
                It only takes 2 minutes to add your skills and upload your resume. Let companies find you today!
            </p>

            <!-- CTA Button -->
            <div style="text-align:center; margin-top:28px;">
                <a href="{{ $portalUrl }}/profile" style="display:inline-block; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#ffffff; padding:13px 32px; border-radius:8px; font-size:14px; font-weight:700; text-decoration:none; box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                    Complete My Profile
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; padding:22px 30px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#64748b; font-size:12px; margin:0 0 6px 0;">
                Need assistance? Feel free to reach out to us at <a href="mailto:support@recruitsense.online" style="color:#6366f1; text-decoration:none; font-weight:600;">support@recruitsense.online</a>
            </p>
            <p style="color:#94a3b8; font-size:11px; margin:0;">
                © {{ date('Y') }} RecruitSense Inc. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>

