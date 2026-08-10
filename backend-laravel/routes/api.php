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
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\ContentReportController;
use App\Http\Controllers\Api\CompanyDashboardController;
use App\Http\Controllers\Api\CompanyProfileController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/google', [AuthController::class, 'googleAuth']);

// Public job routes — job seekers can browse without login
Route::get('/jobs', [JobPostingController::class, 'index']);
Route::get('/jobs/{id}', [JobPostingController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard/jobseeker', [JobSeekerDashboardController::class, 'summary']);
    Route::get('/dashboard/company', [CompanyDashboardController::class, 'summary']);
    Route::get('/company/activity-log', [CompanyDashboardController::class, 'activityLog']);
    Route::get('/company/profile', [CompanyProfileController::class, 'show']);
    Route::post('/company/profile', [CompanyProfileController::class, 'update']);
    Route::get('/search/global', [GlobalSearchController::class, 'index']);
    Route::post('/reports', [ContentReportController::class, 'store']);
    Route::get('/settings', [AccountSettingsController::class, 'show']);
    Route::put('/settings/account', [AccountSettingsController::class, 'updateAccount']);
    Route::put('/settings/password', [AccountSettingsController::class, 'updatePassword']);
    Route::put('/settings/preferences', [AccountSettingsController::class, 'updatePreferences']);
    Route::delete('/settings/account', [AccountSettingsController::class, 'destroyAccount']);
    Route::get('/blocks', [AccountSettingsController::class, 'blockedUsers']);
    Route::post('/blocks/{user}', [AccountSettingsController::class, 'blockUser']);
    Route::delete('/blocks/{user}', [AccountSettingsController::class, 'unblockUser']);

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
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    Route::post('/posts/{post}/repost', [PostController::class, 'repost']);
    Route::delete('/posts/{post}/repost', [PostController::class, 'unrepost']);
    Route::post('/posts/{post}/like', [PostController::class, 'like']);
    Route::delete('/posts/{post}/like', [PostController::class, 'unlike']);
    Route::post('/posts/{post}/comments', [PostController::class, 'comment']);
    Route::put('/post-comments/{comment}', [PostController::class, 'updateComment']);
    Route::delete('/post-comments/{comment}', [PostController::class, 'deleteComment']);

    // Company job routes
    Route::get('/my-jobs', [JobPostingController::class, 'myJobs']);
    Route::post('/jobs', [JobPostingController::class, 'store']);
    Route::put('/jobs/{id}', [JobPostingController::class, 'update']);
    Route::delete('/jobs/{id}', [JobPostingController::class, 'destroy']);

    // Application routes
    Route::post('/jobs/{jobId}/apply', [ApplicationController::class, 'apply']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::get('/company/applicants', [ApplicationController::class, 'companyApplicants']);
    Route::get('/jobs/{jobId}/applicants', [ApplicationController::class, 'jobApplicants']);
    Route::get('/applications/{application}/resume', [ApplicationController::class, 'resume']);
    Route::post('/applications/{application}/withdraw', [ApplicationController::class, 'withdraw']);
    Route::post('/applications/{application}/interview', [ApplicationController::class, 'scheduleInterview']);
    Route::put('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
    Route::put('/applications/{application}/review', [ApplicationController::class, 'saveCompanyReview']);
    Route::put('/applications/{application}/interview-feedback', [ApplicationController::class, 'saveInterviewFeedback']);
    Route::post('/applications/{applicationId}/shortlist', [ApplicationController::class, 'shortlist']);
    Route::post('/applications/{applicationId}/reject', [ApplicationController::class, 'reject']);

    // Resume routes
    Route::post('/resume/upload', [ResumeController::class, 'upload']);
    Route::get('/my-resume', [ResumeController::class, 'myResume']);
    Route::get('/resume-insights', [ResumeInsightController::class, 'show']);
    Route::delete('/resume', [ResumeController::class, 'destroy']);
    
    // Quiz routes — Company manages questions
    Route::post('/quiz-questions', [QuizController::class, 'store']);
    Route::post('/quiz-questions/generate', [QuizController::class, 'generate']);
    Route::get('/my-quiz-questions', [QuizController::class, 'myQuestions']);
    Route::put('/quiz-questions/{id}', [QuizController::class, 'update']);
    Route::delete('/quiz-questions/{id}', [QuizController::class, 'destroy']);

    // Quiz routes — Job Seeker takes quiz
    Route::get('/companies/{companyId}/quiz-questions', [QuizController::class, 'getQuestionsForCompany']);
    Route::post('/applications/{applicationId}/submit-quiz', [QuizController::class, 'submitAnswers']);
});
