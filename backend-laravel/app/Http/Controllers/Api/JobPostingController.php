<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobPostingController extends Controller
{
    /**
     * List all job postings (public — job seekers browse)
     */
    public function index()
    {
        $jobs = JobPosting::with('company')->latest()->get();
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

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'required_skills' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = JobPosting::create([
            'company_id' => $user->company->id,
            'title' => $request->title,
            'description' => $request->description,
            'required_skills' => $request->required_skills,
        ]);

        return response()->json([
            'message' => 'Job posted successfully',
            'job' => $job,
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

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'required_skills' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job->update($request->only(['title', 'description', 'required_skills']));

        return response()->json([
            'message' => 'Job updated successfully',
            'job' => $job,
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

        $jobs = JobPosting::where('company_id', $user->company->id)->latest()->get();

        return response()->json($jobs);
    }
}