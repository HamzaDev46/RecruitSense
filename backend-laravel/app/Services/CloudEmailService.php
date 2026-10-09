<?php

namespace App\Services;

use App\Models\User;
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
     * Send HTML email over HTTPS REST API or SMTP fallback.
     */
    public static function sendHtml(string $toEmail, string $toName, string $subject, string $htmlContent): bool
    {
        $fromEmail = config('mail.from.address', 'hamzazahoor4556@gmail.com');
        $fromName = config('mail.from.name', 'RecruitSense');

        // 1. Try Brevo REST API over HTTPS (Port 443 - Never blocked by cloud firewalls)
        $brevoApiKey = env('BREVO_API_KEY', config('services.brevo.key'));
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
                        'to' => [['email' => $toEmail, 'name' => $toName]],
                        'subject' => $subject,
                        'htmlContent' => $htmlContent,
                    ]);

                if ($response->successful()) {
                    return true;
                }
                Log::warning('Brevo HTTPS email failed: ' . $response->body());
            } catch (\Throwable $e) {
                Log::warning('Brevo HTTPS exception: ' . $e->getMessage());
            }
        }

        // 2. Try Resend REST API over HTTPS (Port 443)
        $resendApiKey = env('RESEND_API_KEY', config('services.resend.key'));
        if (!empty($resendApiKey)) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $resendApiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post('https://api.resend.com/emails', [
                        'from' => "{$fromName} <onboarding@resend.dev>",
                        'to' => [$toEmail],
                        'subject' => $subject,
                        'html' => $htmlContent,
                    ]);

                if ($response->successful()) {
                    return true;
                }
                Log::warning('Resend HTTPS email failed: ' . $response->body());
            } catch (\Throwable $e) {
                Log::warning('Resend HTTPS exception: ' . $e->getMessage());
            }
        }

        // 3. Fallback to standard Laravel Mail (SMTP)
        try {
            Mail::send([], [], function ($message) use ($toEmail, $toName, $subject, $htmlContent, $fromEmail, $fromName) {
                $message->to($toEmail, $toName)
                    ->from($fromEmail, $fromName)
                    ->subject($subject)
                    ->html($htmlContent);
            });
            return true;
        } catch (\Throwable $e) {
            Log::warning('SMTP Mail sending failed: ' . $e->getMessage());
            return false;
        }
    }
}
