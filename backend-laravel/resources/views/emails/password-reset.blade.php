<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset your RecruitSense password</title>
</head>
<body style="margin:0; padding:0; background:#f4f6fb; font-family:Arial, sans-serif; color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb; padding:32px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:18px; overflow:hidden;">
                    <tr>
                        <td style="padding:28px 30px; background:#4f46e5; color:#ffffff;">
                            <h1 style="margin:0; font-size:24px;">Reset your password</h1>
                            <p style="margin:8px 0 0; color:#e0e7ff;">RecruitSense account security</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px;">
                            <p style="margin:0 0 14px;">Hi {{ $user->name }},</p>
                            <p style="margin:0 0 22px; line-height:1.6; color:#4b5563;">
                                We received a request to reset your RecruitSense password. Use the button below to create a new password.
                            </p>
                            <p style="margin:0 0 28px;">
                                <a href="{{ $resetUrl }}" style="display:inline-block; background:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:12px; font-weight:700;">
                                    Reset password
                                </a>
                            </p>
                            <p style="margin:0 0 10px; line-height:1.6; color:#6b7280; font-size:14px;">
                                This link expires automatically. If you did not request this, you can ignore this email.
                            </p>
                            <p style="margin:18px 0 0; line-height:1.6; color:#6b7280; font-size:13px;">
                                If the button does not work, open this link:<br>
                                <a href="{{ $resetUrl }}" style="color:#4f46e5;">{{ $resetUrl }}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
