<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Services\JobAlertMatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class JobPostingController extends Controller
{
    /**
     * List all job postings (public — job seekers browse)
     */
    public function index()
    {
        $jobs = JobPosting::with('company')
            ->acceptingApplications()
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

        $validator = Validator::make($request->all(), $this->jobRules());
        $this->addSalaryRangeValidation($validator, $request);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $this->jobPayload($validator->validated());

        $job = JobPosting::create([
            'company_id' => $user->company->id,
            ...$payload,
            'status' => $payload['status'] ?? JobPosting::STATUS_ACTIVE,
        ]);
        $alertNotifications = $job->is_accepting_applications
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

        $validator = Validator::make($request->all(), $this->jobRules(true));
        $this->addSalaryRangeValidation($validator, $request, $job);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $previousStatus = $job->status;
        $job->update($this->jobPayload($validator->validated(), true));
        $alertNotifications = $previousStatus !== JobPosting::STATUS_ACTIVE && $job->is_accepting_applications
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

    private function jobRules(bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string'],
            'required_skills' => [$required, 'string'],
            'job_type' => ['nullable', Rule::in(JobPosting::JOB_TYPES)],
            'work_mode' => ['nullable', Rule::in(JobPosting::WORK_MODES)],
            'experience_level' => ['nullable', Rule::in(JobPosting::EXPERIENCE_LEVELS)],
            'location' => ['nullable', 'string', 'max:255'],
            'salary_min' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'salary_max' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'salary_currency' => ['nullable', 'string', 'max:10'],
            'application_deadline' => ['nullable', 'date', 'after_or_equal:today'],
            'status' => [$updating ? 'sometimes' : 'nullable', Rule::in(JobPosting::STATUSES)],
        ];
    }

    private function addSalaryRangeValidation($validator, Request $request, ?JobPosting $job = null): void
    {
        $validator->after(function ($validator) use ($request, $job) {
            if ($validator->errors()->has('salary_min') || $validator->errors()->has('salary_max')) {
                return;
            }

            $min = $request->has('salary_min') ? $request->input('salary_min') : $job?->salary_min;
            $max = $request->has('salary_max') ? $request->input('salary_max') : $job?->salary_max;
            $min = $min === '' ? null : $min;
            $max = $max === '' ? null : $max;

            if ($min !== null && $max !== null && (int) $max < (int) $min) {
                $validator->errors()->add('salary_max', 'The maximum salary must be greater than or equal to the minimum salary.');
            }
        });
    }

    private function jobPayload(array $validated, bool $updating = false): array
    {
        $payload = [];
        $stringFields = [
            'title',
            'description',
            'required_skills',
            'job_type',
            'work_mode',
            'experience_level',
            'location',
            'status',
        ];

        foreach ($stringFields as $field) {
            if (array_key_exists($field, $validated)) {
                $value = trim((string) ($validated[$field] ?? ''));
                $payload[$field] = $value === '' && !in_array($field, ['title', 'description', 'required_skills'], true)
                    ? null
                    : $value;
            }
        }

        foreach (['salary_min', 'salary_max'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field] === null || $validated[$field] === ''
                    ? null
                    : (int) $validated[$field];
            }
        }

        if (array_key_exists('salary_currency', $validated)) {
            $currency = strtoupper(trim((string) ($validated['salary_currency'] ?? '')));
            $payload['salary_currency'] = $currency ?: 'PKR';
        } elseif (!$updating) {
            $payload['salary_currency'] = 'PKR';
        }

        if (array_key_exists('application_deadline', $validated)) {
            $deadline = trim((string) ($validated['application_deadline'] ?? ''));
            $payload['application_deadline'] = $deadline ?: null;
        }

        return $payload;
    }
}
