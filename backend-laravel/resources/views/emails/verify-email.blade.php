<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify your email address - RecruitSense</title>
</head>
<body style="margin:0; padding:0; background:#f4f6fb; font-family:Arial, sans-serif; color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb; padding:32px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="padding:28px 30px; background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color:#ffffff;">
                            <h1 style="margin:0; font-size:24px; font-weight:800;">Recruit<span style="color:#c7d2fe;">Sense</span></h1>
                            <p style="margin:8px 0 0; color:#e0e7ff; font-size:15px;">Account Activation & Security Verification</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 30px;">
                            <p style="margin:0 0 14px; font-size:16px; font-weight:600; color:#111827;">Hello {{ $user->name }},</p>
                            <p style="margin:0 0 20px; line-height:1.6; color:#4b5563; font-size:15px;">
                                Thank you for creating an account on <strong>RecruitSense</strong> as a <strong>{{ ucfirst($user->role) }}</strong>.
                            </p>
                            <p style="margin:0 0 24px; line-height:1.6; color:#4b5563; font-size:15px;">
                                To protect your account and ensure platform security, please verify your email address by clicking the activation button below:
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                                <tr>
                                    <td align="center" style="border-radius:12px; background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
                                        <a href="{{ $verifyUrl }}" target="_blank" style="display:inline-block; color:#ffffff; text-decoration:none; padding:14px 28px; font-weight:700; font-size:15px; border-radius:12px;">
                                            Verify & Activate Account &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 12px; line-height:1.6; color:#6b7280; font-size:13px;">
                                This activation link is valid for <strong>24 hours</strong>. If you did not create this account, no further action is required.
                            </p>
                            <hr style="border:none; border-top:1px solid #f3f4f6; margin:24px 0;">
                            <p style="margin:0; line-height:1.6; color:#9ca3af; font-size:12px;">
                                If the button above doesn't work, copy and paste this URL into your browser:<br>
                                <a href="{{ $verifyUrl }}" style="color:#4f46e5; word-break:break-all;">{{ $verifyUrl }}</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 30px; background:#f9fafb; text-align:center; color:#9ca3af; font-size:12px; border-top:1px solid #f3f4f6;">
                            &copy; {{ date('Y') }} RecruitSense AI Recruitment Platform. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
