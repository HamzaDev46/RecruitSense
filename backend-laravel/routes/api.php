<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobPostingController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\NetworkController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SavedJobController;
use App\Http\Controllers\Api\JobSeekerDashboardController;
use App\Http\Controllers\Api\RecommendedJobController;
use App\Http\Controllers\Api\JobAlertController;
use App\Http\Controllers\Api\ResumeInsightController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\AccountSettingsController;

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
    Route::get('/dashboard/jobseeker', [JobSeekerDashboardController::class, 'summary']);
    Route::get('/settings', [AccountSettingsController::class, 'show']);
    Route::put('/settings/account', [AccountSettingsController::class, 'updateAccount']);
    Route::put('/settings/password', [AccountSettingsController::class, 'updatePassword']);
    Route::put('/settings/preferences', [AccountSettingsController::class, 'updatePreferences']);
    Route::delete('/settings/account', [AccountSettingsController::class, 'destroyAccount']);

    // Job seeker profile routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/profile/viewers', [ProfileController::class, 'viewers']);
    Route::get('/profiles/{user}', [ProfileController::class, 'showByUser']);
    Route::get('/profiles/{user}/posts', [PostController::class, 'userPosts']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/experiences', [ProfileController::class, 'storeExperience']);
    Route::put('/profile/experiences/{experience}', [ProfileController::class, 'updateExperience']);
    Route::delete('/profile/experiences/{experience}', [ProfileController::class, 'destroyExperience']);

    // Network routes
    Route::get('/network/summary', [NetworkController::class, 'summary']);
    Route::get('/network/suggestions', [NetworkController::class, 'suggestions']);
    Route::get('/network/search', [NetworkController::class, 'search']);
    Route::get('/network/invitations', [NetworkController::class, 'invitations']);
    Route::get('/network/connections', [NetworkController::class, 'connections']);
    Route::get('/network/status/{user}', [NetworkController::class, 'status']);
    Route::post('/network/connect/{user}', [NetworkController::class, 'connect']);
    Route::post('/network/accept/{connection}', [NetworkController::class, 'accept']);
    Route::post('/network/reject/{connection}', [NetworkController::class, 'reject']);
    Route::delete('/network/remove/{connection}', [NetworkController::class, 'remove']);

    // Saved job routes
    Route::get('/saved-jobs', [SavedJobController::class, 'index']);
    Route::post('/saved-jobs/{job}', [SavedJobController::class, 'store']);
    Route::delete('/saved-jobs/{job}', [SavedJobController::class, 'destroy']);

    // Recommended job routes
    Route::get('/recommended-jobs', [RecommendedJobController::class, 'index']);

    // Job alert routes
    Route::get('/job-alerts', [JobAlertController::class, 'index']);
    Route::post('/job-alerts', [JobAlertController::class, 'store']);
    Route::put('/job-alerts/{jobAlert}', [JobAlertController::class, 'update']);
    Route::delete('/job-alerts/{jobAlert}', [JobAlertController::class, 'destroy']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Messaging routes
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
    Route::post('/messages/start/{user}', [MessageController::class, 'start']);
    Route::get('/messages/conversations/{conversation}', [MessageController::class, 'show']);
    Route::post('/messages/conversations/{conversation}', [MessageController::class, 'store']);
    Route::put('/messages/{message}', [MessageController::class, 'update']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);

    // Social feed routes
    Route::get('/posts/feed', [PostController::class, 'feed']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    Route::post('/posts/{post}/like', [PostController::class, 'like']);
    Route::delete('/posts/{post}/like', [PostController::class, 'unlike']);
    Route::post('/posts/{post}/comments', [PostController::class, 'comment']);
    Route::delete('/post-comments/{comment}', [PostController::class, 'deleteComment']);

    // Company job routes
    Route::get('/my-jobs', [JobPostingController::class, 'myJobs']);
    Route::post('/jobs', [JobPostingController::class, 'store']);
    Route::put('/jobs/{id}', [JobPostingController::class, 'update']);
    Route::delete('/jobs/{id}', [JobPostingController::class, 'destroy']);

    // Application routes
    Route::post('/jobs/{jobId}/apply', [ApplicationController::class, 'apply']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::get('/jobs/{jobId}/applicants', [ApplicationController::class, 'jobApplicants']);
    Route::post('/applications/{application}/withdraw', [ApplicationController::class, 'withdraw']);
    Route::post('/applications/{applicationId}/shortlist', [ApplicationController::class, 'shortlist']);
    Route::post('/applications/{applicationId}/reject', [ApplicationController::class, 'reject']);

    // Resume routes
    Route::post('/resume/upload', [ResumeController::class, 'upload']);
    Route::get('/my-resume', [ResumeController::class, 'myResume']);
    Route::get('/resume-insights', [ResumeInsightController::class, 'show']);
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
