<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Models\SavedJob;
use Illuminate\Http\Request;

class SavedJobController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can view saved jobs'], 403);
        }

        $savedJobs = SavedJob::with('jobPosting.company')
            ->where('job_seeker_id', $user->jobSeeker->id)
            ->latest()
            ->get()
            ->map(fn ($savedJob) => $this->savedJobPayload($savedJob));

        return response()->json($savedJobs);
    }

    public function store(Request $request, JobPosting $job)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can save jobs'], 403);
        }

        $savedJob = SavedJob::firstOrCreate([
            'job_seeker_id' => $user->jobSeeker->id,
            'job_id' => $job->id,
        ]);

        return response()->json([
            'message' => $savedJob->wasRecentlyCreated ? 'Job saved' : 'Job already saved',
            'saved_job' => $this->savedJobPayload($savedJob->fresh('jobPosting.company')),
        ], $savedJob->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, JobPosting $job)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can unsave jobs'], 403);
        }

        SavedJob::where('job_seeker_id', $user->jobSeeker->id)
            ->where('job_id', $job->id)
            ->delete();

        return response()->json(['message' => 'Job removed from saved jobs']);
    }

    private function savedJobPayload(SavedJob $savedJob): array
    {
        return [
            'id' => $savedJob->id,
            'saved_at' => $savedJob->created_at?->toISOString(),
            'job' => $savedJob->jobPosting,
        ];
    }
}
