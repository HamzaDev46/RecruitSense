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

        $averageScore = (clone $applicationsQuery)
            ->whereNotNull('final_score')
            ->where('final_score', '>', 0)
            ->avg('final_score');

        return response()->json([
            'company' => $company,
            'stats' => [
                'total_jobs' => JobPosting::where('company_id', $company->id)->count(),
                'active_jobs' => JobPosting::where('company_id', $company->id)->where('status', JobPosting::STATUS_ACTIVE)->count(),
                'draft_jobs' => JobPosting::where('company_id', $company->id)->where('status', JobPosting::STATUS_DRAFT)->count(),
                'closed_jobs' => JobPosting::where('company_id', $company->id)->where('status', JobPosting::STATUS_CLOSED)->count(),
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
        ]);
    }
}
