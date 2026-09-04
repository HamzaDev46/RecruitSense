<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\Connection;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\UserBlock;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    public function conversations(Request $request)
    {
        $user = $request->user();

        if (!$this->canUseMessaging($user)) {
            return response()->json(['message' => 'Messaging is not available for this account'], 403);
        }

        $this->removeOrphanedConversationsFor($user->id);

        $conversations = Conversation::with([
            'userOne.jobSeeker',
            'userOne.company',
            'userTwo.jobSeeker',
            'userTwo.company',
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
            ->filter(function ($conversation) use ($user) {
                $otherUser = $this->otherParticipant($conversation, $user->id);
                return $otherUser && !UserBlock::existsBetween($user->id, $otherUser->id);
            })
            ->map(fn ($conversation) => $this->conversationPayload($conversation, $user->id))
            ->values();

        return response()->json($conversations);
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();

        if (!$this->canUseMessaging($user)) {
            return response()->json(['message' => 'Messaging is not available for this account'], 403);
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

        if (!$this->canUseMessaging($currentUser)) {
            return response()->json(['message' => 'Messaging is not available for this account'], 403);
        }

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'You cannot message yourself'], 422);
        }

        if (UserBlock::existsBetween($currentUser->id, $user->id)) {
            return response()->json(['message' => 'You cannot message this user'], 403);
        }

        if (!$this->canMessageBetween($currentUser, $user)) {
            return response()->json(['message' => $this->messagePermissionText($currentUser)], 403);
        }

        [$userOneId, $userTwoId] = $this->orderedPair($currentUser->id, $user->id);

        $conversation = Conversation::firstOrCreate([
            'user_one_id' => $userOneId,
            'user_two_id' => $userTwoId,
        ]);

        $initialBody = trim((string) ($request->input('body') ?: $request->input('message', '')));
        $sentMessage = null;

        if ($initialBody !== '') {
            $sentMessage = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $currentUser->id,
                'body' => $initialBody,
            ]);

            $this->syncLastMessageAt($conversation);

            AppNotification::create([
                'user_id' => $user->id,
                'type' => 'new_message',
                'title' => 'New Message from ' . ($currentUser->company?->name ?: $currentUser->name),
                'message' => Str::limit($initialBody, 120),
                'link' => '/messages?conversation=' . $conversation->id,
                'actor_user_id' => $currentUser->id,
            ]);

            UserCache::forgetUnreadMessages($user->id);
        }

        $conversation->load(['userOne.jobSeeker', 'userOne.company', 'userTwo.jobSeeker', 'userTwo.company', 'latestMessage.sender']);

        return response()->json([
            'message' => 'Conversation ready',
            'conversation' => $this->conversationPayload($conversation, $currentUser->id),
            'chat_message' => $sentMessage ? $this->messagePayload($sentMessage, $currentUser->id) : null,
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

        $conversation->load(['userOne.jobSeeker', 'userOne.company', 'userTwo.jobSeeker', 'userTwo.company', 'latestMessage.sender']);

        $otherUser = $this->otherParticipant($conversation, $user->id);

        if (!$otherUser) {
            $conversation->delete();
            UserCache::forgetUnreadMessages($user->id);
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if (UserBlock::existsBetween($user->id, $otherUser->id)) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $messages = Message::with('sender.jobSeeker', 'sender.company')
            ->where('conversation_id', $conversation->id)
            ->oldest()
            ->get()
            ->map(fn ($message) => $this->messagePayload($message, $user->id));

        return response()->json([
            'conversation' => $this->conversationPayload($conversation->fresh(['userOne.jobSeeker', 'userOne.company', 'userTwo.jobSeeker', 'userTwo.company', 'latestMessage.sender']), $user->id),
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

        if (UserBlock::existsBetween($user->id, $otherUser->id)) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if (!$this->canMessageBetween($user, $otherUser)) {
            return response()->json(['message' => $this->messagePermissionText($user)], 403);
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
            'chat_message' => $this->messagePayload($message->fresh('sender.jobSeeker', 'sender.company'), $user->id),
            'conversation' => $this->conversationPayload($conversation->fresh(['userOne.jobSeeker', 'userOne.company', 'userTwo.jobSeeker', 'userTwo.company', 'latestMessage.sender']), $user->id),
        ], 201);
    }

    public function update(Request $request, Message $message)
    {
        $user = $request->user();
        $message->load(['conversation.userOne.jobSeeker', 'conversation.userOne.company', 'conversation.userTwo.jobSeeker', 'conversation.userTwo.company', 'sender.jobSeeker', 'sender.company']);

        if ($message->sender_id !== $user->id || !$this->isParticipant($message->conversation, $user->id)) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        $otherUser = $this->otherParticipant($message->conversation, $user->id);

        if (!$otherUser) {
            $message->conversation->delete();
            UserCache::forgetUnreadMessages($user->id);
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if (UserBlock::existsBetween($user->id, $otherUser->id)) {
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
            'chat_message' => $this->messagePayload($message->fresh('sender.jobSeeker', 'sender.company'), $user->id),
            'conversation' => $this->conversationPayload($message->conversation->fresh(['userOne.jobSeeker', 'userOne.company', 'userTwo.jobSeeker', 'userTwo.company', 'latestMessage.sender']), $user->id),
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        $user = $request->user();
        $message->load('conversation.userOne.jobSeeker', 'conversation.userOne.company', 'conversation.userTwo.jobSeeker', 'conversation.userTwo.company');

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

        if (UserBlock::existsBetween($user->id, $otherUser->id)) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $message->delete();
        $this->syncLastMessageAt($conversation);
        UserCache::forgetUnreadMessages($otherUser->id);

        return response()->json([
            'message' => 'Message deleted',
            'deleted_message_id' => $message->id,
            'conversation' => $this->conversationPayload($conversation->fresh(['userOne.jobSeeker', 'userOne.company', 'userTwo.jobSeeker', 'userTwo.company', 'latestMessage.sender']), $user->id),
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
        $company = $user->company;
        $storageUrl = request()->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $user->id,
            'name' => $company?->name ?: $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'headline' => $jobSeeker?->headline ?: ($company?->industry ? $company->industry . ' company' : null),
            'location' => $jobSeeker?->location,
            'company' => $jobSeeker?->company ?: $company?->name,
            'profile_image_url' => $jobSeeker?->profile_image
                ? $storageUrl . $jobSeeker->profile_image
                : $company?->logo_url,
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
        if (UserBlock::existsBetween($firstUserId, $secondUserId)) {
            return false;
        }

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

    private function canUseMessaging(User $user): bool
    {
        return in_array($user->role, ['jobseeker', 'company'], true);
    }

    private function canMessageBetween(User $sender, User $receiver): bool
    {
        if (UserBlock::existsBetween($sender->id, $receiver->id)) {
            return false;
        }

        if ($sender->role === 'jobseeker' && $receiver->role === 'jobseeker') {
            return $this->areConnected($sender->id, $receiver->id);
        }

        // Verified / active companies can reach out to any active job seeker
        if ($sender->role === 'company' && $receiver->role === 'jobseeker') {
            return true;
        }

        // Job seekers can message companies if applied or if conversation exists
        if ($sender->role === 'jobseeker' && $receiver->role === 'company') {
            return $this->companyHasApplicant($receiver, $sender) || Conversation::where(function ($query) use ($sender, $receiver) {
                $query->where('user_one_id', $sender->id)->where('user_two_id', $receiver->id);
            })->orWhere(function ($query) use ($sender, $receiver) {
                $query->where('user_one_id', $receiver->id)->where('user_two_id', $sender->id);
            })->exists();
        }

        return false;
    }

    private function companyHasApplicant(User $companyUser, User $candidateUser): bool
    {
        $companyId = $companyUser->company?->id;
        $jobSeekerId = $candidateUser->jobSeeker?->id;

        if (!$companyId || !$jobSeekerId) {
            return false;
        }

        return Application::query()
            ->where('job_seeker_id', $jobSeekerId)
            ->whereHas('jobPosting', fn ($query) => $query->where('company_id', $companyId))
            ->where('status', '!=', 'withdrawn')
            ->exists();
    }

    private function messagePermissionText(User $sender): string
    {
        return $sender->role === 'company'
            ? 'You can only message candidates who applied to your jobs'
            : 'You can only message accepted connections or companies you applied to';
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
