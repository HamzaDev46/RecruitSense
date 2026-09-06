<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use App\Models\JobSeeker;
use App\Models\AdminSetting;
use App\Mail\PasswordResetMail;
use App\Mail\EmailVerificationMail;
use App\Mail\JobSeekerWelcomeMail;
use App\Mail\CompanyWelcomeMail;
use App\Rules\TrustedEmailDomain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Generate secure activation verification URL for user.
     */
    public static function generateVerificationUrl(User $user): string
    {
        $hash = hash_hmac('sha256', $user->id . '|' . $user->email . '|' . ($user->created_at?->timestamp ?? 0), config('app.key'));
        $frontendUrl = rtrim(config('services.frontend.url', 'http://localhost:5173'), '/');

        return "{$frontendUrl}/verify-email?id={$user->id}&email=" . urlencode($user->email) . "&token={$hash}";
    }

    /**
     * Validate verification token.
     */
    public static function isValidVerificationToken(User $user, string $token): bool
    {
        $expectedHash = hash_hmac('sha256', $user->id . '|' . $user->email . '|' . ($user->created_at?->timestamp ?? 0), config('app.key'));
        return hash_equals($expectedHash, $token);
    }

    /**
     * Register a new user (jobseeker or company) with email verification required
     */
    public function register(Request $request)
    {
        if (!AdminSetting::getValue('allow_registrations', true)) {
            return response()->json(['message' => 'New registrations are currently disabled.'], 403);
        }

        $isCompany = $request->role === 'company';

        $rules = [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users', new TrustedEmailDomain()],
            'password' => 'required|string|min:6',
            'role' => 'required|in:company,jobseeker',
        ];

        if ($isCompany) {
            $rules['company_name'] = 'nullable|string|max:255';
            $rules['industry'] = 'nullable|string|max:255';
            $rules['location'] = 'nullable|string|max:255';
            $rules['website'] = 'nullable|string|max:255';
            $rules['description'] = 'nullable|string|max:2000';
            $rules['company_size'] = 'nullable|string|max:100';
            $rules['phone'] = 'nullable|string|max:50';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'email_verified_at' => null,
        ]);

        $this->ensureRoleProfile($user, $request->all());

        // Send Email Verification Link
        try {
            $verifyUrl = self::generateVerificationUrl($user);
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verifyUrl));
        } catch (\Throwable $e) {
            // Log mail exception if mailer is offline in dev
        }

        return response()->json([
            'message' => 'Registration successful. An activation link has been sent to your email. Please check your inbox and verify your email to activate your account.',
            'requires_verification' => true,
            'email' => $user->email,
            'user' => $user,
        ], 201);
    }

    /**
     * Verify email address and activate account
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer',
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('id', $request->id)
            ->where('email', $request->email)
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Account not found or invalid activation link.'], 404);
        }

        if ($user->email_verified_at) {
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'message' => 'Your email is already verified. Welcome back!',
                'already_verified' => true,
                'user' => $user,
                'token' => $token,
            ], 200);
        }

        if (!self::isValidVerificationToken($user, $request->token)) {
            return response()->json(['message' => 'The verification link is invalid or has expired.'], 422);
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        $this->ensureRoleProfile($user);

        try {
            $this->sendWelcomeMail($user);
        } catch (\Throwable) {
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully! Your account is now active.',
            'user' => $user->fresh(),
            'token' => $token,
        ], 200);
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'No account found with this email address.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'This account is already verified. You can sign in directly.',
                'already_verified' => true,
            ], 200);
        }

        try {
            $verifyUrl = self::generateVerificationUrl($user);
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verifyUrl));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Could not send verification email. Please try again later.'], 500);
        }

        return response()->json([
            'message' => 'A fresh verification link has been sent to ' . $user->email . '. Please check your inbox.',
        ], 200);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', new TrustedEmailDomain()],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $token = Password::broker()->createToken($user);
            $frontendUrl = rtrim((string) config('services.frontend.url', 'http://localhost:5173'), '/');
            $resetUrl = $frontendUrl . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($user->email);

            try {
                Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));
            } catch (\Throwable) {
            }
        }

        return response()->json([
            'message' => 'If an account exists with this email, a reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $status = Password::broker()->reset(
            $validator->validated(),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'This reset link is invalid or expired.'], 422);
        }

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function googleAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
            'role' => 'nullable|in:company,jobseeker',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $clientId = config('services.google.client_id');

        if (!$clientId) {
            return response()->json(['message' => 'Google sign-in is not configured.'], 503);
        }

        $googleRequest = Http::timeout(10);

        if (app()->environment('local')) {
            $googleRequest = $googleRequest->withoutVerifying();
        }

        try {
            $googleResponse = $googleRequest->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $request->credential,
            ]);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Google sign-in could not reach Google verification service. Please try again.',
            ], 503);
        }

        if (!$googleResponse->successful()) {
            return response()->json(['message' => 'Google sign-in could not be verified.'], 422);
        }

        $payload = $googleResponse->json();

        if (($payload['aud'] ?? null) !== $clientId) {
            return response()->json(['message' => 'Google client mismatch.'], 422);
        }

        if (!filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return response()->json(['message' => 'Google email is not verified.'], 422);
        }

        $email = strtolower($payload['email'] ?? '');
        $googleId = $payload['sub'] ?? null;

        if (!$email || !$googleId) {
            return response()->json(['message' => 'Google account details are incomplete.'], 422);
        }

        $user = User::where('google_id', $googleId)
            ->orWhere('email', $email)
            ->first();

        if (!$user) {
            if (!$request->role) {
                return response()->json(['message' => 'Choose Job Seeker or Company before signing up with Google.'], 422);
            }

            $user = User::create([
                'name' => $payload['name'] ?? strtok($email, '@'),
                'email' => $email,
                'email_verified_at' => now(),
                'google_id' => $googleId,
                'avatar_url' => $payload['picture'] ?? null,
                'password' => Hash::make(Str::random(40)),
                'role' => $request->role,
            ]);

            $this->ensureRoleProfile($user);
            try {
                $this->sendWelcomeMail($user);
            } catch (\Throwable) {
            }
        } else {
            if ($request->role && $user->role !== $request->role) {
                return response()->json([
                    'message' => 'This email is already registered as a ' . $user->role . ' account.',
                ], 422);
            }

            $user->forceFill([
                'google_id' => $user->google_id ?: $googleId,
                'avatar_url' => $payload['picture'] ?? $user->avatar_url,
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();

            $this->ensureRoleProfile($user);
        }

        if (($user->account_status ?? 'active') === 'suspended') {
            return response()->json(['message' => 'Your account is suspended. Please contact support.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Google sign-in successful',
            'user' => $user->fresh(),
            'token' => $token,
        ]);
    }

    /**
     * Login user with verification check
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Check if account email is verified (skip for admin if needed, but enforce for jobseeker and company)
        if (!$user->email_verified_at && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Your email address is not verified yet. Please check your inbox or resend the activation link.',
                'requires_verification' => true,
                'email' => $user->email,
            ], 403);
        }

        if (($user->account_status ?? 'active') === 'suspended') {
            return response()->json(['message' => 'Your account is suspended. Please contact support.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    private function ensureRoleProfile(User $user, array $extraData = []): void
    {
        if ($user->role === 'company') {
            Company::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => trim($extraData['company_name'] ?? '') ?: $user->name,
                    'industry' => trim($extraData['industry'] ?? '') ?: null,
                    'location' => trim($extraData['location'] ?? '') ?: null,
                    'website' => trim($extraData['website'] ?? '') ?: null,
                    'description' => trim($extraData['description'] ?? '') ?: null,
                    'company_size' => trim($extraData['company_size'] ?? '') ?: null,
                    'phone' => trim($extraData['phone'] ?? '') ?: null,
                    'contact_email' => trim($extraData['contact_email'] ?? '') ?: $user->email,
                    'verification_status' => AdminSetting::getValue('auto_verify_companies', true) ? 'verified' : 'pending',
                ]
            );
        }

        if ($user->role === 'jobseeker') {
            JobSeeker::firstOrCreate(['user_id' => $user->id]);
        }
    }

    private function sendWelcomeMail(User $user): void
    {
        if ($user->role === 'company') {
            Mail::to($user->email)->send(new CompanyWelcomeMail($user));
        }

        if ($user->role === 'jobseeker') {
            Mail::to($user->email)->send(new JobSeekerWelcomeMail($user));
        }
    }
}
