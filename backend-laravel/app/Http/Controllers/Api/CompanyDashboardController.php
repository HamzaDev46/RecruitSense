<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPosting;
use App\Models\QuizQuestion;
use Illuminate\Http\Request;

class CompanyDashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can access this dashboard'], 403);
        }

        $company = $user->company;

        if (!$company) {
            return response()->json(['message' => 'Company profile not found'], 404);
        }

        $applicationsQuery = Application::whereHas('jobPosting', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        });

        $statusCounts = (clone $applicationsQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $activeApplicationsQuery = (clone $applicationsQuery)->where('status', '!=', 'withdrawn');
        $totalApplicants = (clone $activeApplicationsQuery)->count();
        $reviewedApplicants = (clone $activeApplicationsQuery)
            ->where('status', '!=', Application::STATUS_PENDING)
            ->count();

        $recentApplicants = (clone $activeApplicationsQuery)
            ->with(['jobPosting', 'jobSeeker.user', 'skillGaps'])
            ->withCount('quizResponses')
            ->latest()
            ->limit(6)
            ->get();

        $upcomingInterviewsQuery = (clone $activeApplicationsQuery)
            ->with(['jobPosting', 'jobSeeker.user'])
            ->whereNotNull('interview_scheduled_at')
            ->where('interview_scheduled_at', '>=', now());

        $upcomingInterviewsCount = (clone $upcomingInterviewsQuery)->count();

        $upcomingInterviews = $upcomingInterviewsQuery
            ->orderBy('interview_scheduled_at')
            ->limit(5)
            ->get();

        $recentJobs = JobPosting::where('company_id', $company->id)
            ->withCount([
                'applications as applications_count' => fn ($query) => $query->where('status', '!=', 'withdrawn'),
                'applications as pending_applications_count' => fn ($query) => $query->where('status', 'pending'),
                'applications as screening_applications_count' => fn ($query) => $query->where('status', 'screening'),
                'applications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'applications as interview_applications_count' => fn ($query) => $query->where('status', 'interview'),
                'applications as offered_applications_count' => fn ($query) => $query->where('status', 'offered'),
                'applications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
                'applications as rejected_applications_count' => fn ($query) => $query->where('status', 'rejected'),
            ])
            ->latest()
            ->limit(5)
            ->get();
        $recentActivity = $this->buildRecentActivity($applicationsQuery, $company, 5);

        $averageScore = (clone $applicationsQuery)
            ->whereNotNull('final_score')
            ->where('final_score', '>', 0)
            ->avg('final_score');
        $companyJobsQuery = JobPosting::where('company_id', $company->id);

        return response()->json([
            'company' => $company,
            'stats' => [
                'total_jobs' => (clone $companyJobsQuery)->count(),
                'active_jobs' => (clone $companyJobsQuery)->where('status', JobPosting::STATUS_ACTIVE)->count(),
                'accepting_jobs' => (clone $companyJobsQuery)->acceptingApplications()->count(),
                'draft_jobs' => (clone $companyJobsQuery)->where('status', JobPosting::STATUS_DRAFT)->count(),
                'closed_jobs' => (clone $companyJobsQuery)->where('status', JobPosting::STATUS_CLOSED)->count(),
                'expired_jobs' => (clone $companyJobsQuery)
                    ->where('status', JobPosting::STATUS_ACTIVE)
                    ->whereNotNull('application_deadline')
                    ->whereDate('application_deadline', '<', today())
                    ->count(),
                'closing_soon_jobs' => (clone $companyJobsQuery)
                    ->where('status', JobPosting::STATUS_ACTIVE)
                    ->whereNotNull('application_deadline')
                    ->whereDate('application_deadline', '>=', today())
                    ->whereDate('application_deadline', '<=', today()->addDays(7))
                    ->count(),
                'total_applicants' => $totalApplicants,
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'screening' => (int) ($statusCounts['screening'] ?? 0),
                'shortlisted' => (int) ($statusCounts['shortlisted'] ?? 0),
                'interview' => (int) ($statusCounts['interview'] ?? 0),
                'offered' => (int) ($statusCounts['offered'] ?? 0),
                'hired' => (int) ($statusCounts['hired'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'withdrawn' => (int) ($statusCounts['withdrawn'] ?? 0),
                'average_score' => round((float) ($averageScore ?? 0), 2),
                'quiz_questions' => QuizQuestion::where('company_id', $company->id)->count(),
                'today_applicants' => (clone $activeApplicationsQuery)->whereDate('created_at', today())->count(),
                'high_match_applicants' => (clone $activeApplicationsQuery)->where('final_score', '>=', 70)->count(),
                'scheduled_interviews' => (clone $activeApplicationsQuery)->whereNotNull('interview_scheduled_at')->count(),
                'upcoming_interviews' => $upcomingInterviewsCount,
                'completed_interviews' => (clone $activeApplicationsQuery)->where('interview_status', 'completed')->count(),
                'review_rate' => $totalApplicants > 0 ? round(($reviewedApplicants / $totalApplicants) * 100) : 0,
            ],
            'recent_jobs' => $recentJobs,
            'recent_applicants' => $recentApplicants,
            'upcoming_interviews' => $upcomingInterviews,
            'recent_activity' => $recentActivity,
        ]);
    }

    public function activityLog(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can access this activity log'], 403);
        }

        $company = $user->company;

        if (!$company) {
            return response()->json(['message' => 'Company profile not found'], 404);
        }

        $limit = max(10, min((int) $request->integer('limit', 60), 100));
        $applicationsQuery = Application::whereHas('jobPosting', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        });
        $activity = $this->buildRecentActivity($applicationsQuery, $company, $limit);

        return response()->json([
            'activity' => $activity,
            'summary' => [
                'total' => count($activity),
                'applicants' => collect($activity)->where('type', 'applicant')->count(),
                'interviews' => collect($activity)->where('type', 'interview')->count(),
                'offers' => collect($activity)->where('status', Application::STATUS_OFFERED)->count(),
                'hired' => collect($activity)->where('status', Application::STATUS_HIRED)->count(),
                'jobs' => collect($activity)->where('type', 'job')->count(),
            ],
        ]);
    }

    private function buildRecentActivity($applicationsQuery, $company, int $limit = 10): array
    {
        $activity = collect();
        $sourceLimit = max($limit, 10);

        (clone $applicationsQuery)
            ->with(['jobPosting', 'jobSeeker.user'])
            ->latest('created_at')
            ->limit($sourceLimit)
            ->get()
            ->each(function (Application $application) use ($activity) {
                $candidateName = $application->jobSeeker?->user?->name ?: 'Candidate';
                $jobTitle = $application->jobPosting?->title ?: 'a job';

                $activity->push($this->activityItem(
                    'application-' . $application->id . '-applied',
                    'applicant',
                    'New applicant',
                    $candidateName . ' applied for ' . $jobTitle . '.',
                    $application->created_at,
                    '/company/jobs/' . $application->job_id . '/applicants?application=' . $application->id,
                    $candidateName,
                    $jobTitle,
                    'pending'
                ));
            });

        (clone $applicationsQuery)
            ->with(['jobPosting', 'jobSeeker.user'])
            ->whereNotIn('status', [Application::STATUS_PENDING, Application::STATUS_WITHDRAWN])
            ->latest('updated_at')
            ->limit($sourceLimit)
            ->get()
            ->each(function (Application $application) use ($activity) {
                $candidateName = $application->jobSeeker?->user?->name ?: 'Candidate';
                $jobTitle = $application->jobPosting?->title ?: 'a job';
                $status = $application->status;
                $timestamp = match ($status) {
                    Application::STATUS_OFFERED => $application->offer_sent_at ?: $application->updated_at,
                    Application::STATUS_HIRED => $application->hired_at ?: $application->updated_at,
                    default => $application->updated_at,
                };

                $activity->push($this->activityItem(
                    'application-' . $application->id . '-status-' . $status,
                    'status',
                    $this->activityTitle($status),
                    $candidateName . ' moved to ' . $this->statusLabel($status) . ' for ' . $jobTitle . '.',
                    $timestamp,
                    '/company/jobs/' . $application->job_id . '/applicants?application=' . $application->id,
                    $candidateName,
                    $jobTitle,
                    $status
                ));

                if ($application->interview_scheduled_at) {
                    $activity->push($this->activityItem(
                        'application-' . $application->id . '-interview',
                        'interview',
                        'Interview scheduled',
                        $candidateName . ' has an interview for ' . $jobTitle . ' on ' . $application->interview_scheduled_at->format('M j, Y h:i A') . '.',
                        $application->updated_at,
                        '/company/interviews?application=' . $application->id,
                        $candidateName,
                        $jobTitle,
                        'interview'
                    ));
                }
            });

        JobPosting::where('company_id', $company->id)
            ->latest('created_at')
            ->limit($sourceLimit)
            ->get()
            ->each(function (JobPosting $job) use ($activity) {
                $activity->push($this->activityItem(
                    'job-' . $job->id . '-created',
                    'job',
                    $job->status === JobPosting::STATUS_DRAFT ? 'Job draft saved' : 'Job posted',
                    $job->title . ' was added to your company panel.',
                    $job->created_at,
                    '/company/jobs/' . $job->id . '/applicants',
                    null,
                    $job->title,
                    $job->status
                ));
            });

        return $activity
            ->filter(fn ($item) => $item['timestamp'] !== null)
            ->sortByDesc('sort_time')
            ->take($limit)
            ->map(fn ($item) => collect($item)->except('sort_time')->all())
            ->values()
            ->all();
    }

    private function activityItem(
        string $id,
        string $type,
        string $title,
        string $description,
        $timestamp,
        string $path,
        ?string $candidateName = null,
        ?string $jobTitle = null,
        ?string $status = null
    ): array {
        return [
            'id' => $id,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'timestamp' => $timestamp?->toISOString(),
            'sort_time' => $timestamp?->getTimestamp() ?? 0,
            'path' => $path,
            'candidate_name' => $candidateName,
            'job_title' => $jobTitle,
            'status' => $status,
        ];
    }

    private function activityTitle(?string $status): string
    {
        return match ($status) {
            Application::STATUS_SCREENING => 'Screening started',
            Application::STATUS_SHORTLISTED => 'Candidate shortlisted',
            Application::STATUS_INTERVIEW => 'Interview stage',
            Application::STATUS_OFFERED => 'Offer sent',
            Application::STATUS_HIRED => 'Candidate hired',
            Application::STATUS_REJECTED => 'Candidate rejected',
            default => 'Application updated',
        };
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            Application::STATUS_SCREENING => 'Screening',
            Application::STATUS_SHORTLISTED => 'Shortlisted',
            Application::STATUS_INTERVIEW => 'Interview',
            Application::STATUS_OFFERED => 'Offered',
            Application::STATUS_HIRED => 'Hired',
            Application::STATUS_REJECTED => 'Rejected',
            Application::STATUS_WITHDRAWN => 'Withdrawn',
            default => 'Pending',
        };
    }
}
