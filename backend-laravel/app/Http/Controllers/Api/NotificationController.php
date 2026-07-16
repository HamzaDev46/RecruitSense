<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = AppNotification::with('actor.jobSeeker')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(60)
            ->get()
            ->map(fn ($notification) => $this->notificationPayload($notification, $request));

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => AppNotification::where('user_id', $request->user()->id)
                ->whereNull('read_at')
                ->count(),
        ]);
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->update(['read_at' => $notification->read_at ?: now()]);

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $this->notificationPayload($notification->fresh('actor.jobSeeker'), $request),
        ]);
    }

    public function readAll(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    private function notificationPayload(AppNotification $notification, Request $request): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'data' => $notification->data ?: [],
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
            'actor' => $this->userPayload($notification->actor, $request),
        ];
    }

    private function userPayload(?User $user, Request $request): ?array
    {
        if (!$user) {
            return null;
        }

        $jobSeeker = $user->jobSeeker;
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'headline' => $jobSeeker?->headline,
            'company' => $jobSeeker?->company,
            'profile_image_url' => $jobSeeker?->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
        ];
    }
}
