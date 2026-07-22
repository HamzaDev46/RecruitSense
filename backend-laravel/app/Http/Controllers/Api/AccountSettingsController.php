<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connection;
use App\Models\Conversation;
use App\Models\Post;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AccountSettingsController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($this->settingsPayload($request));
    }

    public function updateAccount(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($validator->validated());
        UserCache::forgetProfile($user->id);
        UserCache::forgetNetworkSummary($user->id);

        return response()->json([
            'message' => 'Account updated successfully',
            ...$this->settingsPayload($request),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        $currentToken = $user->currentAccessToken();

        if ($currentToken) {
            $user->tokens()->where('id', '!=', $currentToken->id)->delete();
        }

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function destroyAccount(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Password is incorrect'], 422);
        }

        $connectedUserIds = Connection::query()
            ->where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->get()
            ->flatMap(fn ($connection) => [$connection->requester_id, $connection->receiver_id])
            ->filter(fn ($userId) => (int) $userId !== (int) $user->id)
            ->unique()
            ->values()
            ->all();

        $conversationUserIds = Conversation::query()
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)
                    ->orWhere('user_two_id', $user->id);
            })
            ->get()
            ->flatMap(fn ($conversation) => [$conversation->user_one_id, $conversation->user_two_id])
            ->filter(fn ($userId) => (int) $userId !== (int) $user->id)
            ->unique()
            ->values()
            ->all();

        $posts = Post::with('media')->where('user_id', $user->id)->get();

        foreach ($posts as $post) {
            foreach ($post->media as $media) {
                Storage::disk('public')->delete($media->file_path);
            }
        }

        $user->tokens()->delete();
        Connection::query()
            ->where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->delete();
        Conversation::query()
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)
                    ->orWhere('user_two_id', $user->id);
            })
            ->delete();
        Post::whereIn('id', $posts->pluck('id'))->delete();
        UserCache::forgetNetworkForUsers($connectedUserIds);
        foreach ($conversationUserIds as $conversationUserId) {
            UserCache::forgetUnreadMessages((int) $conversationUserId);
        }
        UserCache::forgetAllForUser($user->id);
        $user->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }

    public function updatePreferences(Request $request)
    {
        $user = $request->user()->load('jobSeeker');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can update these settings'], 403);
        }

        $validator = Validator::make($request->all(), [
            'profile_visibility' => ['required', Rule::in(['public', 'network', 'private'])],
            'show_profile_view_notifications' => ['required', 'boolean'],
            'allow_search_appearance_tracking' => ['required', 'boolean'],
            'dark_mode' => ['required', 'boolean'],
            'notify_connections' => ['required', 'boolean'],
            'notify_messages' => ['required', 'boolean'],
            'notify_application_updates' => ['required', 'boolean'],
            'notify_job_alerts' => ['required', 'boolean'],
            'notify_post_activity' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->jobSeeker->update($validator->validated());
        UserCache::forgetProfile($user->id);
        UserCache::forgetNetworkSummary($user->id);

        return response()->json([
            'message' => 'Preferences updated successfully',
            ...$this->settingsPayload($request),
        ]);
    }

    private function settingsPayload(Request $request): array
    {
        $user = $request->user()->fresh()->load('jobSeeker');

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'preferences' => [
                'profile_visibility' => $user->jobSeeker?->profile_visibility ?: 'public',
                'show_profile_view_notifications' => (bool) ($user->jobSeeker?->show_profile_view_notifications ?? true),
                'allow_search_appearance_tracking' => (bool) ($user->jobSeeker?->allow_search_appearance_tracking ?? true),
                'dark_mode' => (bool) ($user->jobSeeker?->dark_mode ?? false),
                'notify_connections' => (bool) ($user->jobSeeker?->notify_connections ?? true),
                'notify_messages' => (bool) ($user->jobSeeker?->notify_messages ?? true),
                'notify_application_updates' => (bool) ($user->jobSeeker?->notify_application_updates ?? true),
                'notify_job_alerts' => (bool) ($user->jobSeeker?->notify_job_alerts ?? true),
                'notify_post_activity' => (bool) ($user->jobSeeker?->notify_post_activity ?? true),
            ],
        ];
    }
}
