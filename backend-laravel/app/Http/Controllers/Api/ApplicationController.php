<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\JobPosting;
use App\Models\Resume;
use App\Models\SkillGap;
use App\Mail\InterviewScheduledMail;
use App\Mail\RejectionMail;
use App\Mail\ShortlistMail;
use App\Services\FlaskAIService;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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

        $validated = $request->validate([
            'cover_letter' => ['nullable', 'string', 'max:3000'],
        ]);

        $job = JobPosting::with('company.user')->findOrFail($jobId);

        if (!$job->is_accepting_applications) {
            return response()->json(['message' => 'This job is not accepting applications right now'], 422);
        }

        // Prevent duplicate applications
        $existing = Application::where('job_seeker_id', $user->jobSeeker->id)
            ->where('job_id', $job->id)
            ->whereIn('status', Application::ACTIVE_STATUSES)
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
            'status' => Application::STATUS_PENDING,
            'cover_letter' => trim($validated['cover_letter'] ?? '') ?: null,
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

            $this->createNotification(
                $job->company?->user_id,
                $user->id,
                'candidate_applied',
                'New applicant',
                $user->name . ' applied for ' . $job->title . '.',
                [
                    'link' => '/company/applicants?application=' . $application->id,
                    'application_id' => $application->id,
                    'job_id' => $job->id,
                ]
            );

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
        $this->createNotification(
            $job->company?->user_id,
            $user->id,
            'candidate_applied',
            'New applicant',
            $user->name . ' applied for ' . $job->title . '.',
            [
                'link' => '/company/applicants?application=' . $application->id,
                'application_id' => $application->id,
                'job_id' => $job->id,
            ]
        );

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

        $applications = Application::with($this->companyApplicantRelations())
            ->withCount('quizResponses')
            ->where('job_id', $job->id)
            ->orderByDesc('final_score')
            ->get();

        return response()->json($applications);
    }

    /**
     * Company views applicants across all its jobs
     */
    public function companyApplicants(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company' || !$user->company) {
            return response()->json(['message' => 'Only companies can access applicants'], 403);
        }

        $applications = Application::with($this->companyApplicantRelations())
            ->withCount('quizResponses')
            ->whereHas('jobPosting', function ($query) use ($user) {
                $query->where('company_id', $user->company->id);
            })
            ->orderByDesc('created_at')
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

        if ($application->status === Application::STATUS_WITHDRAWN) {
            return response()->json(['message' => 'This application has been withdrawn'], 422);
        }

        $previousStatus = $application->status;
        $application->status = Application::STATUS_SHORTLISTED;
        $application->save();

        Mail::to($application->jobSeeker->user->email)->send(new ShortlistMail($application));

        if ($previousStatus !== Application::STATUS_SHORTLISTED) {
            $this->createNotification(
                $application->jobSeeker->user->id,
                $user->id,
                'application_shortlisted',
                'Application shortlisted',
                'Your application for ' . $application->jobPosting->title . ' has been shortlisted.',
                ['link' => '/my-applications?application=' . $application->id, 'application_id' => $application->id]
            );
        }

        $application->load($this->companyApplicantRelations())->loadCount('quizResponses');

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
        $application = Application::with('jobPosting.company', 'jobSeeker.user')->findOrFail($applicationId);

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($application->status === Application::STATUS_WITHDRAWN) {
            return response()->json(['message' => 'This application has been withdrawn'], 422);
        }

        $previousStatus = $application->status;
        $application->status = Application::STATUS_REJECTED;
        $application->save();

        if ($previousStatus !== Application::STATUS_REJECTED) {
            Mail::to($application->jobSeeker->user->email)->send(new RejectionMail($application));

            $this->createNotification(
                $application->jobSeeker->user->id,
                $user->id,
                'application_rejected',
                'Application update',
                'Your application for ' . $application->jobPosting->title . ' was not selected.',
                ['link' => '/my-applications?application=' . $application->id, 'application_id' => $application->id]
            );
        }

        $application->load($this->companyApplicantRelations())->loadCount('quizResponses');

        return response()->json([
            'message'     => 'Candidate rejected',
            'application' => $application,
        ]);
    }

    /**
     * Company schedules or updates an interview for a candidate.
     */
    public function scheduleInterview(Request $request, Application $application)
    {
        $user = $request->user();
        $application->load('jobPosting.company', 'jobSeeker.user');

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (in_array($application->status, [Application::STATUS_WITHDRAWN, Application::STATUS_REJECTED, Application::STATUS_HIRED], true)) {
            return response()->json(['message' => 'Interviews can only be scheduled for active candidates'], 422);
        }

        $validated = $request->validate([
            'interview_scheduled_at' => ['required', 'date', 'after:now'],
            'interview_mode' => ['required', 'in:online,phone,onsite'],
            'interview_location' => ['nullable', 'string', 'max:2000'],
            'interview_notes' => ['nullable', 'string', 'max:2000'],
            'interview_status' => ['nullable', Rule::in(['scheduled', 'rescheduled', 'cancelled'])],
        ]);

        $previousSchedule = $application->interview_scheduled_at;

        $application->fill([
            'interview_scheduled_at' => $validated['interview_scheduled_at'],
            'interview_mode' => $validated['interview_mode'],
            'interview_location' => trim($validated['interview_location'] ?? '') ?: null,
            'interview_notes' => trim($validated['interview_notes'] ?? '') ?: null,
            'interview_status' => $validated['interview_status'] ?? ($previousSchedule ? 'rescheduled' : 'scheduled'),
        ]);

        if (in_array($application->status, [
            Application::STATUS_PENDING,
            Application::STATUS_SCREENING,
            Application::STATUS_SHORTLISTED,
        ], true)) {
            $application->status = Application::STATUS_INTERVIEW;
        }

        $application->save();

        $scheduledAt = $application->interview_scheduled_at
            ?->copy()
            ->timezone(config('app.timezone', 'Asia/Karachi'))
            ->format('M d, Y h:i A');
        $type = $previousSchedule ? 'interview_rescheduled' : 'interview_scheduled';

        Mail::to($application->jobSeeker->user->email)->send(new InterviewScheduledMail($application, (bool) $previousSchedule));

        $this->createNotification(
            $application->jobSeeker->user->id,
            $user->id,
            $type,
            $previousSchedule ? 'Interview rescheduled' : 'Interview scheduled',
            'Your interview for ' . $application->jobPosting->title . ' is scheduled for ' . $scheduledAt . '.',
            [
                'link' => '/my-applications?application=' . $application->id,
                'application_id' => $application->id,
                'job_id' => $application->job_id,
                'interview_scheduled_at' => $application->interview_scheduled_at?->toISOString(),
            ]
        );

        $application->load($this->companyApplicantRelations())->loadCount('quizResponses');

        return response()->json([
            'message' => $previousSchedule ? 'Interview rescheduled successfully' : 'Interview scheduled successfully',
            'application' => $application,
        ]);
    }

    /**
     * Company moves a candidate through the hiring pipeline.
     */
    public function updateStatus(Request $request, Application $application)
    {
        $user = $request->user();
        $application->load('jobPosting.company', 'jobSeeker.user');

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($application->status === Application::STATUS_WITHDRAWN) {
            return response()->json(['message' => 'Withdrawn applications cannot be moved back into the pipeline'], 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(Application::COMPANY_PIPELINE_STATUSES)],
        ]);

        $previousStatus = $application->status;
        $application->status = $validated['status'];
        $application->save();

        if ($previousStatus !== $application->status) {
            $this->notifyCandidateOfStatusChange($application, $user->id, $previousStatus);
        }

        $application->load($this->companyApplicantRelations())->loadCount('quizResponses');

        return response()->json([
            'message' => 'Candidate stage updated',
            'application' => $application,
        ]);
    }

    /**
     * Company saves private recruiter notes and rating.
     */
    public function saveCompanyReview(Request $request, Application $application)
    {
        $user = $request->user();
        $application->load('jobPosting.company', 'jobSeeker.user');

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'company_notes' => ['nullable', 'string', 'max:5000'],
            'company_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $application->fill([
            'company_notes' => trim($validated['company_notes'] ?? '') ?: null,
            'company_rating' => $validated['company_rating'] ?? null,
        ])->save();

        $application->load($this->companyApplicantRelations())->loadCount('quizResponses');

        return response()->json([
            'message' => 'Recruiter review saved',
            'application' => $application,
        ]);
    }

    /**
     * Company records interview outcome and private feedback.
     */
    public function saveInterviewFeedback(Request $request, Application $application)
    {
        $user = $request->user();
        $application->load('jobPosting.company', 'jobSeeker.user');

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$application->interview_scheduled_at) {
            return response()->json(['message' => 'Schedule an interview before saving feedback'], 422);
        }

        $validated = $request->validate([
            'interview_status' => ['required', Rule::in(Application::INTERVIEW_STATUSES)],
            'interview_feedback' => ['nullable', 'string', 'max:5000'],
            'interview_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $application->fill([
            'interview_status' => $validated['interview_status'],
            'interview_feedback' => trim($validated['interview_feedback'] ?? '') ?: null,
            'interview_rating' => $validated['interview_rating'] ?? null,
            'interview_completed_at' => $validated['interview_status'] === 'completed'
                ? ($application->interview_completed_at ?: now())
                : null,
        ]);

        if (
            $validated['interview_status'] === 'completed' &&
            in_array($application->status, [
                Application::STATUS_PENDING,
                Application::STATUS_SCREENING,
                Application::STATUS_SHORTLISTED,
                Application::STATUS_INTERVIEW,
            ], true)
        ) {
            $application->status = Application::STATUS_INTERVIEW;
        }

        $application->save();
        $application->load($this->companyApplicantRelations())->loadCount('quizResponses');

        return response()->json([
            'message' => 'Interview feedback saved',
            'application' => $application,
        ]);
    }

    /**
     * Company views or downloads an applicant resume.
     */
    public function resume(Request $request, Application $application)
    {
        $user = $request->user();
        $application->load('jobPosting', 'jobSeeker.user', 'jobSeeker.resume');

        if ($user->role !== 'company' || $application->jobPosting->company_id !== $user->company?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $resume = $application->jobSeeker?->resume;

        if (!$resume || !Storage::disk('public')->exists($resume->file_path)) {
            return response()->json(['message' => 'Candidate resume is not available'], 404);
        }

        $path = Storage::disk('public')->path($resume->file_path);
        $candidateName = Str::slug($application->jobSeeker?->user?->name ?: 'candidate');
        $fileName = $candidateName . '-resume.pdf';

        if ($request->boolean('download')) {
            return response()->download($path, $fileName, [
                'Content-Type' => 'application/pdf',
            ]);
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $fileName . '"',
        ]);
    }

    /**
     * Job seeker withdraws a pending application
     */
    public function withdraw(Request $request, Application $application)
    {
        $user = $request->user();
        $application->load('jobPosting.company.user', 'jobSeeker.user');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker || $application->job_seeker_id !== $user->jobSeeker->id) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        if ($application->status !== Application::STATUS_PENDING) {
            return response()->json(['message' => 'Only pending applications can be withdrawn'], 422);
        }

        $validated = $request->validate([
            'withdraw_reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $application->status = Application::STATUS_WITHDRAWN;
        $application->withdraw_reason = trim($validated['withdraw_reason']);
        $application->withdrawn_at = now();
        $application->save();

        $this->createNotification(
            $application->jobPosting?->company?->user_id,
            $user->id,
            'candidate_application_withdrawn',
            'Application withdrawn',
            $user->name . ' withdrew the application for ' . $application->jobPosting->title . '.',
            [
                'link' => '/company/applicants?application=' . $application->id,
                'application_id' => $application->id,
                'job_id' => $application->job_id,
            ]
        );

        $application->load('jobPosting.company', 'skillGaps')->loadCount('quizResponses');

        return response()->json([
            'message' => 'Application withdrawn successfully',
            'application' => $application,
        ]);
    }

    private function companyApplicantRelations(): array
    {
        return [
            'jobSeeker.user',
            'jobSeeker.resume',
            'jobSeeker.experiences',
            'jobPosting.company',
            'skillGaps',
            'quizResponses.question',
        ];
    }

    private function notifyCandidateOfStatusChange(Application $application, int $actorId, string $previousStatus): void
    {
        $candidateUser = $application->jobSeeker?->user;

        if (!$candidateUser) {
            return;
        }

        $status = $application->status;
        $jobTitle = $application->jobPosting?->title ?: 'your application';
        $label = $this->statusLabel($status);

        if ($status === Application::STATUS_SHORTLISTED) {
            Mail::to($candidateUser->email)->send(new ShortlistMail($application));
        } elseif ($status === Application::STATUS_REJECTED) {
            Mail::to($candidateUser->email)->send(new RejectionMail($application));
        }

        $type = match ($status) {
            Application::STATUS_SHORTLISTED => 'application_shortlisted',
            Application::STATUS_REJECTED => 'application_rejected',
            Application::STATUS_OFFERED => 'application_offered',
            Application::STATUS_HIRED => 'application_hired',
            Application::STATUS_INTERVIEW => 'application_interview',
            Application::STATUS_SCREENING => 'application_screening',
            default => 'application_updated',
        };

        $title = match ($status) {
            Application::STATUS_SHORTLISTED => 'Application shortlisted',
            Application::STATUS_REJECTED => 'Application update',
            Application::STATUS_OFFERED => 'Offer stage',
            Application::STATUS_HIRED => 'Application hired',
            Application::STATUS_INTERVIEW => 'Interview stage',
            Application::STATUS_SCREENING => 'Application screening',
            default => 'Application update',
        };

        $message = match ($status) {
            Application::STATUS_SHORTLISTED => 'Your application for ' . $jobTitle . ' has been shortlisted.',
            Application::STATUS_REJECTED => 'Your application for ' . $jobTitle . ' was not selected.',
            Application::STATUS_OFFERED => 'Your application for ' . $jobTitle . ' has moved to the offer stage.',
            Application::STATUS_HIRED => 'Your application for ' . $jobTitle . ' has been marked as hired.',
            Application::STATUS_INTERVIEW => 'Your application for ' . $jobTitle . ' is now in the interview stage.',
            Application::STATUS_SCREENING => 'Your application for ' . $jobTitle . ' is being screened by the company.',
            default => 'Your application for ' . $jobTitle . ' was updated.',
        };

        $this->createNotification(
            $candidateUser->id,
            $actorId,
            $type,
            $title,
            $message,
            [
                'link' => '/my-applications?application=' . $application->id,
                'application_id' => $application->id,
                'job_id' => $application->job_id,
                'status' => $status,
                'status_label' => $label,
                'previous_status' => $previousStatus,
            ]
        );
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

    private function createNotification(?int $userId, ?int $actorId, string $type, string $title, string $message, array $data = []): void
    {
        if (!$userId) {
            return;
        }

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
