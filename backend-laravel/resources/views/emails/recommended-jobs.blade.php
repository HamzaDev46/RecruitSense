<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Recommended Jobs for You — RecruitSense</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Arial, sans-serif;">
    <div style="max-width:620px; margin:40px auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.15);">

        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #0ea5e9, #4f46e5); padding:35px 30px; text-align:center;">
            <div style="display:inline-block; background:rgba(255,255,255,0.2); color:#ffffff; padding:4px 14px; border-radius:50px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">
                AI-Powered Job Matches
            </div>
            <h1 style="color:#ffffff; margin:0; font-size:24px; letter-spacing:0.5px; font-weight:800;">RecruitSense</h1>
            <p style="color:#e0f2fe; margin:6px 0 0; font-size:13px;">Personalized Career Opportunities for You</p>
        </div>

        <!-- Body -->
        <div style="padding:32px 28px;">
            <h2 style="color:#0f172a; font-size:20px; margin:0 0 10px 0; font-weight:700;">
                Hello {{ $user->name }} 👋
            </h2>

            <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 24px 0;">
                Based on your resume skills and profile background, our AI matching engine picked these high-affinity positions that match your strengths:
            </p>

            <!-- Job Cards List -->
            <div style="margin-bottom:28px;">
                @forelse($recommendations as $item)
                    @php
                        $job = is_array($item['job']) ? (object)$item['job'] : $item['job'];
                        $company = is_object($job->company ?? null) ? $job->company->name : ($job->company['name'] ?? 'Verified Employer');
                        $score = $item['match_score'] ?? 0;
                        $matched = array_slice($item['matched_skills'] ?? [], 0, 3);
                    @endphp
                    <div style="border:1px solid #e2e8f0; border-radius:10px; padding:18px 20px; margin-bottom:14px; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td valign="top">
                                    <h3 style="color:#0f172a; font-size:16px; margin:0 0 4px 0; font-weight:700;">
                                        {{ $job->title ?? 'Open Position' }}
                                    </h3>
                                    <p style="color:#64748b; font-size:13px; margin:0 0 8px 0; font-weight:500;">
                                        {{ $company }} • <span style="color:#0284c7;">{{ $job->location ?? 'Remote / On-site' }}</span>
                                    </p>
                                    @if(!empty($matched))
                                        <div style="margin-top:6px;">
                                            @foreach($matched as $skill)
                                                <span style="display:inline-block; background:#f0f9ff; color:#0369a1; border:1px solid #bae6fd; font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; margin-right:4px; margin-bottom:4px;">
                                                    ✓ {{ $skill }}
                                                </span>
                                            @endforeach
                                        </div>
                                    @endif
                                </td>
                                <td valign="top" align="right" style="width:90px; text-align:right;">
                                    <div style="display:inline-block; background:#ecfdf5; border:1px solid #a7f3d0; color:#059669; font-weight:800; font-size:13px; padding:6px 10px; border-radius:8px;">
                                        {{ $score }}% Match
                                    </div>
                                    <div style="margin-top:12px;">
                                        <a href="{{ $portalUrl }}/jobs" style="display:inline-block; background:#0ea5e9; color:#ffffff; font-size:12px; font-weight:700; padding:6px 14px; border-radius:6px; text-decoration:none;">
                                            Apply
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                @empty
                    <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:24px; text-align:center;">
                        <p style="color:#64748b; font-size:14px; margin:0;">
                            New jobs are posted daily! Visit your dashboard to explore current openings.
                        </p>
                    </div>
                @endforelse
            </div>

            <!-- Main CTA -->
            <div style="text-align:center; margin-top:28px;">
                <a href="{{ $portalUrl }}/recommended" style="display:inline-block; background:linear-gradient(135deg, #0ea5e9, #4f46e5); color:#ffffff; padding:13px 32px; border-radius:8px; font-size:14px; font-weight:700; text-decoration:none; box-shadow:0 4px 14px rgba(14,165,233,0.35);">
                    View All Matching Jobs
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; padding:22px 30px; text-align:center; border-top:1px solid #e2e8f0;">
            <p style="color:#64748b; font-size:12px; margin:0 0 6px 0;">
                You received this email because you are a registered job seeker on RecruitSense.
            </p>
            <p style="color:#94a3b8; font-size:11px; margin:0;">
                © {{ date('Y') }} RecruitSense Inc. — AI-Powered Recruitment Decision Support
            </p>
        </div>

    </div>
</body>
</html>

