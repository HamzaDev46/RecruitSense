<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Connection;
use App\Models\SearchAppearance;
use App\Models\User;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class NetworkController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;
        $this->removeOrphanedConnectionsFor($userId);

        return response()->json(Cache::remember(
            UserCache::networkSummary($userId),
            UserCache::NETWORK_SUMMARY_TTL,
            function () use ($userId) {
                $connectedIds = $this->activeNetworkUserIds($userId);

                $connectionsCount = Connection::where('status', 'accepted')
                    ->whereHas('requester')
                    ->whereHas('receiver')
                    ->where(function ($query) use ($userId) {
                        $query->where('requester_id', $userId)
                            ->orWhere('receiver_id', $userId);
                    })
                    ->count();

                $pendingInvitationsCount = Connection::where('receiver_id', $userId)
                    ->whereHas('requester')
                    ->where('status', 'pending')
                    ->count();

                $suggestionsCount = User::where('id', '!=', $userId)
                    ->where('role', 'jobseeker')
                    ->whereNotIn('id', $connectedIds)
                    ->whereHas('jobSeeker', fn ($query) => $query->where('profile_visibility', 'public'))
                    ->count();

                return [
                    'connections_count' => $connectionsCount,
                    'pending_invitations_count' => $pendingInvitationsCount,
                    'suggestions_count' => $suggestionsCount,
                ];
            }
        ));
    }

    public function suggestions(Request $request)
    {
        $user = $request->user();
        $connectedIds = $this->activeNetworkUserIds($user->id);

        $users = User::with('jobSeeker')
            ->where('id', '!=', $user->id)
            ->where('role', 'jobseeker')
            ->whereNotIn('id', $connectedIds)
            ->whereHas('jobSeeker', fn ($query) => $query->where('profile_visibility', 'public'))
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($suggestion) => $this->userCard($suggestion, $request));

        return response()->json($users);
    }

    public function search(Request $request)
    {
        $user = $request->user();
        $term = Str::of((string) $request->query('query', ''))
            ->squish()
            ->limit(80, '')
            ->toString();

        if (Str::length($term) < 2) {
            return response()->json([]);
        }

        $connectedIds = $this->activeNetworkUserIds($user->id);
        $likeTerm = '%' . $term . '%';

        $users = User::with('jobSeeker')
            ->where('id', '!=', $user->id)
            ->where('role', 'jobseeker')
            ->whereNotIn('id', $connectedIds)
            ->whereHas('jobSeeker', fn ($query) => $query->where('profile_visibility', 'public'))
            ->where(function ($query) use ($likeTerm) {
                $query->where('name', 'like', $likeTerm)
                    ->orWhereHas('jobSeeker', function ($jobSeekerQuery) use ($likeTerm) {
                        $jobSeekerQuery->where('headline', 'like', $likeTerm)
                            ->orWhere('company', 'like', $likeTerm)
                            ->orWhere('location', 'like', $likeTerm)
                            ->orWhere('skills', 'like', $likeTerm);
                    });
            })
            ->latest()
            ->limit(20)
            ->get();

        $this->recordSearchAppearances($users, $request, $term);

        return response()->json($users->map(fn ($resultUser) => $this->userCard($resultUser, $request))->values());
    }

    public function invitations(Request $request)
    {
        $connections = Connection::with('requester.jobSeeker')
            ->whereHas('requester')
            ->where('receiver_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->filter(fn ($connection) => $connection->requester)
            ->map(fn ($connection) => [
                'connection_id' => $connection->id,
                'status' => $connection->status,
                'user' => $this->userCard($connection->requester, $request),
            ])
            ->values();

        return response()->json($connections);
    }

    public function connections(Request $request)
    {
        $userId = $request->user()->id;

        $connections = Connection::with(['requester.jobSeeker', 'receiver.jobSeeker'])
            ->where('status', 'accepted')
            ->whereHas('requester')
            ->whereHas('receiver')
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->latest()
            ->get()
            ->filter(fn ($connection) => $connection->requester && $connection->receiver)
            ->map(function ($connection) use ($request, $userId) {
                $otherUser = $connection->requester_id === $userId
                    ? $connection->receiver
                    : $connection->requester;

                return [
                    'connection_id' => $connection->id,
                    'status' => $connection->status,
                    'user' => $this->userCard($otherUser, $request),
                ];
            })
            ->values();

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
                UserCache::forgetNetworkForUsers([$currentUser->id, $user->id]);
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
        UserCache::forgetNetworkForUsers([$currentUser->id, $user->id]);

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
        UserCache::forgetNetworkForUsers([$connection->requester_id, $connection->receiver_id]);

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
        UserCache::forgetNetworkForUsers([$connection->requester_id, $connection->receiver_id]);

        return response()->json(['message' => 'Connection request ignored']);
    }

    public function remove(Request $request, Connection $connection)
    {
        $userId = $request->user()->id;

        if ($connection->requester_id !== $userId && $connection->receiver_id !== $userId) {
            return response()->json(['message' => 'Connection not found'], 404);
        }

        $connection->delete();
        UserCache::forgetNetworkForUsers([$connection->requester_id, $connection->receiver_id]);

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
            ->whereHas('requester')
            ->whereHas('receiver')
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

    private function removeOrphanedConnectionsFor(int $userId): void
    {
        $orphanedConnections = Connection::with(['requester', 'receiver'])
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->get()
            ->filter(fn ($connection) => !$connection->requester || !$connection->receiver);

        if ($orphanedConnections->isEmpty()) {
            return;
        }

        $affectedUserIds = $orphanedConnections
            ->flatMap(fn ($connection) => [$connection->requester_id, $connection->receiver_id])
            ->filter()
            ->unique()
            ->values()
            ->all();

        Connection::whereIn('id', $orphanedConnections->pluck('id'))->delete();
        UserCache::forgetNetworkForUsers($affectedUserIds);
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

    private function recordSearchAppearances(Collection $users, Request $request, string $term): void
    {
        $searcher = $request->user();
        $normalizedTerm = Str::of($term)->lower()->squish()->toString();
        $queryHash = hash('sha256', $normalizedTerm);

        foreach ($users as $resultUser) {
            if ($resultUser->id === $searcher->id || !$resultUser->jobSeeker?->allow_search_appearance_tracking) {
                continue;
            }

            $appearance = SearchAppearance::firstOrCreate([
                'profile_user_id' => $resultUser->id,
                'searcher_user_id' => $searcher->id,
                'query_hash' => $queryHash,
                'appeared_on' => now()->toDateString(),
            ], [
                'query' => $normalizedTerm,
            ]);

            if ($appearance->wasRecentlyCreated) {
                UserCache::forgetProfile($resultUser->id);
            }
        }
    }

    private function createNotification(int $userId, ?int $actorId, string $type, string $title, string $message, array $data = []): void
    {
        if ($actorId && $userId === $actorId) {
            return;
        }

        if (\App\Models\User::with('jobSeeker')->find($userId)?->notificationEnabledFor($type) === false) {
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
        UserCache::forgetUnreadNotifications($userId);
    }
}
