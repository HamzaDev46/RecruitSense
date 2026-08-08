<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Services\JobAlertMatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobPostingController extends Controller
{
    /**
     * List all job postings (public — job seekers browse)
     */
    public function index()
    {
        $jobs = JobPosting::with('company')
            ->where('status', JobPosting::STATUS_ACTIVE)
            ->latest()
            ->get();

        return response()->json($jobs);
    }

    /**
     * Show single job posting
     */
    public function show($id)
    {
        $job = JobPosting::with('company')->findOrFail($id);
        return response()->json($job);
    }

    /**
     * Store a new job posting (company only)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can post jobs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'required_skills' => 'required|string',
            'status' => 'nullable|in:' . implode(',', JobPosting::STATUSES),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = JobPosting::create([
            'company_id' => $user->company->id,
            'title' => $request->title,
            'description' => $request->description,
            'required_skills' => $request->required_skills,
            'status' => $request->status ?: JobPosting::STATUS_ACTIVE,
        ]);
        $alertNotifications = $job->status === JobPosting::STATUS_ACTIVE
            ? app(JobAlertMatcher::class)->notifyMatchingAlerts($job->fresh('company.user'))
            : 0;

        return response()->json([
            'message' => 'Job posted successfully',
            'job' => $this->withApplicationCounts($job),
            'job_alert_notifications' => $alertNotifications,
        ], 201);
    }

    /**
     * Update a job posting (only owning company)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $job = JobPosting::findOrFail($id);

        if ($user->role !== 'company' || $job->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'required_skills' => 'sometimes|string',
            'status' => 'sometimes|in:' . implode(',', JobPosting::STATUSES),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $previousStatus = $job->status;
        $job->update($request->only(['title', 'description', 'required_skills', 'status']));
        $alertNotifications = $previousStatus !== JobPosting::STATUS_ACTIVE && $job->status === JobPosting::STATUS_ACTIVE
            ? app(JobAlertMatcher::class)->notifyMatchingAlerts($job->fresh('company.user'))
            : 0;

        return response()->json([
            'message' => 'Job updated successfully',
            'job' => $this->withApplicationCounts($job),
            'job_alert_notifications' => $alertNotifications,
        ]);
    }

    /**
     * Delete a job posting (only owning company)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $job = JobPosting::findOrFail($id);

        if ($user->role !== 'company' || $job->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $job->delete();

        return response()->json(['message' => 'Job deleted successfully']);
    }

    /**
     * List jobs posted by logged-in company
     */
    public function myJobs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can access this'], 403);
        }

        $jobs = JobPosting::where('company_id', $user->company->id)
            ->withCount([
                'applications as applications_count' => fn ($query) => $query->where('status', '!=', 'withdrawn'),
                'applications as pending_applications_count' => fn ($query) => $query->where('status', 'pending'),
                'applications as screening_applications_count' => fn ($query) => $query->where('status', 'screening'),
                'applications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'applications as interview_applications_count' => fn ($query) => $query->where('status', 'interview'),
                'applications as offered_applications_count' => fn ($query) => $query->where('status', 'offered'),
                'applications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
                'applications as rejected_applications_count' => fn ($query) => $query->where('status', 'rejected'),
                'applications as withdrawn_applications_count' => fn ($query) => $query->where('status', 'withdrawn'),
                'applications as scheduled_interviews_count' => fn ($query) => $query->whereNotNull('interview_scheduled_at'),
            ])
            ->latest()
            ->get();

        return response()->json($jobs);
    }

    private function withApplicationCounts(JobPosting $job): JobPosting
    {
        return $job->loadCount([
            'applications as applications_count' => fn ($query) => $query->where('status', '!=', 'withdrawn'),
            'applications as pending_applications_count' => fn ($query) => $query->where('status', 'pending'),
            'applications as screening_applications_count' => fn ($query) => $query->where('status', 'screening'),
            'applications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
            'applications as interview_applications_count' => fn ($query) => $query->where('status', 'interview'),
            'applications as offered_applications_count' => fn ($query) => $query->where('status', 'offered'),
            'applications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
            'applications as rejected_applications_count' => fn ($query) => $query->where('status', 'rejected'),
            'applications as withdrawn_applications_count' => fn ($query) => $query->where('status', 'withdrawn'),
            'applications as scheduled_interviews_count' => fn ($query) => $query->whereNotNull('interview_scheduled_at'),
        ]);
    }
}
