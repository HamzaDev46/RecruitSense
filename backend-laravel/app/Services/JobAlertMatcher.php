<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\JobAlert;
use App\Models\JobPosting;
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
        $notificationsCreated = 0;

        JobAlert::with('user.jobSeeker.resume')
            ->where('is_active', true)
            ->chunkById(100, function ($alerts) use ($job, &$notificationsCreated) {
                foreach ($alerts as $alert) {
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

                    $alert->forceFill(['last_notified_at' => now()])->save();
                    $notificationsCreated++;
                }
            });

        return $notificationsCreated;
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
            $job->company?->name,
            'Pakistan',
        ]))->lower()->toString();

        return Str::contains($haystack, Str::of($keyword)->lower()->trim()->toString());
    }
}
