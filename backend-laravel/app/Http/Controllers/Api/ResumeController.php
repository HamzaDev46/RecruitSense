<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resume;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ResumeController extends Controller
{
    /**
     * Upload resume (job seeker only)
     */
    public function upload(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can upload resumes'], 403);
        }

        $validator = Validator::make($request->all(), [
            'resume' => 'required|file|mimes:pdf|max:5120', // max 5MB, PDF only
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Delete old resume if exists (one resume per job seeker)
        $existing = Resume::where('job_seeker_id', $user->jobSeeker->id)->first();
        if ($existing) {
            Storage::disk('public')->delete($existing->file_path);
            $existing->delete();
        }

        // Store new file
        $path = $request->file('resume')->store('resumes', 'public');

        $resume = Resume::create([
            'job_seeker_id' => $user->jobSeeker->id,
            'file_path' => $path,
        ]);

        return response()->json([
            'message' => 'Resume uploaded successfully',
            'resume' => $resume,
        ], 201);
    }

    /**
     * Get logged-in job seeker's resume
     */
    public function myResume(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can access this'], 403);
        }

        $resume = Resume::where('job_seeker_id', $user->jobSeeker->id)->first();

        if (!$resume) {
            return response()->json(['message' => 'No resume uploaded yet'], 404);
        }

        return response()->json($resume);
    }

    /**
     * Delete resume
     */
    public function destroy(Request $request)
    {
        $user = $request->user();
        $resume = Resume::where('job_seeker_id', $user->jobSeeker->id)->first();

        if (!$resume) {
            return response()->json(['message' => 'No resume found'], 404);
        }

        Storage::disk('public')->delete($resume->file_path);
        $resume->delete();

        return response()->json(['message' => 'Resume deleted successfully']);
    }
}