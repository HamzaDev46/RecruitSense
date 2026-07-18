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
                'totalJobs' => JobPosting::count(),
                'myApplications' => Application::where('job_seeker_id', $jobSeeker->id)->count(),
                'savedJobs' => SavedJob::where('job_seeker_id', $jobSeeker->id)->count(),
                'shortlisted' => (int) ($statusCounts['shortlisted'] ?? 0),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'profileViews' => ProfileView::where('profile_user_id', $user->id)->count(),
                'postImpressions' => PostImpression::whereHas('post', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })->count(),
                'searchAppearances' => 0,
                'connections' => $this->connectionsCount($user->id),
                'pendingInvitations' => Connection::where('receiver_id', $user->id)
                    ->where('status', 'pending')
                    ->count(),
                'unreadNotifications' => AppNotification::where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count(),
                'averageScore' => $averageScore ? round($averageScore) : 0,
            ],
            'profile_strength' => $this->profileStrength($jobSeeker),
            'recent_jobs' => $recentJobs,
            'recent_applications' => $recentApplications,
        ]);
    }

    private function connectionsCount(int $userId): int
    {
        return Connection::where('status', 'accepted')
            ->where(function ($query) use ($userId) {
                $query->where('requester_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->count();
    }

    private function profileStrength($jobSeeker): array
    {
        $checks = [
            ['complete' => (bool) $jobSeeker->headline, 'task' => 'Add headline'],
            ['complete' => (bool) $jobSeeker->location, 'task' => 'Add location'],
            ['complete' => (bool) $jobSeeker->phone, 'task' => 'Add phone number'],
            ['complete' => (bool) $jobSeeker->company, 'task' => 'Add company'],
            ['complete' => (bool) $jobSeeker->education, 'task' => 'Add education'],
            ['complete' => (bool) $jobSeeker->about, 'task' => 'Add about section'],
            ['complete' => (bool) $jobSeeker->skills, 'task' => 'Add skills'],
            ['complete' => (bool) $jobSeeker->profile_image, 'task' => 'Upload profile photo'],
            ['complete' => (bool) $jobSeeker->cover_image, 'task' => 'Upload cover photo'],
            ['complete' => $jobSeeker->experiences->isNotEmpty(), 'task' => 'Add experience'],
            ['complete' => (bool) $jobSeeker->resume, 'task' => 'Upload resume'],
        ];

        $completed = collect($checks)->where('complete', true)->count();

        return [
            'completion' => (int) round(($completed / count($checks)) * 100),
            'missing_tasks' => collect($checks)
                ->where('complete', false)
                ->pluck('task')
                ->values()
                ->all(),
        ];
    }
}
