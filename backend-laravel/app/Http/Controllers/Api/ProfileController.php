<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\Connection;
use App\Models\JobExperience;
use App\Models\PostImpression;
use App\Models\ProfileView;
use App\Models\SearchAppearance;
use App\Models\User;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('jobSeeker.experiences');

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can access this profile'], 403);
        }

        return response()->json(Cache::remember(
            UserCache::profile($user->id),
            UserCache::PROFILE_TTL,
            fn () => $this->profilePayload($user->fresh()->load('jobSeeker.experiences'), $request)
        ));
    }

    public function showByUser(Request $request, User $user)
    {
        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        if (!$this->canViewProfile($request, $user)) {
            return response()->json(['message' => 'This profile is private'], 403);
        }

        $this->recordProfileView($request, $user);

        $user->load('jobSeeker.experiences');

        return response()->json($this->profilePayload($user, $request));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can update this profile'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'headline' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:40',
            'website' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'about' => 'nullable|string|max:3000',
            'skills' => 'nullable|string|max:1000',
            'cover_position' => 'nullable|string|max:50',
            'profile_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $jobSeeker = $user->jobSeeker;

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        $jobSeeker->fill($request->only([
            'headline',
            'location',
            'phone',
            'website',
            'company',
            'education',
            'about',
            'skills',
            'cover_position',
        ]));

        if ($request->hasFile('profile_image')) {
            $this->replaceFile($jobSeeker, 'profile_image', $request->file('profile_image'), 'profile-images');
        }

        if ($request->hasFile('cover_image')) {
            $this->replaceFile($jobSeeker, 'cover_image', $request->file('cover_image'), 'cover-images');
        }

        $jobSeeker->save();
        UserCache::forgetProfile($user->id);
        UserCache::forgetNetworkSummary($user->id);

        return response()->json($this->profilePayload($user->fresh()->load('jobSeeker.experiences'), $request));
    }

    public function viewers(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can access profile analytics'], 403);
        }

        $views = ProfileView::with('viewerUser.jobSeeker')
            ->where('profile_user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($view) => $this->profileViewerPayload($view, $request));

        $searchAppearances = SearchAppearance::with('searcherUser.jobSeeker')
            ->where('profile_user_id', $user->id)
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($appearance) => $this->searchAppearancePayload($appearance, $request));

        return response()->json([
            'total' => ProfileView::where('profile_user_id', $user->id)->count(),
            'viewers' => $views,
            'search_appearances_total' => SearchAppearance::where('profile_user_id', $user->id)->count(),
            'search_appearances' => $searchAppearances,
        ]);
    }

    public function storeExperience(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can add experience'], 403);
        }

        $data = $this->validateExperience($request);

        $experience = $user->jobSeeker->experiences()->create($data);
        UserCache::forgetProfile($user->id);

        return response()->json($experience, 201);
    }

    public function updateExperience(Request $request, JobExperience $experience)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker' || $experience->job_seeker_id !== $user->jobSeeker->id) {
            return response()->json(['message' => 'Experience not found'], 404);
        }

        $experience->update($this->validateExperience($request));
        UserCache::forgetProfile($user->id);

        return response()->json($experience);
    }

    public function destroyExperience(Request $request, JobExperience $experience)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker' || $experience->job_seeker_id !== $user->jobSeeker->id) {
            return response()->json(['message' => 'Experience not found'], 404);
        }

        $experience->delete();
        UserCache::forgetProfile($user->id);

        return response()->json(['message' => 'Experience deleted successfully']);
    }

    private function validateExperience(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'employment_type' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'boolean',
            'description' => 'nullable|string|max:2000',
        ])->validate();

        if (!empty($data['is_current'])) {
            $data['end_date'] = null;
        }

        return $data;
    }

    private function replaceFile($jobSeeker, string $field, $file, string $directory): void
    {
        if ($jobSeeker->{$field}) {
            Storage::disk('public')->delete($jobSeeker->{$field});
        }

        $jobSeeker->{$field} = $file->store($directory, 'public');
    }

    private function recordProfileView(Request $request, User $profileUser): void
    {
        $viewer = $request->user();

        if (!$viewer || $viewer->id === $profileUser->id) {
            return;
        }

        $profileUser->loadMissing('jobSeeker');

        $profileView = ProfileView::firstOrCreate([
            'profile_user_id' => $profileUser->id,
            'viewer_user_id' => $viewer->id,
            'viewed_on' => now()->toDateString(),
        ], [
            'viewer_ip' => $request->ip(),
        ]);

        if ($profileView->wasRecentlyCreated && $profileUser->jobSeeker?->show_profile_view_notifications) {
            $this->createNotification(
                $profileUser->id,
                $viewer->id,
                'profile_view',
                'Profile viewed',
                $viewer->name . ' viewed your profile.',
                ['link' => '/profile/' . $viewer->id]
            );
        }

        if ($profileView->wasRecentlyCreated) {
            UserCache::forgetProfile($profileUser->id);
        }
    }

    private function canViewProfile(Request $request, User $profileUser): bool
    {
        $viewer = $request->user();

        if ($viewer?->id === $profileUser->id) {
            return true;
        }

        $profileUser->loadMissing('jobSeeker');
        $visibility = $profileUser->jobSeeker?->profile_visibility ?: 'public';

        if ($visibility === 'public') {
            return true;
        }

        if ($visibility === 'private' || !$viewer) {
            return false;
        }

        return Connection::where('status', 'accepted')
            ->where(function ($query) use ($viewer, $profileUser) {
                $query->where(function ($inner) use ($viewer, $profileUser) {
                    $inner->where('requester_id', $viewer->id)
                        ->where('receiver_id', $profileUser->id);
                })->orWhere(function ($inner) use ($viewer, $profileUser) {
                    $inner->where('requester_id', $profileUser->id)
                        ->where('receiver_id', $viewer->id);
                });
            })
            ->exists();
    }

    private function profilePayload($user, Request $request): array
    {
        $jobSeeker = $user->jobSeeker;
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';
        $viewsCount = ProfileView::where('profile_user_id', $user->id)->count();
        $postImpressionsCount = PostImpression::whereHas('post', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->count();
        $searchAppearancesCount = SearchAppearance::where('profile_user_id', $user->id)->count();
        $applicationsCount = $jobSeeker
            ? Application::where('job_seeker_id', $jobSeeker->id)->count()
            : 0;

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'profile' => [
                'id' => $jobSeeker->id,
                'headline' => $jobSeeker->headline,
                'location' => $jobSeeker->location,
                'phone' => $jobSeeker->phone,
                'website' => $jobSeeker->website,
                'company' => $jobSeeker->company,
                'education' => $jobSeeker->education,
                'about' => $jobSeeker->about,
                'skills' => $jobSeeker->skills,
                'profile_image' => $jobSeeker->profile_image,
                'cover_image' => $jobSeeker->cover_image,
                'cover_position' => $jobSeeker->cover_position ?: 'center center',
                'profile_visibility' => $jobSeeker->profile_visibility ?: 'public',
                'profile_image_url' => $jobSeeker->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
                'cover_image_url' => $jobSeeker->cover_image ? $storageUrl . $jobSeeker->cover_image : null,
            ],
            'experiences' => $jobSeeker->experiences->values()->map(fn ($experience) => [
                'id' => $experience->id,
                'title' => $experience->title,
                'company' => $experience->company,
                'employment_type' => $experience->employment_type,
                'location' => $experience->location,
                'start_date' => $experience->start_date,
                'end_date' => $experience->end_date,
                'is_current' => (bool) $experience->is_current,
                'description' => $experience->description,
                'created_at' => $experience->created_at?->toISOString(),
                'updated_at' => $experience->updated_at?->toISOString(),
            ])->all(),
            'analytics' => [
                'views_count' => $viewsCount,
                'post_impressions_count' => $postImpressionsCount,
                'applications_count' => $applicationsCount,
                'search_appearances_count' => $searchAppearancesCount,
            ],
            'is_owner' => $request->user()?->id === $user->id,
        ];
    }

    private function profileViewerPayload(ProfileView $view, Request $request): array
    {
        $viewer = $view->viewerUser;
        $jobSeeker = $viewer?->jobSeeker;
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $view->id,
            'viewed_on' => $view->viewed_on?->format('Y-m-d'),
            'viewed_at' => $view->created_at?->toISOString(),
            'user' => $viewer ? [
                'id' => $viewer->id,
                'name' => $viewer->name,
                'email' => $viewer->email,
                'headline' => $jobSeeker?->headline,
                'location' => $jobSeeker?->location,
                'company' => $jobSeeker?->company,
                'profile_image_url' => $jobSeeker?->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
            ] : null,
        ];
    }

    private function searchAppearancePayload(SearchAppearance $appearance, Request $request): array
    {
        $searcher = $appearance->searcherUser;
        $jobSeeker = $searcher?->jobSeeker;
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $appearance->id,
            'query' => $appearance->query,
            'appeared_on' => $appearance->appeared_on?->format('Y-m-d'),
            'appeared_at' => $appearance->created_at?->toISOString(),
            'user' => $searcher ? [
                'id' => $searcher->id,
                'name' => $searcher->name,
                'headline' => $jobSeeker?->headline,
                'location' => $jobSeeker?->location,
                'company' => $jobSeeker?->company,
                'profile_image_url' => $jobSeeker?->profile_image ? $storageUrl . $jobSeeker->profile_image : null,
            ] : null,
        ];
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
