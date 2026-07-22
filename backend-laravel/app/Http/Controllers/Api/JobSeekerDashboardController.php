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
                'searchAppearances' => SearchAppearance::where('profile_user_id', $user->id)->count(),
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
            [
                'id' => 'headline',
                'complete' => (bool) $jobSeeker->headline,
                'task' => 'Add headline',
                'description' => 'Tell companies what role you are targeting.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'location',
                'complete' => (bool) $jobSeeker->location,
                'task' => 'Add location',
                'description' => 'Help recruiters understand where you are based.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'phone',
                'complete' => (bool) $jobSeeker->phone,
                'task' => 'Add phone number',
                'description' => 'Keep contact information ready for companies.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'company',
                'complete' => (bool) $jobSeeker->company,
                'task' => 'Add company',
                'description' => 'Show your current workplace or professional status.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'education',
                'complete' => (bool) $jobSeeker->education,
                'task' => 'Add education',
                'description' => 'Add your degree, institute, or relevant education.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'about',
                'complete' => (bool) $jobSeeker->about,
                'task' => 'Add about section',
                'description' => 'Write a short summary recruiters can scan quickly.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'skills',
                'complete' => (bool) $jobSeeker->skills,
                'task' => 'Add skills',
                'description' => 'Skills improve recommendations and match scores.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'profile_image',
                'complete' => (bool) $jobSeeker->profile_image,
                'task' => 'Upload profile photo',
                'description' => 'Make your profile recognizable across the network.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'cover_image',
                'complete' => (bool) $jobSeeker->cover_image,
                'task' => 'Upload cover photo',
                'description' => 'Give your profile a professional first impression.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'experience',
                'complete' => $jobSeeker->experiences->isNotEmpty(),
                'task' => 'Add experience',
                'description' => 'Add work, internship, freelance, or project experience.',
                'action_path' => '/profile?setup=experience',
            ],
            [
                'id' => 'resume',
                'complete' => (bool) $jobSeeker->resume,
                'task' => 'Upload resume',
                'description' => 'Resume powers AI job matching and application scoring.',
                'action_path' => '/resume',
            ],
        ];

        $completed = collect($checks)->where('complete', true)->count();
        $tasks = collect($checks)->values();
        $missingTasks = $tasks->where('complete', false)->values();

        return [
            'completion' => (int) round(($completed / count($checks)) * 100),
            'completed_tasks' => $completed,
            'total_tasks' => count($checks),
            'tasks' => $tasks->all(),
            'next_task' => $missingTasks->first(),
            'missing_tasks' => $missingTasks
                ->pluck('task')
                ->values()
                ->all(),
        ];
    }
}
