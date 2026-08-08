<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\Connection;
use App\Models\JobPosting;
use App\Models\PostImpression;
use App\Models\ProfileView;
use App\Models\SavedJob;
use App\Models\SearchAppearance;
use App\Models\UserBlock;
use App\Support\ProfileCompletion;
use Illuminate\Http\Request;

class JobSeekerDashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user()->load('jobSeeker.experiences', 'jobSeeker.resume');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can access this dashboard'], 403);
        }

        $jobSeeker = $user->jobSeeker;
        $statusCounts = Application::where('job_seeker_id', $jobSeeker->id)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentJobs = JobPosting::with('company')
            ->where('status', JobPosting::STATUS_ACTIVE)
            ->latest()
            ->limit(5)
            ->get();

        $recentApplications = Application::with('jobPosting.company')
            ->where('job_seeker_id', $jobSeeker->id)
            ->latest()
            ->limit(4)
            ->get();

        $averageScore = Application::where('job_seeker_id', $jobSeeker->id)
            ->where('final_score', '>', 0)
            ->avg('final_score');

        return response()->json([
            'stats' => [
                'totalJobs' => JobPosting::where('status', JobPosting::STATUS_ACTIVE)->count(),
                'myApplications' => Application::where('job_seeker_id', $jobSeeker->id)->count(),
                'savedJobs' => SavedJob::where('job_seeker_id', $jobSeeker->id)->count(),
                'shortlisted' => (int) ($statusCounts['shortlisted'] ?? 0),
                'inProgress' => (int) (($statusCounts['screening'] ?? 0) + ($statusCounts['shortlisted'] ?? 0) + ($statusCounts['interview'] ?? 0) + ($statusCounts['offered'] ?? 0) + ($statusCounts['hired'] ?? 0)),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'profileViews' => ProfileView::where('profile_user_id', $user->id)
                    ->whereHas('viewerUser')
                    ->count(),
                'postImpressions' => PostImpression::whereHas('post', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })->count(),
                'searchAppearances' => SearchAppearance::where('profile_user_id', $user->id)
                    ->whereHas('searcherUser')
                    ->count(),
                'connections' => $this->connectionsCount($user->id),
                'pendingInvitations' => Connection::where('receiver_id', $user->id)
                    ->where('status', 'pending')
                    ->count(),
                'unreadNotifications' => AppNotification::where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count(),
                'averageScore' => $averageScore ? round($averageScore) : 0,
            ],
            'profile_strength' => ProfileCompletion::forJobSeeker($jobSeeker),
            'recent_jobs' => $recentJobs,
            'recent_applications' => $recentApplications,
        ]);
    }

    private function connectionsCount(int $userId): int
    {
        $blockedIds = UserBlock::blockedUserIdsFor($userId);

        return Connection::where('status', 'accepted')
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->when($blockedIds, function ($query) use ($userId, $blockedIds) {
                $query->where(function ($scope) use ($userId, $blockedIds) {
                    $scope->where(function ($inner) use ($userId, $blockedIds) {
                        $inner->where('requester_id', $userId)
                            ->whereNotIn('receiver_id', $blockedIds);
                    })->orWhere(function ($inner) use ($userId, $blockedIds) {
                        $inner->where('receiver_id', $userId)
                            ->whereNotIn('requester_id', $blockedIds);
                    });
                });
            })
            ->count();
    }

}
