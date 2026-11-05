<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CloudEmailService
{
    /**
     * Send email verification link to user via HTTPS API or SMTP fallback.
     */
    public static function sendVerification(User $user, string $verifyUrl): bool
    {
        $subject = 'Activate your RecruitSense account - Verify your email';
        $html = view('emails.verify-email', ['user' => $user, 'verifyUrl' => $verifyUrl])->render();

        return self::sendHtml($user->email, $user->name, $subject, $html);
    }

    /**
     * Send password reset link to user.
     */
    public static function sendPasswordReset(User $user, string $resetUrl): bool
    {
        $subject = 'Reset your RecruitSense password';
        $html = view('emails.password-reset', ['user' => $user, 'resetUrl' => $resetUrl])->render();

        return self::sendHtml($user->email, $user->name, $subject, $html);
    }

    /**
     * Send any Mailable instance through the cloud-resilient delivery pipeline.
     */
    public static function sendMailable(string $toEmail, ?string $toName, Mailable $mailable): bool
    {
        try {
            $envelope = $mailable->envelope();
            $subject = $envelope->subject ?? 'Notification from RecruitSense';
            $html = $mailable->render();

            return self::sendHtml($toEmail, $toName ?? strtok($toEmail, '@'), $subject, $html);
        } catch (\Throwable $e) {
            Log::warning("Could not render mailable for {$toEmail}: " . $e->getMessage() . ". Falling back to direct Mail::send.");
            try {
                Mail::to($toEmail)->send($mailable);
                return true;
            } catch (\Throwable $fallbackEx) {
                Log::error("Direct mail sending also failed for {$toEmail}: " . $fallbackEx->getMessage());
                return false;
            }
        }
    }

    /**
     * Send HTML email over HTTPS REST API (Brevo / Resend) or SMTP fallback.
     * Note: Brevo provides 300 free emails/day over HTTPS Port 443 without needing any custom domain.
     */
    public static function sendHtml(string $toEmail, ?string $toName, string $subject, string $htmlContent): bool
    {
        $fromEmail = config('mail.from.address', 'hamzazahoor4556@gmail.com');
        $fromName = config('mail.from.name', 'RecruitSense');
        $displayName = $toName ?: strtok($toEmail, '@');

        // 1. Try Brevo REST API over HTTPS (Port 443 - Never blocked by cloud firewalls, NO domain purchase required)
        $brevoApiKey = config('services.brevo.key', env('BREVO_API_KEY'));
        if (!empty($brevoApiKey)) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders([
                        'api-key' => $brevoApiKey,
                        'Content-Type' => 'application/json',
                        'accept' => 'application/json',
                    ])
                    ->post('https://api.brevo.com/v3/smtp/email', [
                        'sender' => ['name' => $fromName, 'email' => $fromEmail],
                        'to' => [['email' => $toEmail, 'name' => $displayName]],
                        'subject' => $subject,
                        'htmlContent' => $htmlContent,
                    ]);

                if ($response->successful()) {
                    Log::info("Email successfully sent via Brevo HTTPS API to: {$toEmail}");
                    return true;
                }
                Log::warning('Brevo HTTPS email failed (' . $response->status() . '): ' . $response->body());
            } catch (\Throwable $e) {
                Log::warning('Brevo HTTPS exception: ' . $e->getMessage());
            }
        }

        // 2. Try Resend REST API over HTTPS (Port 443)
        // If unverified custom domain on Resend, it will only succeed if $toEmail is account owner.
        // On error (403), it safely falls through to SMTP.
        $resendApiKey = config('services.resend.key', env('RESEND_API_KEY'));
        if (!empty($resendApiKey)) {
            try {
                $resendFrom = env('RESEND_FROM_EMAIL', "{$fromName} <support@recruitsense.online>");
                $response = Http::timeout(10)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $resendApiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post('https://api.resend.com/emails', [
                        'from' => $resendFrom,
                        'to' => [$toEmail],
                        'subject' => $subject,
                        'html' => $htmlContent,
                        'reply_to' => env('MAIL_REPLY_TO_ADDRESS', 'hamzazahoor4556@gmail.com'),
                    ]);

                if ($response->successful()) {
                    Log::info("Email successfully sent via Resend HTTPS API to: {$toEmail}");
                    return true;
                }
                Log::warning('Resend HTTPS email failed (' . $response->status() . '): ' . $response->body());
            } catch (\Throwable $e) {
                Log::warning('Resend HTTPS exception: ' . $e->getMessage());
            }
        }

        // 3. Fallback to standard Laravel Mail (SMTP)
        try {
            Mail::html($htmlContent, function ($message) use ($toEmail, $displayName, $subject, $fromEmail, $fromName) {
                $message->to($toEmail, $displayName)
                    ->from($fromEmail, $fromName)
                    ->subject($subject);
            });
            Log::info("Email successfully sent via SMTP to: {$toEmail}");
            return true;
        } catch (\Throwable $e) {
            Log::error("SMTP Mail sending failed to {$toEmail}: " . $e->getMessage());
            return false;
        }
    }
}
