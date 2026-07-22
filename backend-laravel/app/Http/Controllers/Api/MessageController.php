<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Connection;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    public function conversations(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can use messaging'], 403);
        }

        $this->removeOrphanedConversationsFor($user->id);

        $conversations = Conversation::with([
            'userOne.jobSeeker',
            'userTwo.jobSeeker',
            'latestMessage.sender',
        ])
            ->whereHas('userOne')
            ->whereHas('userTwo')
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)
                    ->orWhere('user_two_id', $user->id);
            })
            ->orderByRaw('COALESCE(last_message_at, updated_at) DESC')
            ->get()
            ->filter(fn ($conversation) => $this->otherParticipant($conversation, $user->id))
            ->map(fn ($conversation) => $this->conversationPayload($conversation, $user->id))
            ->values();

        return response()->json($conversations);
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can use messaging'], 403);
        }

        return response()->json(Cache::remember(
            UserCache::unreadMessages($user->id),
            UserCache::UNREAD_COUNT_TTL,
            function () use ($user) {
                $conversationIds = Conversation::whereHas('userOne')
                    ->whereHas('userTwo')
                    ->where(function ($query) use ($user) {
                        $query->where('user_one_id', $user->id)
                            ->orWhere('user_two_id', $user->id);
                    })
                    ->pluck('id');

                return [
                    'unread_count' => Message::whereIn('conversation_id', $conversationIds)
                        ->where('sender_id', '!=', $user->id)
                        ->whereNull('read_at')
                        ->count(),
                ];
            }
        ));
    }

    public function start(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ($currentUser->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can use messaging'], 403);
        }

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'You cannot message yourself'], 422);
        }

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seeker profiles can be messaged right now'], 422);
        }

        if (!$this->areConnected($currentUser->id, $user->id)) {
            return response()->json(['message' => 'You can only message accepted connections'], 403);
        }

        [$userOneId, $userTwoId] = $this->orderedPair($currentUser->id, $user->id);

        $conversation = Conversation::firstOrCreate([
            'user_one_id' => $userOneId,
            'user_two_id' => $userTwoId,
        ]);

        $conversation->load(['userOne.jobSeeker', 'userTwo.jobSeeker', 'latestMessage.sender']);

        return response()->json([
            'message' => 'Conversation ready',
            'conversation' => $this->conversationPayload($conversation, $currentUser->id),
        ]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$this->isParticipant($conversation, $user->id)) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $readMessages = Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($readMessages > 0) {
            UserCache::forgetUnreadMessages($user->id);
        }

        $conversation->load(['userOne.jobSeeker', 'userTwo.jobSeeker', 'latestMessage.sender']);

        if (!$this->otherParticipant($conversation, $user->id)) {
            $conversation->delete();
            UserCache::forgetUnreadMessages($user->id);
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $messages = Message::with('sender.jobSeeker')
            ->where('conversation_id', $conversation->id)
            ->oldest()
            ->get()
            ->map(fn ($message) => $this->messagePayload($message, $user->id));

        return response()->json([
            'conversation' => $this->conversationPayload($conversation->fresh(['userOne.jobSeeker', 'userTwo.jobSeeker', 'latestMessage.sender']), $user->id),
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$this->isParticipant($conversation, $user->id)) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $otherUser = $this->otherParticipant($conversation, $user->id);

        if (!$otherUser) {
            $conversation->delete();
            UserCache::forgetUnreadMessages($user->id);
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if (!$this->areConnected($user->id, $otherUser->id)) {
            return response()->json(['message' => 'You can only message accepted connections'], 403);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'required|string|max:4000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $body = trim($validator->validated()['body']);

        if ($body === '') {
            return response()->json(['message' => 'Message cannot be empty'], 422);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $body,
        ]);

        $conversation->forceFill(['last_message_at' => now()])->save();
        UserCache::forgetUnreadMessages($otherUser->id);

        if ($otherUser->notificationEnabledFor('message_received')) {
            AppNotification::create([
                'user_id' => $otherUser->id,
                'actor_id' => $user->id,
                'type' => 'message_received',
                'title' => 'New message',
                'message' => $user->name . ' sent you a message.',
                'data' => [
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'link' => '/messages?conversation=' . $conversation->id,
                ],
            ]);
            UserCache::forgetUnreadNotifications($otherUser->id);
        }

        return response()->json([
            'message' => 'Message sent',
            'chat_message' => $this->messagePayload($message->fresh('sender.jobSeeker'), $user->id),
            'conversation' => $this->conversationPayload($conversation->fresh(['userOne.jobSeeker', 'userTwo.jobSeeker', 'latestMessage.sender']), $user->id),
        ], 201);
    }

    public function update(Request $request, Message $message)
    {
        $user = $request->user();
        $message->load(['conversation.userOne.jobSeeker', 'conversation.userTwo.jobSeeker', 'sender.jobSeeker']);

        if ($message->sender_id !== $user->id || !$this->isParticipant($message->conversation, $user->id)) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        $otherUser = $this->otherParticipant($message->conversation, $user->id);

        if (!$otherUser) {
            $message->conversation->delete();
            UserCache::forgetUnreadMessages($user->id);
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'required|string|max:4000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $body = trim($validator->validated()['body']);

        if ($body === '') {
            return response()->json(['message' => 'Message cannot be empty'], 422);
        }

        $message->update([
            'body' => $body,
            'edited_at' => now(),
        ]);

        return response()->json([
            'message' => 'Message updated',
            'chat_message' => $this->messagePayload($message->fresh('sender.jobSeeker'), $user->id),
            'conversation' => $this->conversationPayload($message->conversation->fresh(['userOne.jobSeeker', 'userTwo.jobSeeker', 'latestMessage.sender']), $user->id),
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        $user = $request->user();
        $message->load('conversation.userOne.jobSeeker', 'conversation.userTwo.jobSeeker');

        if ($message->sender_id !== $user->id || !$this->isParticipant($message->conversation, $user->id)) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        $conversation = $message->conversation;
        $otherUser = $this->otherParticipant($conversation, $user->id);

        if (!$otherUser) {
            $conversation->delete();
            UserCache::forgetUnreadMessages($user->id);
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $message->delete();
        $this->syncLastMessageAt($conversation);
        UserCache::forgetUnreadMessages($otherUser->id);

        return response()->json([
            'message' => 'Message deleted',
            'deleted_message_id' => $message->id,
            'conversation' => $this->conversationPayload($conversation->fresh(['userOne.jobSeeker', 'userTwo.jobSeeker', 'latestMessage.sender']), $user->id),
        ]);
    }

    private function conversationPayload(Conversation $conversation, int $currentUserId): array
    {
        $otherUser = $this->otherParticipant($conversation, $currentUserId);
        $latestMessage = $conversation->latestMessage;

        return [
            'id' => $conversation->id,
            'other_user' => $this->userPayload($otherUser),
            'latest_message' => $latestMessage ? $this->messagePayload($latestMessage, $currentUserId) : null,
            'unread_count' => Message::where('conversation_id', $conversation->id)
                ->where('sender_id', '!=', $currentUserId)
                ->whereNull('read_at')
                ->count(),
            'last_message_at' => $conversation->last_message_at?->toISOString(),
            'created_at' => $conversation->created_at?->toISOString(),
        ];
    }

    private function messagePayload(Message $message, int $currentUserId): array
    {
        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'body' => $message->body,
            'is_mine' => $message->sender_id === $currentUserId,
            'edited_at' => $message->edited_at?->toISOString(),
            'read_at' => $message->read_at?->toISOString(),
            'created_at' => $message->created_at?->toISOString(),
            'sender' => $this->userPayload($message->sender),
        ];
    }

    private function userPayload(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        $jobSeeker = $user->jobSeeker;
        $storageUrl = request()->getSchemeAndHttpHost() . '/storage/';

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

    private function otherParticipant(Conversation $conversation, int $currentUserId): ?User
    {
        return $conversation->user_one_id === $currentUserId
            ? $conversation->userTwo
            : $conversation->userOne;
    }

    private function removeOrphanedConversationsFor(int $userId): void
    {
        $orphanedConversations = Conversation::with(['userOne', 'userTwo'])
            ->where(function ($query) use ($userId) {
                $query->where('user_one_id', $userId)
                    ->orWhere('user_two_id', $userId);
            })
            ->get()
            ->filter(fn ($conversation) => !$conversation->userOne || !$conversation->userTwo);

        if ($orphanedConversations->isEmpty()) {
            return;
        }

        $affectedUserIds = $orphanedConversations
            ->flatMap(fn ($conversation) => [$conversation->user_one_id, $conversation->user_two_id])
            ->filter()
            ->unique()
            ->values()
            ->all();

        Conversation::whereIn('id', $orphanedConversations->pluck('id'))->delete();

        foreach ($affectedUserIds as $affectedUserId) {
            UserCache::forgetUnreadMessages((int) $affectedUserId);
        }
    }

    private function isParticipant(Conversation $conversation, int $userId): bool
    {
        return $conversation->user_one_id === $userId || $conversation->user_two_id === $userId;
    }

    private function orderedPair(int $firstUserId, int $secondUserId): array
    {
        return $firstUserId < $secondUserId
            ? [$firstUserId, $secondUserId]
            : [$secondUserId, $firstUserId];
    }

    private function areConnected(int $firstUserId, int $secondUserId): bool
    {
        return Connection::where('status', 'accepted')
            ->where(function ($query) use ($firstUserId, $secondUserId) {
                $query->where(function ($inner) use ($firstUserId, $secondUserId) {
                    $inner->where('requester_id', $firstUserId)
                        ->where('receiver_id', $secondUserId);
                })->orWhere(function ($inner) use ($firstUserId, $secondUserId) {
                    $inner->where('requester_id', $secondUserId)
                        ->where('receiver_id', $firstUserId);
                });
            })
            ->exists();
    }

    private function syncLastMessageAt(Conversation $conversation): void
    {
        $latestMessage = Message::where('conversation_id', $conversation->id)
            ->latest()
            ->first();

        $conversation->forceFill([
            'last_message_at' => $latestMessage?->created_at,
        ])->save();
    }
}
