<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use App\Models\JobSeeker;
use App\Mail\PasswordResetMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

use App\Mail\JobSeekerWelcomeMail;
use App\Mail\CompanyWelcomeMail;

class AuthController extends Controller
{
    /**
     * Register a new user (jobseeker or company)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:company,jobseeker',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        if ($request->role === 'company') {
            Company::create([
                'user_id' => $user->id,
                'name' => $request->name,
            ]);

            Mail::to($user->email)->send(new CompanyWelcomeMail($user));
        } elseif ($request->role === 'jobseeker') {
            JobSeeker::create([
                'user_id' => $user->id,
            ]);

            Mail::to($user->email)->send(new JobSeekerWelcomeMail($user));
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $token = Password::broker()->createToken($user);
            $resetUrl = rtrim(config('services.frontend.url'), '/') . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($user->email);

            Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));
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
            $this->sendWelcomeMail($user);
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Google sign-in successful',
            'user' => $user->fresh(),
            'token' => $token,
        ]);
    }

    /**
     * Login user
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

    private function ensureRoleProfile(User $user): void
    {
        if ($user->role === 'company') {
            Company::firstOrCreate(
                ['user_id' => $user->id],
                ['name' => $user->name]
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
