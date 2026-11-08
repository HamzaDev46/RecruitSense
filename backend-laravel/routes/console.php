<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('users:clean-non-admins', function () {
    $this->info('Starting database cleanup for non-admin accounts...');
    $result = \App\Services\DatabaseCleanupService::cleanNonAdminAccounts();
    if ($result['status'] === 'success') {
        $this->info('Success: ' . $result['message']);
        $this->line(json_encode($result['deleted_summary'], JSON_PRETTY_PRINT));
    } else {
        $this->error('Error: ' . $result['message']);
    }
})->purpose('Safely delete all non-admin accounts and related data');

Artisan::command('db:seed-50-companies', function () {
    $this->info('Starting mass seeding of 50+ companies and 500+ jobs...');
    $result = \App\Services\MassCompanySeederService::seed50Companies();
    if ($result['status'] === 'success') {
        $this->info($result['message']);
        $this->info("Total Companies: {$result['total_companies']} | Total Jobs: {$result['total_jobs']}");
    } else {
        $this->error('Error: ' . $result['message']);
    }
})->purpose('Seed 50 diverse companies with at least 10 jobs each');

Artisan::command('db:seed-specialized-jobs', function () {
    $this->info('Starting seeding of ACCA, CA, Mobile, MERN, Laravel, and AI developer jobs across 2 companies...');
    $this->call(\Database\Seeders\SpecializedJobsSeeder::class);
    $this->info('Specialized companies and jobs seeded successfully!');
})->purpose('Seed ACCA, CA, Mobile Apps, MERN, Laravel, and AI jobs for two distinct companies');

Artisan::command('recruitsense:send-job-recommendations {email?}', function (?string $email = null) {
    $this->info('Scanning candidates for AI job recommendations...');
    $query = \App\Models\User::where('role', 'jobseeker')
        ->where('account_status', '!=', 'suspended')
        ->with('jobSeeker.resume', 'jobSeeker.experiences');

    if ($email) {
        $query->where('email', $email);
    }

    $controller = app(\App\Http\Controllers\Api\RecommendedJobController::class);
    $sent = 0;

    $query->chunkById(50, function ($users) use ($controller, &$sent) {
        foreach ($users as $user) {
            if (!$user->jobSeeker || !filled($user->email)) {
                continue;
            }

            try {
                $result = $controller->computeRecommendations($user->jobSeeker);
                $recommendations = $result['recommendations'] ?? [];

                if (!empty($recommendations)) {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(
                        new \App\Mail\RecommendedJobsMail($user, $recommendations)
                    );
                    $this->line("✓ Sent recommendations to {$user->email} (" . count($recommendations) . " matches)");
                    $sent++;
                }
            } catch (\Throwable $e) {
                $this->warn("Failed sending to {$user->email}: " . $e->getMessage());
            }
        }
    });

    $this->info("Complete! Dispatched {$sent} job recommendation email(s).");
})->purpose('Dispatch AI recommended job matches to active job seekers');

Artisan::command('recruitsense:send-profile-reminders {--min=0} {--max=79} {email?}', function (?string $email = null) {
    $min = (int) ($this->option('min') ?? 0);
    $max = (int) ($this->option('max') ?? 79);

    $this->info("Scanning job seekers with profile completion between {$min}% and {$max}%...");
    $query = \App\Models\User::where('role', 'jobseeker')
        ->where('account_status', '!=', 'suspended')
        ->with('jobSeeker.resume', 'jobSeeker.experiences');

    if ($email) {
        $query->where('email', $email);
    }

    $sent = 0;
    $query->chunkById(50, function ($users) use ($min, $max, &$sent) {
        foreach ($users as $user) {
            if (!$user->jobSeeker || !filled($user->email)) {
                continue;
            }

            $summary = \App\Support\ProfileCompletion::forJobSeeker($user->jobSeeker);
            $completion = $summary['completion'] ?? 0;

            if ($completion >= $min && $completion <= $max) {
                $missingTasks = collect($summary['tasks'] ?? [])->where('complete', false)->values()->all();

                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(
                        new \App\Mail\ProfileCompletionReminderMail($user, $completion, $missingTasks)
                    );
                    $this->line("✓ Sent profile reminder to {$user->email} ({$completion}% complete)");
                    $sent++;
                } catch (\Throwable $e) {
                    $this->warn("Failed sending to {$user->email}: " . $e->getMessage());
                }
            }
        }
    });

    $this->info("Complete! Dispatched {$sent} profile completion reminder email(s).");
})->purpose('Dispatch profile completion nudge emails to job seekers with incomplete profiles');



