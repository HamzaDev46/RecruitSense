<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobPostingController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\Api\QuizController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public job routes — job seekers can browse without login
Route::get('/jobs', [JobPostingController::class, 'index']);
Route::get('/jobs/{id}', [JobPostingController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Company job routes
    Route::get('/my-jobs', [JobPostingController::class, 'myJobs']);
    Route::post('/jobs', [JobPostingController::class, 'store']);
    Route::put('/jobs/{id}', [JobPostingController::class, 'update']);
    Route::delete('/jobs/{id}', [JobPostingController::class, 'destroy']);

    // Application routes
    Route::post('/jobs/{jobId}/apply', [ApplicationController::class, 'apply']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::get('/jobs/{jobId}/applicants', [ApplicationController::class, 'jobApplicants']);
    Route::post('/applications/{applicationId}/shortlist', [ApplicationController::class, 'shortlist']);
    Route::post('/applications/{applicationId}/reject', [ApplicationController::class, 'reject']);

    // Resume routes
    Route::post('/resume/upload', [ResumeController::class, 'upload']);
    Route::get('/my-resume', [ResumeController::class, 'myResume']);
    Route::delete('/resume', [ResumeController::class, 'destroy']);
    
    // Quiz routes — Company manages questions
    Route::post('/quiz-questions', [QuizController::class, 'store']);
    Route::get('/my-quiz-questions', [QuizController::class, 'myQuestions']);
    Route::put('/quiz-questions/{id}', [QuizController::class, 'update']);
    Route::delete('/quiz-questions/{id}', [QuizController::class, 'destroy']);

    // Quiz routes — Job Seeker takes quiz
    Route::get('/companies/{companyId}/quiz-questions', [QuizController::class, 'getQuestionsForCompany']);
    Route::post('/applications/{applicationId}/submit-quiz', [QuizController::class, 'submitAnswers']);
});