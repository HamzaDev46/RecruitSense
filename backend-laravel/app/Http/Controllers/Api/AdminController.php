<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\Company;
use App\Models\ContentReport;
use App\Models\JobPosting;
use App\Models\User;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private function adminOnly(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return null;
    }

    public function dashboard(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        return response()->json([
            'stats' => $this->baseStats(),
            'recent_companies' => Company::with('user')->withCount('jobPostings')->latest()->limit(5)->get(),
            'recent_jobs' => JobPosting::with('company')->withCount('applications')->latest()->limit(5)->get(),
            'recent_activity' => $this->buildActivityLog(8),
            'application_status' => $this->applicationStatusCounts(),
        ]);
    }

    public function analytics(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        return response()->json([
            'stats' => $this->baseStats(),
            'application_status' => $this->applicationStatusCounts(),
            'job_status' => $this->jobStatusCounts(),
            'company_status' => $this->companyStatusCounts(),
            'user_growth' => $this->monthlyUserGrowth(),
            'top_companies' => Company::withCount('jobPostings')
                ->with('user')
                ->orderByDesc('job_postings_count')
                ->limit(6)
                ->get(),
        ]);
    }

    public function activityLog(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        return response()->json([
            'activities' => $this->buildActivityLog(40),
        ]);
    }

    public function getUsers(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        $users = User::with([
                'jobSeeker' => fn ($query) => $query->withCount(['applications', 'savedJobs']),
            ])
            ->withCount(['posts', 'notifications'])
            ->where('role', 'jobseeker')
            ->latest()
            ->get()
            ->map(function ($user) use ($storageUrl) {
                $profile = $user->jobSeeker;
                $user->profile_image_url = $profile?->profile_image ? $storageUrl . $profile->profile_image : null;
                $user->headline = $profile?->headline ?: null;
                $user->location = $profile?->location ?: null;
                return $user;
            });

        return response()->json($users);
    }

    public function getCompanies(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $companies = Company::with('user')
            ->withCount('jobPostings')
            ->latest()
            ->get();

        return response()->json($companies);
    }

    public function getJobs(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $jobs = JobPosting::with('company.user')
            ->withCount('applications')
            ->latest()
            ->get();

        return response()->json($jobs);
    }

    public function getApplications(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $applications = Application::with('jobSeeker.user', 'jobPosting.company')
            ->latest()
            ->get();

        return response()->json($applications);
    }

    public function updateUserStatus(Request $request, $id)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'account_status' => ['required', Rule::in(['active', 'suspended'])],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('role', '!=', 'admin')->findOrFail($id);
        $data = $validator->validated();

        $user->forceFill([
            'account_status' => $data['account_status'],
            'admin_note' => trim((string) ($data['admin_note'] ?? '')) ?: null,
        ])->save();

        if ($user->account_status === 'suspended') {
            $user->tokens()->delete();
        }

        $this->notifyAdminAction(
            $user,
            $request->user(),
            $user->account_status === 'suspended' ? 'Account suspended' : 'Account activated',
            $user->account_status === 'suspended'
                ? 'Your RecruitSense account has been suspended by admin.'
                : 'Your RecruitSense account is active again.',
            ['status' => $user->account_status]
        );

        return response()->json([
            'message' => 'User status updated',
            'user' => $user->fresh(['jobSeeker']),
        ]);
    }

    public function updateCompanyStatus(Request $request, $id)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => ['required', Rule::in(['pending', 'verified', 'suspended'])],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::with('user')->findOrFail($id);
        $data = $validator->validated();

        $company->forceFill([
            'verification_status' => $data['verification_status'],
            'admin_note' => trim((string) ($data['admin_note'] ?? '')) ?: null,
        ])->save();

        if ($company->user) {
            $company->user->forceFill([
                'account_status' => $company->verification_status === 'suspended' ? 'suspended' : 'active',
            ])->save();

            if ($company->verification_status === 'suspended') {
                $company->user->tokens()->delete();
            }

            $this->notifyAdminAction(
                $company->user,
                $request->user(),
                'Company status updated',
                'Your company verification status is now ' . $company->verification_status . '.',
                ['status' => $company->verification_status]
            );
        }

        return response()->json([
            'message' => 'Company status updated',
            'company' => $company->fresh(['user']),
        ]);
    }

    public function updateJobStatus(Request $request, $id)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(JobPosting::STATUSES)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = JobPosting::with('company.user')->findOrFail($id);
        $job->update(['status' => $validator->validated()['status']]);

        return response()->json([
            'message' => 'Job status updated',
            'job' => $job->fresh(['company.user'])->loadCount('applications'),
        ]);
    }

    public function broadcast(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:1500'],
            'target' => ['required', Rule::in(['all', 'jobseeker', 'company'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $roles = $data['target'] === 'all' ? ['jobseeker', 'company'] : [$data['target']];
        $sent = 0;

        User::whereIn('role', $roles)
            ->where('account_status', '!=', 'suspended')
            ->chunkById(100, function ($users) use ($data, $request, &$sent) {
                foreach ($users as $user) {
                    AppNotification::create([
                        'user_id' => $user->id,
                        'actor_id' => $request->user()->id,
                        'type' => 'admin_broadcast',
                        'title' => $data['title'],
                        'message' => $data['message'],
                        'data' => [
                            'target' => $data['target'],
                            'sent_by' => $request->user()->name,
                        ],
                    ]);

                    UserCache::forgetUnreadNotifications($user->id);
                    $sent++;
                }
            });

        return response()->json([
            'message' => 'Broadcast sent successfully',
            'sent_count' => $sent,
        ], 201);
    }

    public function getSettings(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        return response()->json(['settings' => AdminSetting::allValues()]);
    }

    public function updateSettings(Request $request)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $input = [
            'site_name' => $request->input('site_name', $request->input('siteName')),
            'site_email' => $request->input('site_email', $request->input('siteEmail')),
            'allow_registrations' => $request->input('allow_registrations', $request->input('allowRegistrations')),
            'email_notifications' => $request->input('email_notifications', $request->input('emailNotifications')),
            'maintenance_mode' => $request->input('maintenance_mode', $request->input('maintenanceMode')),
            'auto_verify_companies' => $request->input('auto_verify_companies', $request->input('autoVerifyCompanies')),
        ];

        $validator = Validator::make($input, [
            'site_name' => ['required', 'string', 'max:80'],
            'site_email' => ['required', 'email', 'max:255'],
            'allow_registrations' => ['required', 'boolean'],
            'email_notifications' => ['required', 'boolean'],
            'maintenance_mode' => ['required', 'boolean'],
            'auto_verify_companies' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($validator->validated() as $key => $value) {
            AdminSetting::setValue($key, $value);
        }

        return response()->json([
            'message' => 'Settings saved successfully',
            'settings' => AdminSetting::allValues(),
        ]);
    }

    public function deleteUser(Request $request, $id)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $user = User::where('role', '!=', 'admin')->findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function deleteCompany(Request $request, $id)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $company = Company::with('user')->findOrFail($id);
        $company->user?->delete();
        $company->delete();

        return response()->json(['message' => 'Company deleted successfully']);
    }

    public function deleteJob(Request $request, $id)
    {
        if ($error = $this->adminOnly($request)) {
            return $error;
        }

        $job = JobPosting::findOrFail($id);
        $job->delete();

        return response()->json(['message' => 'Job deleted successfully']);
    }

    private function baseStats(): array
    {
        $applicationCounts = $this->applicationStatusCounts();
        $companyCounts = $this->companyStatusCounts();

        return [
            'totalUsers' => User::where('role', 'jobseeker')->count(),
            'totalCompanies' => Company::count(),
            'totalJobs' => JobPosting::count(),
            'activeJobs' => JobPosting::where('status', JobPosting::STATUS_ACTIVE)->count(),
            'totalApplications' => Application::count(),
            'pending' => $applicationCounts['pending'] ?? 0,
            'screening' => $applicationCounts['screening'] ?? 0,
            'shortlisted' => $applicationCounts['shortlisted'] ?? 0,
            'interview' => $applicationCounts['interview'] ?? 0,
            'offered' => $applicationCounts['offered'] ?? 0,
            'hired' => $applicationCounts['hired'] ?? 0,
            'rejected' => $applicationCounts['rejected'] ?? 0,
            'withdrawn' => $applicationCounts['withdrawn'] ?? 0,
            'suspendedUsers' => User::where('account_status', 'suspended')->count(),
            'verifiedCompanies' => $companyCounts['verified'] ?? 0,
            'pendingCompanies' => $companyCounts['pending'] ?? 0,
            'suspendedCompanies' => $companyCounts['suspended'] ?? 0,
            'pendingReports' => ContentReport::where('status', 'pending')->count(),
        ];
    }

    private function applicationStatusCounts(): array
    {
        return array_replace(
            array_fill_keys(Application::STATUSES, 0),
            Application::selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status')
                ->map(fn ($value) => (int) $value)
                ->all()
        );
    }

    private function jobStatusCounts(): array
    {
        return array_replace(
            array_fill_keys(JobPosting::STATUSES, 0),
            JobPosting::selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status')
                ->map(fn ($value) => (int) $value)
                ->all()
        );
    }

    private function companyStatusCounts(): array
    {
        return array_replace(
            ['pending' => 0, 'verified' => 0, 'suspended' => 0],
            Company::selectRaw('verification_status, COUNT(*) as total')
                ->groupBy('verification_status')
                ->pluck('total', 'verification_status')
                ->map(fn ($value) => (int) $value)
                ->all()
        );
    }

    private function monthlyUserGrowth(): array
    {
        $months = collect(range(5, 0))->mapWithKeys(function ($offset) {
            $date = now()->subMonths($offset);

            return [$date->format('Y-m') => [
                'name' => $date->format('M'),
                'jobseekers' => 0,
                'companies' => 0,
            ]];
        });

        User::whereIn('role', ['jobseeker', 'company'])
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->get(['role', 'created_at'])
            ->each(function ($user) use ($months) {
                $bucket = $user->created_at?->format('Y-m');

                if (!$bucket || !$months->has($bucket)) {
                    return;
                }

                $row = $months->get($bucket);
                $key = $user->role === 'company' ? 'companies' : 'jobseekers';
                $row[$key]++;
                $months->put($bucket, $row);
            });

        return $months->values()->all();
    }

    private function buildActivityLog(int $limit): array
    {
        $activities = collect();

        User::where('role', 'jobseeker')->latest()->limit(10)->get()->each(function ($user) use ($activities) {
            $activities->push($this->activityItem(
                'register',
                'Job seeker registered',
                "{$user->name} joined as a job seeker",
                $user->created_at,
                ['user_id' => $user->id, 'email' => $user->email, 'status' => $user->account_status ?? 'active']
            ));
        });

        Company::with('user')->latest()->limit(10)->get()->each(function ($company) use ($activities) {
            $activities->push($this->activityItem(
                'company',
                'Company registered',
                "{$company->name} joined RecruitSense",
                $company->created_at,
                ['company_id' => $company->id, 'email' => $company->user?->email, 'status' => $company->verification_status ?? 'verified']
            ));
        });

        JobPosting::with('company')->latest()->limit(10)->get()->each(function ($job) use ($activities) {
            $activities->push($this->activityItem(
                'job',
                'Job posted',
                "{$job->company?->name} posted {$job->title}",
                $job->created_at,
                ['job_id' => $job->id, 'company' => $job->company?->name, 'status' => $job->status]
            ));
        });

        Application::with('jobSeeker.user', 'jobPosting.company')->latest()->limit(10)->get()->each(function ($application) use ($activities) {
            $candidate = $application->jobSeeker?->user?->name ?? 'A candidate';
            $job = $application->jobPosting?->title ?? 'a job';

            $activities->push($this->activityItem(
                'application',
                'Application updated',
                "{$candidate} is {$application->status} for {$job}",
                $application->updated_at,
                ['application_id' => $application->id, 'status' => $application->status]
            ));
        });

        ContentReport::with('reporter', 'reportedUser')->latest()->limit(10)->get()->each(function ($report) use ($activities) {
            $activities->push($this->activityItem(
                'report',
                'Content report',
                "{$report->reporter?->name} reported {$report->reportedUser?->name}",
                $report->created_at,
                ['report_id' => $report->id, 'reason' => $report->reason, 'status' => $report->status]
            ));
        });

        AppNotification::with('actor')
            ->where('type', 'admin_broadcast')
            ->latest()
            ->limit(10)
            ->get()
            ->each(function ($notification) use ($activities) {
                $activities->push($this->activityItem(
                    'broadcast',
                    'Broadcast sent',
                    "{$notification->actor?->name} sent: {$notification->title}",
                    $notification->created_at,
                    ['notification_id' => $notification->id, 'target' => $notification->data['target'] ?? 'all']
                ));
            });

        return $activities
            ->sortByDesc('sort_at')
            ->take($limit)
            ->values()
            ->map(fn ($activity) => collect($activity)->except('sort_at')->all())
            ->all();
    }

    private function activityItem(string $type, string $title, string $message, $date, array $data = []): array
    {
        return [
            'id' => $type . '-' . ($data[array_key_first($data)] ?? md5($message . $date)),
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'created_at' => $date?->toISOString(),
            'time' => $date?->diffForHumans() ?? 'Recently',
            'sort_at' => $date?->timestamp ?? 0,
        ];
    }

    private function notifyAdminAction(User $user, User $admin, string $title, string $message, array $data = []): void
    {
        AppNotification::create([
            'user_id' => $user->id,
            'actor_id' => $admin->id,
            'type' => 'admin_action',
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        UserCache::forgetUnreadNotifications($user->id);
    }
}
