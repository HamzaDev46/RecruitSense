<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\SkillGap;
use App\Mail\ShortlistMail;
use App\Services\FlaskAIService;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ApplicationController extends Controller
{
    protected FlaskAIService $flaskService;

    public function __construct(FlaskAIService $flaskService)
    {
        $this->flaskService = $flaskService;
    }

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
            ->whereIn('status', ['pending', 'shortlisted', 'rejected'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already applied to this job'], 409);
        }

        // Check if job seeker has uploaded resume
        $resume = Resume::where('job_seeker_id', $user->jobSeeker->id)->first();

        if (!$resume) {
            return response()->json(['message' => 'Please upload your resume before applying'], 422);
        }

        // Create application
        $application = Application::create([
            'job_seeker_id' => $user->jobSeeker->id,
            'job_id' => $job->id,
            'status' => 'pending',
        ]);

        // Call Flask AI Service
        $aiResult = $this->flaskService->analyzeResume(
            $resume->file_path,
            $job->description,
            $job->required_skills
        );

        // Save AI results if successful
        if (!isset($aiResult['error'])) {
            $similarityScore = $aiResult['similarity_score'] ?? 0;
            $skillGapScore = $aiResult['skill_gap_score'] ?? 0;

            // Calculate final score: 50% similarity + 30% skill gap + 20% soft skill
            // Soft skill = 0 initially (quiz baad mein hota hai)
            $finalScore = round(
                ($similarityScore * 0.50) + ($skillGapScore * 0.30) + (0 * 0.20),
                2
            );

            $application->update([
                'similarity_score' => $similarityScore,
                'skill_gap_score'  => $skillGapScore,
                'final_score'      => $finalScore,
            ]);

            // Save missing skills (skill gaps)
            if (!empty($aiResult['missing_skills'])) {
                foreach ($aiResult['missing_skills'] as $missingSkill) {
                    SkillGap::create([
                        'application_id' => $application->id,
                        'missing_skill'  => $missingSkill,
                        'recommendation' => 'Consider learning ' . $missingSkill . ' to improve your chances.',
                    ]);
                }
            }

            return response()->json([
                'message'     => 'Application submitted successfully',
                'application' => $application,
                'ai_analysis' => [
                    'similarity_score' => $similarityScore,
                    'skill_gap_score'  => $skillGapScore,
                    'final_score'      => $finalScore,
                    'matched_skills'   => $aiResult['matched_skills'] ?? [],
                    'missing_skills'   => $aiResult['missing_skills'] ?? [],
                    'bonus_skills'     => $aiResult['bonus_skills'] ?? [],
                ],
            ], 201);
        }

        // If AI fails, still save application (without scores)
        return response()->json([
            'message'     => 'Application submitted successfully (AI analysis pending)',
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

        $applications = Application::with(['jobPosting.company', 'skillGaps'])
            ->withCount('quizResponses')
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
            ->where('status', '!=', 'withdrawn')
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

        if ($application->status === 'withdrawn') {
            return response()->json(['message' => 'This application has been withdrawn'], 422);
        }

        $previousStatus = $application->status;
        $application->status = 'shortlisted';
        $application->save();

        Mail::to($application->jobSeeker->user->email)->send(new ShortlistMail($application));

        if ($previousStatus !== 'shortlisted') {
            $this->createNotification(
                $application->jobSeeker->user->id,
                $user->id,
                'application_shortlisted',
                'Application shortlisted',
                'Your application for ' . $application->jobPosting->title . ' has been shortlisted.',
                ['link' => '/my-applications', 'application_id' => $application->id]
            );
        }

        return response()->json([
            'message'     => 'Candidate shortlisted and notified successfully',
            'application' => $application,
        ]);
    }

    /**
     * Company rejects a candidate
     */
    public function reject(Request $request, $applicationId)
    {
        $user = $request->user();
        $application = Application::with('jobPosting', 'jobSeeker.user')->findOrFail($applicationId);

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($application->status === 'withdrawn') {
            return response()->json(['message' => 'This application has been withdrawn'], 422);
        }

        $previousStatus = $application->status;
        $application->status = 'rejected';
        $application->save();

        if ($previousStatus !== 'rejected') {
            $this->createNotification(
                $application->jobSeeker->user->id,
                $user->id,
                'application_rejected',
                'Application update',
                'Your application for ' . $application->jobPosting->title . ' was not selected.',
                ['link' => '/my-applications', 'application_id' => $application->id]
            );
        }

        return response()->json([
            'message'     => 'Candidate rejected',
            'application' => $application,
        ]);
    }

    /**
     * Job seeker withdraws a pending application
     */
    public function withdraw(Request $request, Application $application)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker' || !$user->jobSeeker || $application->job_seeker_id !== $user->jobSeeker->id) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Only pending applications can be withdrawn'], 422);
        }

        $application->status = 'withdrawn';
        $application->save();
        $application->load('jobPosting.company', 'skillGaps')->loadCount('quizResponses');

        return response()->json([
            'message' => 'Application withdrawn successfully',
            'application' => $application,
        ]);
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
