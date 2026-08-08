<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connection;
use App\Models\ContentReport;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ContentReportController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => ['required', Rule::in(ContentReport::TYPES)],
            'reportable_id' => ['required', 'integer', 'min:1'],
            'reason' => ['required', Rule::in(ContentReport::REASONS)],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $reporter = $request->user();
        $reportedUserId = $this->reportedUserId($data['type'], (int) $data['reportable_id'], $reporter);

        if (!$reportedUserId) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        if ($reportedUserId === $reporter->id) {
            return response()->json(['message' => 'You cannot report your own content'], 422);
        }

        if (UserBlock::existsBetween($reporter->id, $reportedUserId)) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        $report = ContentReport::firstOrCreate([
            'reporter_id' => $reporter->id,
            'reportable_type' => $data['type'],
            'reportable_id' => (int) $data['reportable_id'],
        ], [
            'reported_user_id' => $reportedUserId,
            'reason' => $data['reason'],
            'details' => trim((string) ($data['details'] ?? '')) ?: null,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => $report->wasRecentlyCreated
                ? 'Report submitted'
                : 'You already reported this content',
            'report' => [
                'id' => $report->id,
                'type' => $report->reportable_type,
                'reason' => $report->reason,
                'status' => $report->status,
            ],
        ], $report->wasRecentlyCreated ? 201 : 200);
    }

    private function reportedUserId(string $type, int $id, User $reporter): ?int
    {
        if ($type === 'profile') {
            $user = User::where('role', 'jobseeker')->find($id);

            return $user?->id;
        }

        if ($type === 'post') {
            $post = Post::with('user', 'originalPost.user')->find($id);

            return $post && $this->canViewPost($post, $reporter) ? $post->user_id : null;
        }

        if ($type === 'comment') {
            $comment = PostComment::with('user', 'post.user', 'post.originalPost.user')->find($id);

            if (!$comment || !$comment->post || !$this->canViewPost($comment->post, $reporter)) {
                return null;
            }

            return $comment->user_id;
        }

        return null;
    }

    private function canViewPost(Post $post, User $viewer): bool
    {
        $post->loadMissing('user', 'originalPost.user');

        if (!$post->user || UserBlock::existsBetween($post->user_id, $viewer->id)) {
            return false;
        }

        if ($post->visibility === 'public' || $post->user_id === $viewer->id) {
            return $post->repost_of_id
                ? $post->originalPost && $this->canViewPost($post->originalPost, $viewer)
                : true;
        }

        $canSeePost = in_array($post->user_id, $this->acceptedConnectionUserIds($viewer->id), true);

        if (!$canSeePost) {
            return false;
        }

        return $post->repost_of_id
            ? $post->originalPost && $this->canViewPost($post->originalPost, $viewer)
            : true;
    }

    private function acceptedConnectionUserIds(int $userId): array
    {
        return Connection::where('status', 'accepted')
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->get()
            ->map(fn ($connection) => $connection->requester_id === $userId
                ? $connection->receiver_id
                : $connection->requester_id)
            ->reject(fn ($connectedId) => in_array($connectedId, UserBlock::blockedUserIdsFor($userId), true))
            ->values()
            ->all();
    }
}
