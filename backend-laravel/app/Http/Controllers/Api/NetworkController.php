<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Connection;
use App\Models\User;
use Illuminate\Http\Request;

class NetworkController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;
        $connectedIds = $this->activeNetworkUserIds($userId);

        $connectionsCount = Connection::where('status', 'accepted')
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->count();

        $pendingInvitationsCount = Connection::where('receiver_id', $userId)
            ->where('status', 'pending')
            ->count();

        $suggestionsCount = User::where('id', '!=', $userId)
            ->where('role', 'jobseeker')
            ->whereNotIn('id', $connectedIds)
            ->count();

        return response()->json([
            'connections_count' => $connectionsCount,
            'pending_invitations_count' => $pendingInvitationsCount,
            'suggestions_count' => $suggestionsCount,
        ]);
    }

    public function suggestions(Request $request)
    {
        $user = $request->user();
        $connectedIds = $this->activeNetworkUserIds($user->id);

        $users = User::with('jobSeeker')
            ->where('id', '!=', $user->id)
            ->where('role', 'jobseeker')
            ->whereNotIn('id', $connectedIds)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($suggestion) => $this->userCard($suggestion, $request));

        return response()->json($users);
    }

    public function invitations(Request $request)
    {
        $connections = Connection::with('requester.jobSeeker')
            ->where('receiver_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($connection) => [
                'connection_id' => $connection->id,
                'status' => $connection->status,
                'user' => $this->userCard($connection->requester, $request),
            ]);

        return response()->json($connections);
    }

    public function connections(Request $request)
    {
        $userId = $request->user()->id;

        $connections = Connection::with(['requester.jobSeeker', 'receiver.jobSeeker'])
            ->where('status', 'accepted')
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->latest()
            ->get()
            ->map(function ($connection) use ($request, $userId) {
                $otherUser = $connection->requester_id === $userId
                    ? $connection->receiver
                    : $connection->requester;

                return [
                    'connection_id' => $connection->id,
                    'status' => $connection->status,
                    'user' => $this->userCard($otherUser, $request),
                ];
            });

        return response()->json($connections);
    }

    public function connect(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'You cannot connect with yourself'], 422);
        }

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seeker profiles can be connected right now'], 422);
        }

        $existing = $this->findConnection($currentUser->id, $user->id);

        if ($existing) {
            if ($existing->status === 'rejected') {
                $existing->update([
                    'requester_id' => $currentUser->id,
                    'receiver_id' => $user->id,
                    'status' => 'pending',
                ]);
                $this->createNotification(
                    $user->id,
                    $currentUser->id,
                    'connection_request',
                    'New connection request',
                    $currentUser->name . ' sent you a connection request.',
                    ['link' => '/network', 'connection_id' => $existing->id]
                );
            }

            return response()->json([
                'message' => $this->connectionMessage($existing, $currentUser->id),
                'connection' => $this->connectionPayload($existing->fresh(), $currentUser->id),
            ]);
        }

        $connection = Connection::create([
            'requester_id' => $currentUser->id,
            'receiver_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->createNotification(
            $user->id,
            $currentUser->id,
            'connection_request',
            'New connection request',
            $currentUser->name . ' sent you a connection request.',
            ['link' => '/network', 'connection_id' => $connection->id]
        );

        return response()->json([
            'message' => 'Connection request sent',
            'connection' => $this->connectionPayload($connection, $currentUser->id),
        ], 201);
    }

    public function accept(Request $request, Connection $connection)
    {
        if ($connection->receiver_id !== $request->user()->id || $connection->status !== 'pending') {
            return response()->json(['message' => 'Invitation not found'], 404);
        }

        $connection->update(['status' => 'accepted']);

        $this->createNotification(
            $connection->requester_id,
            $request->user()->id,
            'connection_accepted',
            'Connection accepted',
            $request->user()->name . ' accepted your connection request.',
            ['link' => '/profile/' . $request->user()->id, 'connection_id' => $connection->id]
        );

        return response()->json([
            'message' => 'Connection accepted',
            'connection' => $this->connectionPayload($connection->fresh(), $request->user()->id),
        ]);
    }

    public function reject(Request $request, Connection $connection)
    {
        if ($connection->receiver_id !== $request->user()->id || $connection->status !== 'pending') {
            return response()->json(['message' => 'Invitation not found'], 404);
        }

        $connection->update(['status' => 'rejected']);

        return response()->json(['message' => 'Connection request ignored']);
    }

    public function remove(Request $request, Connection $connection)
    {
        $userId = $request->user()->id;

        if ($connection->requester_id !== $userId && $connection->receiver_id !== $userId) {
            return response()->json(['message' => 'Connection not found'], 404);
        }

        $connection->delete();

        return response()->json(['message' => 'Connection removed']);
    }

    public function status(Request $request, User $user)
    {
        $connection = $this->findConnection($request->user()->id, $user->id);

        return response()->json([
            'connection' => $connection
                ? $this->connectionPayload($connection, $request->user()->id)
                : null,
        ]);
    }

    private function activeNetworkUserIds(int $userId): array
    {
        return Connection::query()
            ->whereIn('status', ['pending', 'accepted'])
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->get()
            ->map(fn ($connection) => $connection->requester_id === $userId
                ? $connection->receiver_id
                : $connection->requester_id)
            ->values()
            ->all();
    }

    private function findConnection(int $firstUserId, int $secondUserId): ?Connection
    {
        return Connection::where(function ($query) use ($firstUserId, $secondUserId) {
            $query->where('requester_id', $firstUserId)
                ->where('receiver_id', $secondUserId);
        })->orWhere(function ($query) use ($firstUserId, $secondUserId) {
            $query->where('requester_id', $secondUserId)
                ->where('receiver_id', $firstUserId);
        })->first();
    }

    private function connectionPayload(Connection $connection, int $currentUserId): array
    {
        return [
            'id' => $connection->id,
            'status' => $connection->status,
            'direction' => $connection->requester_id === $currentUserId ? 'sent' : 'received',
            'requester_id' => $connection->requester_id,
            'receiver_id' => $connection->receiver_id,
        ];
    }

    private function connectionMessage(Connection $connection, int $currentUserId): string
    {
        if ($connection->status === 'accepted') {
            return 'Already connected';
        }

        if ($connection->status === 'pending' && $connection->requester_id === $currentUserId) {
            return 'Connection request already sent';
        }

        if ($connection->status === 'pending') {
            return 'This user already sent you a request';
        }

        return 'Connection request sent';
    }

    private function userCard(User $user, Request $request): array
    {
        $jobSeeker = $user->jobSeeker;
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'headline' => $jobSeeker?->headline,
            'location' => $jobSeeker?->location,
            'company' => $jobSeeker?->company,
            'profile_image_url' => $jobSeeker?->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
        ];
    }

    private function createNotification(int $userId, ?int $actorId, string $type, string $title, string $message, array $data = []): void
    {
        if ($actorId && $userId === $actorId) {
            return;
        }

        AppNotification::create([
            'user_id' => $userId,
            'actor_id' => $actorId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}
