<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $isHired ? 'You Have Been Hired' : 'Job Offer' }}</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Arial, sans-serif;">
    @php
        $candidateName = $application->jobSeeker->user->name ?? 'Candidate';
        $jobTitle = $application->jobPosting->title ?? 'the role';
        $companyName = $application->jobPosting->company->name ?? 'the company';
        $offerStartDate = $application->offer_start_date
            ?->copy()
            ->timezone(config('app.timezone', 'Asia/Karachi'))
            ->format('M d, Y');
        $offerSentAt = $application->offer_sent_at
            ?->copy()
            ->timezone(config('app.timezone', 'Asia/Karachi'))
            ->format('M d, Y h:i A');
        $hiredAt = $application->hired_at
            ?->copy()
            ->timezone(config('app.timezone', 'Asia/Karachi'))
            ->format('M d, Y h:i A');
        $headerGradient = $isHired
            ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
            : 'linear-gradient(135deg, #4f46e5, #7c3aed)';
        $accentColor = $isHired ? '#0f766e' : '#4f46e5';
        $accentBg = $isHired ? '#f0fdfa' : '#eef2ff';
        $accentText = $isHired ? '#134e4a' : '#312e81';
    @endphp

    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:{{ $headerGradient }}; padding:35px 30px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:0.5px;">RecruitSense</h1>
            <p style="color:#e0f2fe; margin:5px 0 0; font-size:13px;">AI-Powered Recruitment Decision Support</p>
        </div>

        <div style="padding:35px 30px;">
            <h2 style="color:#1e293b; font-size:20px; margin-top:0;">
                {{ $isHired ? 'Congratulations, ' . $candidateName . '!' : 'You have received an offer, ' . $candidateName }}
            </h2>

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                {{ $companyName }} has {{ $isHired ? 'marked you as hired for' : 'sent you an offer update for' }}
                <strong>{{ $jobTitle }}</strong>.
            </p>

            <div style="background:{{ $accentBg }}; border-left:4px solid {{ $accentColor }}; padding:16px 20px; border-radius:6px; margin:25px 0;">
                <p style="margin:0 0 10px; color:{{ $accentText }}; font-size:14px; font-weight:700;">
                    {{ $isHired ? 'Hiring details' : 'Offer details' }}
                </p>
                <table style="width:100%; border-collapse:collapse; color:#475569; font-size:14px; line-height:1.8;">
                    <tr>
                        <td style="font-weight:700; padding:4px 0; width:140px;">Offer</td>
                        <td style="padding:4px 0;">{{ $application->offer_title ?: $jobTitle }}</td>
                    </tr>
                    @if($application->offer_compensation)
                        <tr>
                            <td style="font-weight:700; padding:4px 0;">Compensation</td>
                            <td style="padding:4px 0;">{{ $application->offer_compensation }}</td>
                        </tr>
                    @endif
                    @if($offerStartDate)
                        <tr>
                            <td style="font-weight:700; padding:4px 0;">Start date</td>
                            <td style="padding:4px 0;">{{ $offerStartDate }}</td>
                        </tr>
                    @endif
                    @if($offerSentAt)
                        <tr>
                            <td style="font-weight:700; padding:4px 0;">Offer sent</td>
                            <td style="padding:4px 0;">{{ $offerSentAt }}</td>
                        </tr>
                    @endif
                    @if($isHired && $hiredAt)
                        <tr>
                            <td style="font-weight:700; padding:4px 0;">Hired on</td>
                            <td style="padding:4px 0;">{{ $hiredAt }}</td>
                        </tr>
                    @endif
                </table>
            </div>

            @if($application->offer_notes)
                <div style="background:#f8fafc; padding:16px 20px; border-radius:6px; margin:25px 0;">
                    <p style="margin:0 0 8px; color:#334155; font-size:14px; font-weight:700;">Notes from company</p>
                    <p style="margin:0; color:#475569; font-size:14px; line-height:1.7;">{{ $application->offer_notes }}</p>
                </div>
            @endif

            <p style="color:#475569; font-size:15px; line-height:1.7;">
                Please open your RecruitSense application tracker to review the latest status and any next steps from the company.
            </p>

            <div style="text-align:center; margin-top:30px;">
                <span style="display:inline-block; background:{{ $accentColor }}; color:#ffffff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    View Application Status
                </span>
            </div>
        </div>

        <div style="background:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8; font-size:12px; margin:0;">
                &copy; {{ date('Y') }} RecruitSense - Smarter Hiring, Better Matches
            </p>
        </div>
    </div>
</body>
</html>
