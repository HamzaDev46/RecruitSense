<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobAlert;
use App\Models\JobPosting;
use App\Services\JobAlertMatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobAlertController extends Controller
{
    public function __construct(private JobAlertMatcher $matcher)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user()->load('jobSeeker.resume');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can manage job alerts'], 403);
        }

        $jobs = JobPosting::with('company')->latest()->limit(100)->get();
        $alerts = JobAlert::where('user_id', $user->id)->latest()->get();

        return response()->json([
            'alerts' => $alerts->map(fn ($alert) => $this->alertPayload($alert, $jobs))->values(),
            'profile_skills' => $user->jobSeeker->skills,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user()->load('jobSeeker.resume');

        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can create job alerts'], 403);
        }

        $validator = $this->validator($request);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (!$this->hasMatchingSignal($data, $user)) {
            return response()->json([
                'message' => 'Add a keyword, skills, or profile skills before creating an alert',
            ], 422);
        }

        $alert = JobAlert::create([
            'user_id' => $user->id,
            'keyword' => $data['keyword'] ?? null,
            'skills' => $data['skills'] ?? null,
            'location' => $data['location'] ?? null,
            'min_match_score' => $data['min_match_score'] ?? 50,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $jobs = JobPosting::with('company')->latest()->limit(100)->get();

        return response()->json([
            'message' => 'Job alert created successfully',
            'alert' => $this->alertPayload($alert, $jobs),
        ], 201);
    }

    public function update(Request $request, JobAlert $jobAlert)
    {
        $user = $request->user()->load('jobSeeker.resume');

        if ($user->role !== 'jobseeker' || $jobAlert->user_id !== $user->id) {
            return response()->json(['message' => 'Job alert not found'], 404);
        }

        $validator = $this->validator($request, true);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $candidate = array_merge($jobAlert->only([
            'keyword',
            'skills',
            'location',
            'min_match_score',
            'is_active',
        ]), $data);

        if (!$this->hasMatchingSignal($candidate, $user)) {
            return response()->json([
                'message' => 'Add a keyword, skills, or profile skills before saving this alert',
            ], 422);
        }

        $jobAlert->update($data);

        $jobs = JobPosting::with('company')->latest()->limit(100)->get();

        return response()->json([
            'message' => 'Job alert updated successfully',
            'alert' => $this->alertPayload($jobAlert->fresh(), $jobs),
        ]);
    }

    public function destroy(Request $request, JobAlert $jobAlert)
    {
        if ($request->user()->role !== 'jobseeker' || $jobAlert->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Job alert not found'], 404);
        }

        $jobAlert->delete();

        return response()->json(['message' => 'Job alert deleted successfully']);
    }

    private function validator(Request $request, bool $partial = false)
    {
        $rule = $partial ? 'sometimes' : 'nullable';

        return Validator::make($request->all(), [
            'keyword' => [$rule, 'nullable', 'string', 'max:255'],
            'skills' => [$rule, 'nullable', 'string', 'max:1000'],
            'location' => [$rule, 'nullable', 'string', 'max:255'],
            'min_match_score' => [$partial ? 'sometimes' : 'nullable', 'integer', 'min:0', 'max:100'],
            'is_active' => [$partial ? 'sometimes' : 'nullable', 'boolean'],
        ]);
    }

    private function hasMatchingSignal(array $data, $user): bool
    {
        return filled($data['keyword'] ?? null)
            || filled($data['skills'] ?? null)
            || filled($user->jobSeeker?->skills)
            || filled($user->jobSeeker?->resume?->parsed_skills);
    }

    private function alertPayload(JobAlert $alert, $jobs): array
    {
        $matches = $jobs
            ->map(function ($job) use ($alert) {
                $match = $this->matcher->match($alert, $job);

                return [
                    'job' => $job,
                    'match_score' => $match['score'],
                    'matched_skills' => $match['matched_skills'],
                    'keyword_matched' => $match['keyword_matched'],
                ];
            })
            ->filter(fn ($match) => $match['match_score'] >= $alert->min_match_score && $match['match_score'] > 0)
            ->sortByDesc('match_score')
            ->values();

        return [
            'id' => $alert->id,
            'keyword' => $alert->keyword,
            'skills' => $alert->skills,
            'location' => $alert->location,
            'min_match_score' => $alert->min_match_score,
            'is_active' => $alert->is_active,
            'last_notified_at' => $alert->last_notified_at?->toISOString(),
            'created_at' => $alert->created_at?->toISOString(),
            'updated_at' => $alert->updated_at?->toISOString(),
            'matched_jobs_count' => $matches->count(),
            'latest_matches' => $matches->take(3)->values(),
        ];
    }
}
