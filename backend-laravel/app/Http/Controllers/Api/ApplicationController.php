<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPosting;
use App\Mail\ShortlistMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ApplicationController extends Controller
{
    /**
     * Job seeker applies to a job
     */
    public function apply(Request $request, $jobId)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can apply'], 403);
        }

        $job = JobPosting::findOrFail($jobId);

        // Prevent duplicate applications
        $existing = Application::where('job_seeker_id', $user->jobSeeker->id)
            ->where('job_id', $job->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already applied to this job'], 409);
        }

        $application = Application::create([
            'job_seeker_id' => $user->jobSeeker->id,
            'job_id' => $job->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Application submitted successfully',
            'application' => $application,
        ], 201);
    }

    /**
     * Job seeker views their own applications
     */
    public function myApplications(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can access this'], 403);
        }

        $applications = Application::with('jobPosting.company')
            ->where('job_seeker_id', $user->jobSeeker->id)
            ->latest()
            ->get();

        return response()->json($applications);
    }

    /**
     * Company views applicants for a specific job
     */
    public function jobApplicants(Request $request, $jobId)
    {
        $user = $request->user();
        $job = JobPosting::findOrFail($jobId);

        if ($user->role !== 'company' || $job->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $applications = Application::with('jobSeeker.user')
            ->where('job_id', $job->id)
            ->orderByDesc('final_score')
            ->get();

        return response()->json($applications);
    }

    /**
     * Company shortlists a candidate
     */
    public function shortlist(Request $request, $applicationId)
    {
        $user = $request->user();
        $application = Application::with('jobSeeker.user', 'jobPosting.company')->findOrFail($applicationId);

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $application->status = 'shortlisted';
        $application->save();

        // Send shortlist email
        Mail::to($application->jobSeeker->user->email)->send(new ShortlistMail($application));

        return response()->json([
            'message' => 'Candidate shortlisted and notified successfully',
            'application' => $application,
        ]);
    }

    /**
     * Company rejects a candidate
     */
    public function reject(Request $request, $applicationId)
    {
        $user = $request->user();
        $application = Application::with('jobPosting')->findOrFail($applicationId);

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $application->status = 'rejected';
        $application->save();

        return response()->json([
            'message' => 'Candidate rejected',
            'application' => $application,
        ]);
    }
}