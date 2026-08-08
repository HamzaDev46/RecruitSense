<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Connection;
use App\Models\Conversation;
use App\Models\ContentReport;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostImpression;
use App\Models\PostLike;
use App\Models\ProfileView;
use App\Models\SearchAppearance;
use App\Models\User;
use App\Models\UserBlock;
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
        $blockedRelationUserIds = UserBlock::blockedUserIdsFor($user->id);

        $posts = Post::with('media')->where('user_id', $user->id)->get();
        $affectedProfileUserIds = ProfileView::where('viewer_user_id', $user->id)
            ->pluck('profile_user_id')
            ->merge(SearchAppearance::where('searcher_user_id', $user->id)->pluck('profile_user_id'))
            ->filter(fn ($userId) => (int) $userId !== (int) $user->id)
            ->unique()
            ->values()
            ->all();
        $affectedPostOwnerIds = Post::query()
            ->where(function ($query) use ($user) {
                $query->whereHas('likes', fn ($likeQuery) => $likeQuery->where('user_id', $user->id))
                    ->orWhereHas('comments', fn ($commentQuery) => $commentQuery->where('user_id', $user->id))
                    ->orWhereHas('impressions', fn ($impressionQuery) => $impressionQuery->where('viewer_user_id', $user->id));
            })
            ->pluck('user_id')
            ->filter(fn ($userId) => (int) $userId !== (int) $user->id)
            ->unique()
            ->values()
            ->all();
        $affectedNotificationUserIds = AppNotification::where('actor_id', $user->id)
            ->pluck('user_id')
            ->filter(fn ($userId) => (int) $userId !== (int) $user->id)
            ->unique()
            ->values()
            ->all();

        foreach ($posts as $post) {
            foreach ($post->media as $media) {
                Storage::disk('public')->delete($media->file_path);
            }
        }

        $user->tokens()->delete();
        ProfileView::query()
            ->where(function ($query) use ($user) {
                $query->where('profile_user_id', $user->id)
                    ->orWhere('viewer_user_id', $user->id);
            })
            ->delete();
        SearchAppearance::query()
            ->where(function ($query) use ($user) {
                $query->where('profile_user_id', $user->id)
                    ->orWhere('searcher_user_id', $user->id);
            })
            ->delete();
        PostImpression::where('viewer_user_id', $user->id)->delete();
        PostLike::where('user_id', $user->id)->delete();
        PostComment::where('user_id', $user->id)->delete();
        AppNotification::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('actor_id', $user->id);
            })
            ->delete();
        ContentReport::query()
            ->where(function ($query) use ($user) {
                $query->where('reporter_id', $user->id)
                    ->orWhere('reported_user_id', $user->id);
            })
            ->delete();
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
        UserCache::forgetNetworkForUsers(array_unique(array_merge($connectedUserIds, $blockedRelationUserIds)));
        foreach (array_unique(array_merge($affectedProfileUserIds, $affectedPostOwnerIds)) as $affectedUserId) {
            UserCache::forgetProfile((int) $affectedUserId);
        }
        foreach ($affectedNotificationUserIds as $affectedUserId) {
            UserCache::forgetUnreadNotifications((int) $affectedUserId);
        }
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

    public function blockedUsers(Request $request)
    {
        return response()->json($this->blockedUsersPayload($request));
    }

    public function blockUser(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'You cannot block yourself'], 422);
        }

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seeker profiles can be blocked right now'], 422);
        }

        UserBlock::firstOrCreate([
            'blocker_id' => $currentUser->id,
            'blocked_id' => $user->id,
        ]);

        Connection::query()
            ->where(function ($query) use ($currentUser, $user) {
                $query->where(function ($inner) use ($currentUser, $user) {
                    $inner->where('requester_id', $currentUser->id)
                        ->where('receiver_id', $user->id);
                })->orWhere(function ($inner) use ($currentUser, $user) {
                    $inner->where('requester_id', $user->id)
                        ->where('receiver_id', $currentUser->id);
                });
            })
            ->delete();

        Conversation::query()
            ->where(function ($query) use ($currentUser, $user) {
                $query->where(function ($inner) use ($currentUser, $user) {
                    $inner->where('user_one_id', min($currentUser->id, $user->id))
                        ->where('user_two_id', max($currentUser->id, $user->id));
                });
            })
            ->delete();

        UserCache::forgetNetworkForUsers([$currentUser->id, $user->id]);
        UserCache::forgetProfile($currentUser->id);
        UserCache::forgetProfile($user->id);
        UserCache::forgetUnreadMessages($currentUser->id);
        UserCache::forgetUnreadMessages($user->id);

        return response()->json([
            'message' => 'User blocked',
            ...$this->blockedUsersPayload($request),
        ]);
    }

    public function unblockUser(Request $request, User $user)
    {
        $currentUser = $request->user();

        UserBlock::where('blocker_id', $currentUser->id)
            ->where('blocked_id', $user->id)
            ->delete();

        UserCache::forgetNetworkForUsers([$currentUser->id, $user->id]);
        UserCache::forgetProfile($currentUser->id);
        UserCache::forgetProfile($user->id);

        return response()->json([
            'message' => 'User unblocked',
            ...$this->blockedUsersPayload($request),
        ]);
    }

    private function settingsPayload(Request $request): array
    {
        $user = $request->user()->fresh()->load('jobSeeker');
        $blocked = $this->blockedUsersPayload($request);

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
            'blocked_users_count' => $blocked['blocked_users_count'],
            'blocked_users' => $blocked['blocked_users'],
        ];
    }

    private function blockedUsersPayload(Request $request): array
    {
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';
        $blockedUsers = UserBlock::with('blocked.jobSeeker')
            ->where('blocker_id', $request->user()->id)
            ->latest()
            ->get()
            ->filter(fn ($block) => $block->blocked)
            ->map(function ($block) use ($storageUrl) {
                $blocked = $block->blocked;
                $profile = $blocked->jobSeeker;

                return [
                    'id' => $blocked->id,
                    'name' => $blocked->name,
                    'email' => $blocked->email,
                    'headline' => $profile?->headline,
                    'company' => $profile?->company,
                    'location' => $profile?->location,
                    'profile_image_url' => $profile?->profile_image ? $storageUrl . $profile->profile_image : null,
                    'blocked_at' => $block->created_at?->toISOString(),
                ];
            })
            ->values();

        return [
            'blocked_users_count' => $blockedUsers->count(),
            'blocked_users' => $blockedUsers->all(),
        ];
    }
}
