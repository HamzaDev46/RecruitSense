<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPosting;
use App\Models\SavedJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RecommendedJobController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('jobSeeker.resume', 'jobSeeker.experiences');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can view recommended jobs'], 403);
        }

        $jobSeeker = $user->jobSeeker;
        $jobs = JobPosting::with('company')->latest()->get();
        $candidateSkills = $this->detectCandidateSkills($jobSeeker, $this->skillCatalog($jobs));
        $savedJobIds = SavedJob::where('job_seeker_id', $jobSeeker->id)->pluck('job_id')->all();
        $appliedJobIds = Application::where('job_seeker_id', $jobSeeker->id)
            ->whereIn('status', ['pending', 'shortlisted', 'rejected'])
            ->pluck('job_id')
            ->all();

        $recommendations = $jobs
            ->map(function ($job) use ($candidateSkills, $savedJobIds, $appliedJobIds) {
                $requiredSkills = $this->normalizeSkills($job->required_skills);
                $matchedSkills = $this->matchedSkills($candidateSkills, $requiredSkills);
                $missingSkills = array_values(array_diff($requiredSkills, $matchedSkills));
                $score = count($requiredSkills) > 0
                    ? (int) round((count($matchedSkills) / count($requiredSkills)) * 100)
                    : 0;

                return [
                    'job' => $job,
                    'match_score' => $score,
                    'matched_skills' => $matchedSkills,
                    'missing_skills' => $missingSkills,
                    'required_skills' => $requiredSkills,
                    'is_saved' => in_array($job->id, $savedJobIds, true),
                    'has_applied' => in_array($job->id, $appliedJobIds, true),
                ];
            })
            ->sortByDesc('match_score')
            ->values();

        return response()->json([
            'candidate_skills' => $candidateSkills,
            'recommendations' => $recommendations,
        ]);
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

    private function detectCandidateSkills($jobSeeker, array $skillCatalog): array
    {
        $directSkills = $this->normalizeSkills(implode(',', [
            $jobSeeker->skills,
            $jobSeeker->resume?->parsed_skills,
        ]));
        $profileText = collect([
            $jobSeeker->headline,
            $jobSeeker->about,
            $jobSeeker->experience,
            $jobSeeker->resume?->extracted_text,
        ])
            ->merge($jobSeeker->experiences->flatMap(fn ($experience) => [
                $experience->title,
                $experience->company,
                $experience->employment_type,
                $experience->description,
            ]))
            ->filter()
            ->implode(' ');
        $normalizedText = $this->normalizeText($profileText);
        $detectedSkills = collect($skillCatalog)
            ->filter(fn ($skill) => $this->textHasSkill($normalizedText, $skill))
            ->values()
            ->all();

        return collect($directSkills)
            ->merge($detectedSkills)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    private function skillCatalog($jobs): array
    {
        $commonSkills = [
            'api',
            'bootstrap',
            'communication',
            'crm',
            'css',
            'customer service',
            'excel',
            'flask',
            'html',
            'javascript',
            'laravel',
            'ms office',
            'mysql',
            'node js',
            'php',
            'python',
            'react',
            'rest api',
            'tailwind',
        ];

        return $jobs
            ->flatMap(fn ($job) => $this->normalizeSkills($job->required_skills))
            ->merge($commonSkills)
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeText(?string $text): string
    {
        return Str::of($text ?: '')
            ->lower()
            ->replaceMatches('/[^a-z0-9+#.]+/', ' ')
            ->replace('.', ' ')
            ->replaceMatches('/\\s+/', ' ')
            ->trim()
            ->toString();
    }

    private function textHasSkill(string $normalizedText, string $skill): bool
    {
        if ($normalizedText === '') {
            return false;
        }

        $haystack = ' ' . $normalizedText . ' ';

        return collect($this->skillAliases($skill))
            ->contains(function ($alias) use ($haystack) {
                $needle = $this->normalizeText($alias);

                return $needle !== '' && Str::contains($haystack, ' ' . $needle . ' ');
            });
    }

    private function skillAliases(string $skill): array
    {
        return match ($skill) {
            'react' => ['react', 'reactjs', 'react js', 'react.js'],
            'javascript' => ['javascript', 'js'],
            'node js' => ['node js', 'nodejs', 'node.js'],
            'rest api' => ['rest api', 'restful api', 'rest apis'],
            'ms office' => ['ms office', 'microsoft office'],
            'mysql' => ['mysql', 'my sql'],
            default => [$skill],
        };
    }

    private function matchedSkills(array $candidateSkills, array $requiredSkills): array
    {
        return collect($requiredSkills)
            ->filter(function ($required) use ($candidateSkills) {
                return collect($candidateSkills)->contains(function ($candidate) use ($required) {
                    return $candidate === $required
                        || Str::contains($candidate, $required)
                        || Str::contains($required, $candidate);
                });
            })
            ->values()
            ->all();
    }
}
