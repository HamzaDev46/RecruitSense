<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Scheduled</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Arial, sans-serif;">
    @php
        $interviewDateTime = $application->interview_scheduled_at
            ?->copy()
            ->timezone(config('app.timezone', 'Asia/Karachi'))
            ->format('M d, Y h:i A');
    @endphp

    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg, #4f46e5, #7c3aed); padding:35px 30px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:0.5px;">RecruitSense</h1>
            <p style="color:#e0e7ff; margin:5px 0 0; font-size:13px;">AI-Powered Recruitment Decision Support</p>
        </div>

        <div style="padding:35px 30px;">
            <h2 style="color:#1e293b; font-size:20px; margin-top:0;">
                {{ $isReschedule ? 'Your interview has been rescheduled' : 'Your interview has been scheduled' }}
            </h2>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                Hi {{ $application->jobSeeker->user->name }}, your interview for
                <strong>{{ $application->jobPosting->title }}</strong> at
                <strong>{{ $application->jobPosting->company->name }}</strong>
                {{ $isReschedule ? 'has been updated.' : 'has been scheduled.' }}
            </p>

            <div style="background:#eef2ff; border-left:4px solid #4f46e5; padding:16px 20px; border-radius:6px; margin:25px 0;">
                <p style="margin:0 0 10px; color:#334155; font-size:14px; font-weight:700;">Interview details</p>
                <table style="width:100%; border-collapse:collapse; color:#475569; font-size:14px; line-height:1.8;">
                    <tr>
                        <td style="font-weight:700; padding:4px 0; width:110px;">Date/time</td>
                        <td style="padding:4px 0;">{{ $interviewDateTime ?? 'Not specified' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight:700; padding:4px 0;">Mode</td>
                        <td style="padding:4px 0;">{{ ucfirst($application->interview_mode ?? 'Interview') }}</td>
                    </tr>
                    @if($application->interview_location)
                        <tr>
                            <td style="font-weight:700; padding:4px 0;">Location</td>
                            <td style="padding:4px 0;">{{ $application->interview_location }}</td>
                        </tr>
                    @endif
                </table>
            </div>

            @if($application->interview_notes)
                <div style="background:#f8fafc; padding:16px 20px; border-radius:6px; margin:25px 0;">
                    <p style="margin:0 0 8px; color:#334155; font-size:14px; font-weight:700;">Notes from company</p>
                    <p style="margin:0; color:#475569; font-size:14px; line-height:1.7;">{{ $application->interview_notes }}</p>
                </div>
            @endif

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                Please check your RecruitSense application page for the latest interview information.
            </p>

            <div style="text-align:center; margin-top:30px;">
                <span style="display:inline-block; background:#4f46e5; color:#ffffff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    View Interview Details
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
