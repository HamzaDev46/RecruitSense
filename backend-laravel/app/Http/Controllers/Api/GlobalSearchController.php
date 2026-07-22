<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Connection;
use App\Models\JobPosting;
use App\Models\Post;
use App\Models\SearchAppearance;
use App\Models\User;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class GlobalSearchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $term = Str::of((string) $request->query('query', ''))
            ->squish()
            ->limit(80, '')
            ->toString();

        if (Str::length($term) < 2) {
            return response()->json([
                'query' => $term,
                'jobs' => [],
                'people' => [],
                'posts' => [],
                'counts' => [
                    'jobs' => 0,
                    'people' => 0,
                    'posts' => 0,
                ],
            ]);
        }

        $likeTerm = '%' . $term . '%';
        $connectedIds = $this->acceptedConnectionUserIds($user->id);

        $jobs = $this->searchJobs($request, $likeTerm);
        $people = $this->searchPeople($request, $likeTerm, $connectedIds);
        $posts = $this->searchPosts($request, $likeTerm, $connectedIds);

        $this->recordSearchAppearances($people, $request, $term);

        return response()->json([
            'query' => $term,
            'jobs' => $jobs->map(fn ($job) => $this->jobPayload($job, $request))->values(),
            'people' => $people->map(fn ($person) => $this->personPayload($person, $request, $connectedIds))->values(),
            'posts' => $posts->map(fn ($post) => $this->postPayload($post, $request, $connectedIds))->values(),
            'counts' => [
                'jobs' => $jobs->count(),
                'people' => $people->count(),
                'posts' => $posts->count(),
            ],
        ]);
    }

    private function searchJobs(Request $request, string $likeTerm): Collection
    {
        return JobPosting::with('company')
            ->where(function ($query) use ($likeTerm) {
                $query->where('title', 'like', $likeTerm)
                    ->orWhere('description', 'like', $likeTerm)
                    ->orWhere('required_skills', 'like', $likeTerm)
                    ->orWhereHas('company', function ($companyQuery) use ($likeTerm) {
                        $companyQuery->where('name', 'like', $likeTerm)
                            ->orWhere('industry', 'like', $likeTerm);
                    });
            })
            ->latest()
            ->limit(12)
            ->get();
    }

    private function searchPeople(Request $request, string $likeTerm, array $connectedIds): Collection
    {
        $user = $request->user();

        return User::with('jobSeeker')
            ->where('id', '!=', $user->id)
            ->where('role', 'jobseeker')
            ->whereHas('jobSeeker', function ($profileQuery) use ($connectedIds) {
                $profileQuery->where('profile_visibility', 'public')
                    ->orWhere(function ($networkQuery) use ($connectedIds) {
                        $networkQuery->where('profile_visibility', 'network')
                            ->whereIn('user_id', $connectedIds);
                    });
            })
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
            ->limit(12)
            ->get();
    }

    private function searchPosts(Request $request, string $likeTerm, array $connectedIds): Collection
    {
        $user = $request->user();

        return Post::with(['user.jobSeeker', 'media'])
            ->withCount(['likes', 'comments', 'impressions'])
            ->whereHas('user')
            ->where(function ($scope) use ($user, $connectedIds) {
                $scope->where('visibility', 'public')
                    ->orWhere('user_id', $user->id)
                    ->orWhere(function ($connectionScope) use ($connectedIds) {
                        $connectionScope->where('visibility', 'connections')
                            ->whereIn('user_id', $connectedIds);
                    });
            })
            ->where(function ($query) use ($likeTerm) {
                $query->where('body', 'like', $likeTerm)
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', $likeTerm));
            })
            ->latest()
            ->limit(12)
            ->get();
    }

    private function jobPayload(JobPosting $job, Request $request): array
    {
        $jobSeeker = $request->user()->jobSeeker;
        $saved = false;
        $applied = false;

        if ($jobSeeker) {
            $saved = $job->savedJobs()->where('job_seeker_id', $jobSeeker->id)->exists();
            $applied = Application::where('job_id', $job->id)
                ->where('job_seeker_id', $jobSeeker->id)
                ->exists();
        }

        return [
            'id' => $job->id,
            'title' => $job->title,
            'description' => Str::limit((string) $job->description, 220),
            'required_skills' => $job->required_skills,
            'created_at' => $job->created_at?->toISOString(),
            'is_saved' => $saved,
            'has_applied' => $applied,
            'company' => $job->company ? [
                'id' => $job->company->id,
                'name' => $job->company->name,
                'industry' => $job->company->industry,
            ] : null,
        ];
    }

    private function personPayload(User $user, Request $request, array $connectedIds): array
    {
        $jobSeeker = $user->jobSeeker;
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $user->id,
            'name' => $user->name,
            'headline' => $jobSeeker?->headline,
            'location' => $jobSeeker?->location,
            'company' => $jobSeeker?->company,
            'skills' => $jobSeeker?->skills,
            'is_connected' => in_array($user->id, $connectedIds, true),
            'profile_image_url' => $jobSeeker?->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
        ];
    }

    private function postPayload(Post $post, Request $request, array $connectedIds): array
    {
        return [
            'id' => $post->id,
            'body' => Str::limit((string) $post->body, 260),
            'visibility' => $post->visibility,
            'created_at' => $post->created_at?->toISOString(),
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'impressions_count' => $post->impressions_count,
            'media_count' => $post->media->count(),
            'author' => $this->personPayload($post->user, $request, $connectedIds),
        ];
    }

    private function acceptedConnectionUserIds(int $userId): array
    {
        return Connection::where('status', 'accepted')
            ->whereHas('requester')
            ->whereHas('receiver')
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
}
