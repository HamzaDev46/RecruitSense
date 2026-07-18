<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ResumeInsightController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('jobSeeker.resume', 'jobSeeker.experiences');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can view resume insights'], 403);
        }

        $jobSeeker = $user->jobSeeker;
        $resume = $jobSeeker->resume;
        $applications = Application::with(['jobPosting.company', 'skillGaps'])
            ->where('job_seeker_id', $jobSeeker->id)
            ->latest()
            ->limit(20)
            ->get();
        $jobs = JobPosting::with('company')->latest()->limit(50)->get();

        $candidateSkills = $this->candidateSkills($jobSeeker);
        $targetSkills = $this->targetSkills($applications, $jobs);
        $missingKeywords = $this->missingKeywords($candidateSkills, $targetSkills);
        $profileText = $this->profileText($jobSeeker);
        $checklist = $this->checklist($jobSeeker, $resume, $candidateSkills, $missingKeywords, $profileText);
        $score = $this->score($checklist, $candidateSkills, $targetSkills, $profileText, (bool) $resume);

        return response()->json([
            'resume' => [
                'uploaded' => (bool) $resume,
                'file_name' => $resume?->file_path ? basename($resume->file_path) : null,
                'has_extracted_text' => filled($resume?->extracted_text),
                'parsed_skills' => $resume?->parsed_skills,
                'uploaded_at' => $resume?->created_at?->toISOString(),
            ],
            'score' => $score,
            'level' => $this->level($score),
            'candidate_skills' => $candidateSkills,
            'target_skills' => $targetSkills->values()->all(),
            'missing_keywords' => $missingKeywords->values()->all(),
            'checklist' => $checklist,
            'suggestions' => $this->suggestions($resume, $candidateSkills, $missingKeywords, $profileText, $applications),
            'application_gaps' => $this->applicationGaps($applications),
        ]);
    }

    private function candidateSkills($jobSeeker): array
    {
        return $this->normalizeSkills(implode(',', [
            $jobSeeker->skills,
            $jobSeeker->resume?->parsed_skills,
        ]));
    }

    private function targetSkills($applications, $jobs)
    {
        $appliedSkills = $applications
            ->flatMap(fn ($application) => $this->normalizeSkills($application->jobPosting?->required_skills));
        $marketSkills = $jobs
            ->flatMap(fn ($job) => $this->normalizeSkills($job->required_skills));

        return $appliedSkills
            ->merge($marketSkills)
            ->filter()
            ->countBy()
            ->sortDesc()
            ->map(fn ($count, $skill) => [
                'skill' => $skill,
                'count' => $count,
            ])
            ->take(15);
    }

    private function missingKeywords(array $candidateSkills, $targetSkills)
    {
        return $targetSkills
            ->filter(function ($item) use ($candidateSkills) {
                return !collect($candidateSkills)->contains(function ($candidate) use ($item) {
                    return $candidate === $item['skill']
                        || Str::contains($candidate, $item['skill'])
                        || Str::contains($item['skill'], $candidate);
                });
            })
            ->take(10)
            ->values();
    }

    private function checklist($jobSeeker, $resume, array $candidateSkills, $missingKeywords, string $profileText): array
    {
        $hasNumbers = preg_match('/\d+|%/', $profileText) === 1;
        $hasProjects = Str::contains($profileText, [' project ', ' projects ', ' portfolio ', ' github ', ' deployed ']);
        $hasExperienceDetails = $jobSeeker->experiences->isNotEmpty()
            || Str::length((string) $jobSeeker->experience) > 80;

        return [
            [
                'key' => 'resume_uploaded',
                'label' => 'Upload a PDF resume',
                'complete' => (bool) $resume,
                'impact' => 'Required for AI matching and application scoring.',
            ],
            [
                'key' => 'skills_present',
                'label' => 'Add a clear skills section',
                'complete' => count($candidateSkills) >= 4,
                'impact' => 'Use comma-separated skills like React, Laravel, MySQL, REST API.',
            ],
            [
                'key' => 'target_keywords',
                'label' => 'Cover target job keywords',
                'complete' => $missingKeywords->count() <= 3,
                'impact' => 'Add honest missing keywords that match your experience.',
            ],
            [
                'key' => 'headline_summary',
                'label' => 'Write a strong headline/about summary',
                'complete' => filled($jobSeeker->headline) && Str::length((string) $jobSeeker->about) >= 120,
                'impact' => 'Mention role, tech stack, and the kind of work you do.',
            ],
            [
                'key' => 'experience_detail',
                'label' => 'Add detailed experience',
                'complete' => $hasExperienceDetails,
                'impact' => 'Include responsibilities, tools, and outcomes.',
            ],
            [
                'key' => 'measurable_results',
                'label' => 'Use measurable achievements',
                'complete' => $hasNumbers,
                'impact' => 'Add numbers like 20%, 3 projects, 5 APIs, or 2 dashboards.',
            ],
            [
                'key' => 'projects',
                'label' => 'Mention projects or portfolio work',
                'complete' => $hasProjects,
                'impact' => 'Projects help recruiters verify practical ability.',
            ],
        ];
    }

    private function score(array $checklist, array $candidateSkills, $targetSkills, string $profileText, bool $hasResume): int
    {
        $checklistScore = collect($checklist)->where('complete', true)->count() / count($checklist) * 55;
        $coverage = $targetSkills->count() > 0
            ? min(1, count($candidateSkills) / min(12, $targetSkills->count())) * 25
            : min(1, count($candidateSkills) / 6) * 25;
        $textQuality = min(20, (Str::length($profileText) / 600) * 20);
        $resumeBonus = $hasResume ? 0 : -10;

        return (int) max(0, min(100, round($checklistScore + $coverage + $textQuality + $resumeBonus)));
    }

    private function suggestions($resume, array $candidateSkills, $missingKeywords, string $profileText, $applications): array
    {
        $suggestions = [];

        if (!$resume) {
            $suggestions[] = [
                'type' => 'critical',
                'title' => 'Upload your resume first',
                'body' => 'Applications and AI matching work best after a PDF resume is uploaded.',
            ];
        }

        if (count($candidateSkills) < 4) {
            $suggestions[] = [
                'type' => 'skills',
                'title' => 'Add more specific skills',
                'body' => 'Add your real tools and technologies. Example: React, Laravel, PHP, MySQL, REST API.',
            ];
        }

        if ($missingKeywords->isNotEmpty()) {
            $keywords = $missingKeywords->pluck('skill')->take(5)->implode(', ');
            $suggestions[] = [
                'type' => 'keywords',
                'title' => 'Add missing target keywords',
                'body' => 'Your target jobs mention these skills often: ' . $keywords . '. Add only the ones you actually know.',
            ];
        }

        if (preg_match('/\d+|%/', $profileText) !== 1) {
            $suggestions[] = [
                'type' => 'impact',
                'title' => 'Make achievements measurable',
                'body' => 'Replace vague lines with measurable work like “Built 5 REST APIs” or “Improved page load time by 30%”.',
            ];
        }

        if (!Str::contains($profileText, [' project ', ' projects ', ' portfolio ', ' github ', ' deployed '])) {
            $suggestions[] = [
                'type' => 'projects',
                'title' => 'Add projects or portfolio evidence',
                'body' => 'Include 2-3 projects with tech stack, your role, and a short result.',
            ];
        }

        if ($applications->where('final_score', '>', 0)->avg('final_score') < 50 && $applications->isNotEmpty()) {
            $suggestions[] = [
                'type' => 'applications',
                'title' => 'Target closer-fit jobs',
                'body' => 'Your recent application scores are low. Use Recommended Jobs and Job Alerts to apply where your skills match better.',
            ];
        }

        return $suggestions;
    }

    private function applicationGaps($applications): array
    {
        return $applications
            ->take(6)
            ->map(fn ($application) => [
                'application_id' => $application->id,
                'job_title' => $application->jobPosting?->title,
                'company' => $application->jobPosting?->company?->name,
                'final_score' => $application->final_score,
                'missing_skills' => $application->skillGaps
                    ->pluck('missing_skill')
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }

    private function profileText($jobSeeker): string
    {
        return Str::of(collect([
            $jobSeeker->headline,
            $jobSeeker->about,
            $jobSeeker->experience,
            $jobSeeker->resume?->extracted_text,
        ])
            ->merge($jobSeeker->experiences->flatMap(fn ($experience) => [
                $experience->title,
                $experience->company,
                $experience->description,
            ]))
            ->filter()
            ->implode(' '))
            ->lower()
            ->replaceMatches('/[^a-z0-9%+#.]+/', ' ')
            ->prepend(' ')
            ->append(' ')
            ->toString();
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

    private function level(int $score): string
    {
        if ($score >= 80) {
            return 'Strong';
        }

        if ($score >= 60) {
            return 'Good';
        }

        if ($score >= 40) {
            return 'Needs work';
        }

        return 'Incomplete';
    }
}
