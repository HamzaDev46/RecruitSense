<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\JobAlert;
use App\Models\JobPosting;
use App\Support\UserCache;
use Illuminate\Support\Str;

class JobAlertMatcher
{
    public function match(JobAlert $alert, JobPosting $job): array
    {
        $job->loadMissing('company');
        $alert->loadMissing('user.jobSeeker.resume');

        $alertSkills = $this->alertSkills($alert);
        $jobSkills = $this->normalizeSkills($job->required_skills);
        $matchedSkills = $this->matchedSkills($alertSkills, $jobSkills);
        $skillScore = count($jobSkills) > 0
            ? (int) round((count($matchedSkills) / count($jobSkills)) * 100)
            : 0;

        $keywordMatches = $this->keywordMatches($alert->keyword, $job);
        $keywordScore = $keywordMatches ? 100 : 0;

        if ($alertSkills && $alert->keyword) {
            $score = (int) round(($skillScore * 0.75) + ($keywordScore * 0.25));
        } elseif ($alertSkills) {
            $score = $skillScore;
        } else {
            $score = $keywordScore;
        }

        return [
            'score' => min(100, max(0, $score)),
            'matched_skills' => $matchedSkills,
            'keyword_matched' => $keywordMatches,
        ];
    }

    public function notifyMatchingAlerts(JobPosting $job): int
    {
        $job->loadMissing('company.user');

        if (!$job->is_accepting_applications) {
            return 0;
        }

        $notificationsCreated = 0;

        JobAlert::with('user.jobSeeker.resume')
            ->where('is_active', true)
            ->chunkById(100, function ($alerts) use ($job, &$notificationsCreated) {
                foreach ($alerts as $alert) {
                    if ($alert->user?->notificationEnabledFor('job_alert_match') === false) {
                        continue;
                    }

                    $match = $this->match($alert, $job);

                    if ($match['score'] < $alert->min_match_score || $match['score'] === 0) {
                        continue;
                    }

                    $alreadyNotified = AppNotification::where('user_id', $alert->user_id)
                        ->where('type', 'job_alert_match')
                        ->where('data->alert_id', $alert->id)
                        ->where('data->job_id', $job->id)
                        ->exists();

                    if ($alreadyNotified) {
                        continue;
                    }

                    AppNotification::create([
                        'user_id' => $alert->user_id,
                        'actor_id' => $job->company?->user_id,
                        'type' => 'job_alert_match',
                        'title' => 'New job alert match',
                        'message' => $job->title . ' at ' . ($job->company?->name ?: 'a company') . ' matched your job alert.',
                        'data' => [
                            'alert_id' => $alert->id,
                            'job_id' => $job->id,
                            'match_score' => $match['score'],
                            'link' => '/jobs/' . $job->id,
                        ],
                    ]);
                    UserCache::forgetUnreadNotifications($alert->user_id);

                    $alert->forceFill(['last_notified_at' => now()])->save();
                    $notificationsCreated++;
                }
            });

        return $notificationsCreated;
    }

    /**
     * Automated Talent Pool Sourcing: Match and notify active jobseekers for a new job.
     */
    public function notifyTopMatchingJobSeekers(JobPosting $job): int
    {
        $job->loadMissing('company.user');

        if (!$job->is_accepting_applications) {
            return 0;
        }

        $jobSkills = $this->normalizeSkills($job->required_skills);
        if (empty($jobSkills)) {
            return 0;
        }

        $matchedCount = 0;
        $companyUserId = $job->company?->user_id;

        \App\Models\JobSeeker::with('user', 'resume', 'applications')
            ->whereNotNull('user_id')
            ->chunkById(50, function ($jobSeekers) use ($job, $jobSkills, $companyUserId, &$matchedCount) {
                foreach ($jobSeekers as $jobSeeker) {
                    $user = $jobSeeker->user;
                    if (!$user || $user->role !== 'jobseeker') {
                        continue;
                    }

                    // Skip if candidate already applied to this job
                    $alreadyApplied = $jobSeeker->applications->contains('job_id', $job->id);
                    if ($alreadyApplied) {
                        continue;
                    }

                    // Extract all candidate skills
                    $candidateSkillsRaw = implode(',', array_filter([
                        $jobSeeker->skills,
                        $jobSeeker->resume?->parsed_skills,
                        $jobSeeker->headline,
                    ]));
                    $candidateSkills = $this->normalizeSkills($candidateSkillsRaw);

                    if (empty($candidateSkills)) {
                        continue;
                    }

                    $matchedSkills = $this->matchedSkills($candidateSkills, $jobSkills);
                    $matchScore = (int) round((count($matchedSkills) / count($jobSkills)) * 100);

                    // Alert threshold: >= 70% match
                    if ($matchScore < 70) {
                        continue;
                    }

                    // Check if already notified
                    $alreadyNotified = AppNotification::where('user_id', $user->id)
                        ->where('type', 'smart_job_match')
                        ->where('data->job_id', $job->id)
                        ->exists();

                    if ($alreadyNotified) {
                        continue;
                    }

                    AppNotification::create([
                        'user_id' => $user->id,
                        'actor_id' => $companyUserId,
                        'type' => 'smart_job_match',
                        'title' => '💼 Smart Job Match (' . $matchScore . '%)',
                        'message' => ($job->company?->name ?: 'A company') . ' just posted ' . $job->title . ' which strongly matches your skills (' . count($matchedSkills) . ' matching skills).',
                        'data' => [
                            'job_id' => $job->id,
                            'match_score' => $matchScore,
                            'matched_skills' => $matchedSkills,
                            'link' => '/jobs/' . $job->id,
                        ],
                    ]);
                    UserCache::forgetUnreadNotifications($user->id);
                    $matchedCount++;
                }
            });

        // Notify recruiter of identified talent in the pool
        if ($matchedCount > 0 && $companyUserId) {
            $alreadyNotifiedCompany = AppNotification::where('user_id', $companyUserId)
                ->where('type', 'talent_pool_sourcing_summary')
                ->where('data->job_id', $job->id)
                ->exists();

            if (!$alreadyNotifiedCompany) {
                AppNotification::create([
                    'user_id' => $companyUserId,
                    'actor_id' => null,
                    'type' => 'talent_pool_sourcing_summary',
                    'title' => '✨ Talent Pool Match Alert',
                    'message' => 'We identified ' . $matchedCount . ' qualified candidate(s) in the talent pool matching your new job: ' . $job->title . '.',
                    'data' => [
                        'job_id' => $job->id,
                        'matched_candidate_count' => $matchedCount,
                        'link' => '/company/candidates?job=' . $job->id,
                    ],
                ]);
                UserCache::forgetUnreadNotifications($companyUserId);
            }
        }

        return $matchedCount;
    }

    private function alertSkills(JobAlert $alert): array
    {
        $profileSkills = implode(',', [
            $alert->user?->jobSeeker?->skills,
            $alert->user?->jobSeeker?->resume?->parsed_skills,
        ]);

        return $this->normalizeSkills($alert->skills ?: $profileSkills);
    }

    private function normalizeSkills(?string $skills): array
    {
        if (!$skills) {
            return [];
        }

        return collect(preg_split('/[,|;\\n]+/', $skills))
            ->map(fn ($skill) => Str::of($skill)
                ->lower()
                ->replaceMatches('/[\\[\\]{}"\']+/', '')
                ->trim()
                ->replaceMatches('/\\s+/', ' ')
                ->toString())
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function matchedSkills(array $alertSkills, array $jobSkills): array
    {
        return collect($jobSkills)
            ->filter(function ($required) use ($alertSkills) {
                return collect($alertSkills)->contains(function ($candidate) use ($required) {
                    return $candidate === $required
                        || Str::contains($candidate, $required)
                        || Str::contains($required, $candidate);
                });
            })
            ->values()
            ->all();
    }

    private function keywordMatches(?string $keyword, JobPosting $job): bool
    {
        if (!$keyword) {
            return false;
        }

        $haystack = Str::of(implode(' ', [
            $job->title,
            $job->description,
            $job->required_skills,
            $job->job_type,
            $job->work_mode,
            $job->experience_level,
            $job->location,
            $job->company?->name,
            'Pakistan',
        ]))->lower()->toString();

        return Str::contains($haystack, Str::of($keyword)->lower()->trim()->toString());
    }
}
