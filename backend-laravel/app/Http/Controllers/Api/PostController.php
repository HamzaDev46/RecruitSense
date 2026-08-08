<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Connection;
use App\Models\ContentReport;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostImpression;
use App\Models\User;
use App\Models\UserBlock;
use App\Support\UserCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    public function feed(Request $request)
    {
        $viewer = $request->user();

        $posts = $this->visiblePosts(Post::query(), $viewer)
            ->with($this->postRelations())
            ->withCount(['likes', 'comments', 'impressions', 'reposts'])
            ->latest()
            ->limit(30)
            ->get();

        $this->recordImpressions($posts, $viewer);

        return response()->json(
            $posts->map(fn ($post) => $this->postPayload($this->postForResponse($post), $request))
        );
    }

    public function show(Request $request, Post $post)
    {
        if (!$this->canViewPost($post, $request->user())) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $this->recordImpressions(collect([$post]), $request->user());

        return response()->json($this->postPayload($this->postForResponse($post), $request));
    }

    public function userPosts(Request $request, User $user)
    {
        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        $viewer = $request->user();

        $posts = $this->visiblePosts(Post::where('user_id', $user->id), $viewer)
            ->with($this->postRelations())
            ->withCount(['likes', 'comments', 'impressions', 'reposts'])
            ->latest()
            ->limit(20)
            ->get();

        $this->recordImpressions($posts, $viewer);

        return response()->json(
            $posts->map(fn ($post) => $this->postPayload($this->postForResponse($post), $request))
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can create posts right now'], 403);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'nullable|string|max:3000',
            'visibility' => ['required', Rule::in(['public', 'connections'])],
            'media' => 'nullable|array|max:4',
            'media.*' => 'file|mimes:jpg,jpeg,png,webp,mp4,mov,webm|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $body = trim((string) $request->input('body', ''));
        $mediaFiles = $request->file('media', []);

        if ($body === '' && count($mediaFiles) === 0) {
            return response()->json(['message' => 'Write something or attach media before posting'], 422);
        }

        $post = Post::create([
            'user_id' => $user->id,
            'body' => $body ?: null,
            'visibility' => $request->input('visibility', 'public'),
        ]);

        foreach ($mediaFiles as $file) {
            $post->media()->create([
                'file_path' => $file->store('post-media', 'public'),
                'file_type' => str_starts_with($file->getMimeType(), 'video/') ? 'video' : 'image',
            ]);
        }

        return response()->json([
            'message' => 'Post created',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ], 201);
    }

    public function destroy(Request $request, Post $post)
    {
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $commentIds = $post->comments()->pluck('id');

        foreach ($post->media as $media) {
            Storage::disk('public')->delete($media->file_path);
        }

        ContentReport::query()
            ->where(function ($query) use ($post, $commentIds) {
                $query->where(function ($postQuery) use ($post) {
                    $postQuery->where('reportable_type', 'post')
                        ->where('reportable_id', $post->id);
                })->orWhere(function ($commentQuery) use ($commentIds) {
                    $commentQuery->where('reportable_type', 'comment')
                        ->whereIn('reportable_id', $commentIds);
                });
            })
            ->delete();
        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }

    public function update(Request $request, Post $post)
    {
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'nullable|string|max:3000',
            'visibility' => ['required', Rule::in(['public', 'connections'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $body = trim((string) $request->input('body', ''));
        $hasExistingContent = $post->media()->exists() || $post->repost_of_id;

        if ($body === '' && !$hasExistingContent) {
            return response()->json(['message' => 'Write something before saving this post'], 422);
        }

        $post->update([
            'body' => $body ?: null,
            'visibility' => $request->input('visibility', 'public'),
        ]);

        return response()->json([
            'message' => 'Post updated',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ]);
    }

    public function repost(Request $request, Post $post)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can repost right now'], 403);
        }

        $post->loadMissing('originalPost.user.jobSeeker', 'user.jobSeeker');
        $sourcePost = $post->repost_of_id ? $post->originalPost : $post;

        if (!$sourcePost || !$this->canViewPost($sourcePost, $user)) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'nullable|string|max:1000',
            'visibility' => ['nullable', Rule::in(['public', 'connections'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $repost = Post::updateOrCreate([
            'user_id' => $user->id,
            'repost_of_id' => $sourcePost->id,
        ], [
            'body' => trim((string) ($data['body'] ?? '')) ?: null,
            'visibility' => $data['visibility'] ?? 'public',
        ]);

        if ($repost->wasRecentlyCreated) {
            $this->createNotification(
                $sourcePost->user_id,
                $user->id,
                'post_repost',
                'New repost',
                $user->name . ' reposted your post.',
                ['link' => '/feed?post=' . $sourcePost->id, 'post_id' => $sourcePost->id, 'repost_id' => $repost->id]
            );
        }

        return response()->json([
            'message' => $repost->wasRecentlyCreated ? 'Post reposted' : 'Repost updated',
            'post' => $this->postPayload($this->postForResponse($repost), $request),
            'source_post' => $this->postPayload($this->postForResponse($sourcePost), $request),
        ], $repost->wasRecentlyCreated ? 201 : 200);
    }

    public function unrepost(Request $request, Post $post)
    {
        $user = $request->user();
        $post->loadMissing('originalPost');
        $sourcePost = $post->repost_of_id ? $post->originalPost : $post;

        if (!$sourcePost) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        Post::where('user_id', $user->id)
            ->where('repost_of_id', $sourcePost->id)
            ->delete();

        return response()->json([
            'message' => 'Repost removed',
            'source_post' => $this->postPayload($this->postForResponse($sourcePost), $request),
        ]);
    }

    public function like(Request $request, Post $post)
    {
        if (!$this->canViewPost($post, $request->user())) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $like = $post->likes()->firstOrCreate(['user_id' => $request->user()->id]);

        if ($like->wasRecentlyCreated) {
            $this->createNotification(
                $post->user_id,
                $request->user()->id,
                'post_like',
                'New post like',
                $request->user()->name . ' liked your post.',
                ['link' => '/feed?post=' . $post->id, 'post_id' => $post->id]
            );
        }

        return response()->json([
            'message' => 'Post liked',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ]);
    }

    public function unlike(Request $request, Post $post)
    {
        if (!$this->canViewPost($post, $request->user())) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $post->likes()->where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Post unliked',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ]);
    }

    public function comment(Request $request, Post $post)
    {
        if (!$this->canViewPost($post, $request->user())) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $data = Validator::make($request->all(), [
            'body' => 'required|string|max:1000',
        ])->validate();

        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'body' => trim($data['body']),
        ]);

        $this->createNotification(
            $post->user_id,
            $request->user()->id,
            'post_comment',
            'New comment',
            $request->user()->name . ' commented on your post.',
            ['link' => '/feed?post=' . $post->id, 'post_id' => $post->id, 'comment_id' => $comment->id]
        );

        return response()->json([
            'message' => 'Comment added',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ], 201);
    }

    public function deleteComment(Request $request, PostComment $comment)
    {
        $post = $comment->post;
        $userId = $request->user()->id;

        if ($comment->user_id !== $userId && $post->user_id !== $userId) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        ContentReport::where('reportable_type', 'comment')
            ->where('reportable_id', $comment->id)
            ->delete();
        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ]);
    }

    public function updateComment(Request $request, PostComment $comment)
    {
        $post = $comment->post;

        if (!$post || $comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        if (!$this->canViewPost($post, $request->user())) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $data = Validator::make($request->all(), [
            'body' => 'required|string|max:1000',
        ])->validate();

        $comment->update([
            'body' => trim($data['body']),
        ]);

        return response()->json([
            'message' => 'Comment updated',
            'post' => $this->postPayload($this->postForResponse($post), $request),
        ]);
    }

    private function visiblePosts(Builder $query, User $viewer): Builder
    {
        $connectedIds = $this->acceptedConnectionUserIds($viewer->id);
        $blockedIds = UserBlock::blockedUserIdsFor($viewer->id);
        $visibilityScope = function ($scope) use ($viewer, $connectedIds) {
            $scope->where('visibility', 'public')
                ->orWhere('user_id', $viewer->id)
                ->orWhere(function ($connectionScope) use ($connectedIds) {
                    $connectionScope->where('visibility', 'connections')
                        ->whereIn('user_id', $connectedIds);
                });
        };

        return $query
            ->whereHas('user')
            ->when($blockedIds, fn ($scope) => $scope->whereNotIn('user_id', $blockedIds))
            ->where($visibilityScope)
            ->where(function ($scope) use ($blockedIds, $visibilityScope) {
                $scope->whereNull('repost_of_id')
                    ->orWhereHas('originalPost', function ($originalQuery) use ($blockedIds, $visibilityScope) {
                        $originalQuery->whereHas('user')
                            ->when($blockedIds, fn ($blockedScope) => $blockedScope->whereNotIn('user_id', $blockedIds))
                            ->where($visibilityScope);
                    });
            });
    }

    private function canViewPost(Post $post, User $viewer): bool
    {
        $post->loadMissing('originalPost.user');

        if (UserBlock::existsBetween($post->user_id, $viewer->id)) {
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

    private function recordImpressions(Collection $posts, User $viewer): void
    {
        foreach ($posts as $post) {
            if ($post->user_id === $viewer->id) {
                continue;
            }

            $impression = PostImpression::firstOrCreate([
                'post_id' => $post->id,
                'viewer_user_id' => $viewer->id,
                'viewed_on' => now()->toDateString(),
            ]);

            if ($impression->wasRecentlyCreated) {
                UserCache::forgetProfile($post->user_id);
            }
        }
    }

    private function postForResponse(Post $post): Post
    {
        $freshPost = $post->fresh()
            ->load($this->postRelations())
            ->loadCount(['likes', 'comments', 'impressions', 'reposts']);

        if ($freshPost->originalPost) {
            $freshPost->originalPost
                ->load(['user.jobSeeker', 'media'])
                ->loadCount(['likes', 'comments', 'impressions', 'reposts']);
        }

        return $freshPost;
    }

    private function postRelations(): array
    {
        return [
            'user.jobSeeker',
            'media',
            'likes',
            'comments.user.jobSeeker',
            'originalPost.user.jobSeeker',
            'originalPost.media',
        ];
    }

    private function postPayload(Post $post, Request $request): array
    {
        $sourcePost = $post->repost_of_id && $post->originalPost ? $post->originalPost : $post;
        $sourcePostId = $sourcePost->id;
        $blockedIds = UserBlock::blockedUserIdsFor($request->user()->id);
        $visibleComments = $post->comments
            ->filter(fn ($comment) => !in_array($comment->user_id, $blockedIds, true))
            ->values();
        $repostsCount = Post::where('repost_of_id', $sourcePostId)->whereHas('user')->count();
        $isReposted = Post::where('user_id', $request->user()->id)
            ->where('repost_of_id', $sourcePostId)
            ->exists();

        return [
            'id' => $post->id,
            'repost_of_id' => $post->repost_of_id,
            'is_repost' => (bool) $post->repost_of_id,
            'body' => $post->body,
            'visibility' => $post->visibility,
            'created_at' => $post->created_at?->toISOString(),
            'updated_at' => $post->updated_at?->toISOString(),
            'author' => $this->userPayload($post->user, $request),
            'original_post' => $post->repost_of_id && $post->originalPost
                ? $this->originalPostPayload($post->originalPost, $request)
                : null,
            'media' => $post->media->map(fn ($media) => [
                'id' => $media->id,
                'file_type' => $media->file_type,
                'url' => $request->getSchemeAndHttpHost() . '/storage/' . $media->file_path,
            ]),
            'likes_count' => $post->likes_count,
            'comments_count' => $visibleComments->count(),
            'impressions_count' => $post->impressions_count,
            'reposts_count' => $repostsCount,
            'is_reposted' => $isReposted,
            'is_liked' => $post->likes->contains('user_id', $request->user()->id),
            'can_edit' => $post->user_id === $request->user()->id,
            'can_delete' => $post->user_id === $request->user()->id,
            'can_report' => $post->user_id !== $request->user()->id,
            'comments' => $visibleComments->map(fn ($comment) => [
                'id' => $comment->id,
                'body' => $comment->body,
                'created_at' => $comment->created_at?->toISOString(),
                'updated_at' => $comment->updated_at?->toISOString(),
                'author' => $this->userPayload($comment->user, $request),
                'can_edit' => $comment->user_id === $request->user()->id,
                'can_delete' => $comment->user_id === $request->user()->id || $post->user_id === $request->user()->id,
                'can_report' => $comment->user_id !== $request->user()->id,
            ]),
        ];
    }

    private function originalPostPayload(Post $post, Request $request): array
    {
        return [
            'id' => $post->id,
            'body' => $post->body,
            'visibility' => $post->visibility,
            'created_at' => $post->created_at?->toISOString(),
            'author' => $this->userPayload($post->user, $request),
            'media' => $post->media->map(fn ($media) => [
                'id' => $media->id,
                'file_type' => $media->file_type,
                'url' => $request->getSchemeAndHttpHost() . '/storage/' . $media->file_path,
            ]),
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
            'headline' => $jobSeeker?->headline,
            'company' => $jobSeeker?->company,
            'location' => $jobSeeker?->location,
            'profile_image_url' => $jobSeeker?->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
        ];
    }

    private function createNotification(int $userId, ?int $actorId, string $type, string $title, string $message, array $data = []): void
    {
        if ($actorId && $userId === $actorId) {
            return;
        }

        if ($actorId && UserBlock::existsBetween($userId, $actorId)) {
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
