<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resume;
use App\Support\UserCache;
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
            'resume' => 'required_without:resumes|file|mimes:pdf|max:15360', // max 15MB, PDF only
            'resumes' => 'required_without:resume|array|min:1|max:10',
            'resumes.*' => 'file|mimes:pdf|max:10240',
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

        // Store new file (either single merged resume or primary file from resumes array)
        $uploadedFile = $request->file('resume') ?? ($request->file('resumes')[0] ?? null);
        if (!$uploadedFile) {
            return response()->json(['message' => 'No resume file provided'], 422);
        }

        $path = $uploadedFile->store('resumes', 'public');

        $resume = Resume::create([
            'job_seeker_id' => $user->jobSeeker->id,
            'file_path' => $path,
        ]);
        UserCache::forgetProfile($user->id);

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
        UserCache::forgetProfile($user->id);

        return response()->json(['message' => 'Resume deleted successfully']);
    }

    /**
     * Preview logged-in job seeker's resume inline
     */
    public function preview(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'jobseeker' || !$user->jobSeeker) {
            return response()->json(['message' => 'Only job seekers can access this'], 403);
        }

        $resume = Resume::where('job_seeker_id', $user->jobSeeker->id)->first();
        if (!$resume || !Storage::disk('public')->exists($resume->file_path)) {
            return response()->json(['message' => 'No resume found'], 404);
        }

        $path = Storage::disk('public')->path($resume->file_path);
        $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'pdf';
        $mime = Storage::disk('public')->mimeType($resume->file_path) ?: 'application/pdf';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="my-resume.' . $ext . '"',
        ]);
    }
}
