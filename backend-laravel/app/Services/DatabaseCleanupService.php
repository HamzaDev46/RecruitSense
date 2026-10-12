<?php

namespace App\Services;

use App\Models\AdminSetting;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\Company;
use App\Models\Connection;
use App\Models\ContentReport;
use App\Models\Conversation;
use App\Models\JobAlert;
use App\Models\JobExperience;
use App\Models\JobPosting;
use App\Models\JobSeeker;
use App\Models\Message;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostImpression;
use App\Models\PostLike;
use App\Models\PostMedia;
use App\Models\ProfileView;
use App\Models\QuizQuestion;
use App\Models\QuizResponse;
use App\Models\Resume;
use App\Models\SavedJob;
use App\Models\SearchAppearance;
use App\Models\SkillGap;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class DatabaseCleanupService
{
    /**
     * Delete all non-admin user accounts and their associated test records,
     * while preserving the administrator account.
     */
    public static function cleanNonAdminAccounts(): array
    {
        $deletedCounts = [];

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // 1. Identify non-admin users
            $nonAdminUsers = User::where('role', '!=', 'admin')->get();
            $nonAdminUserIds = $nonAdminUsers->pluck('id')->toArray();
            $deletedCounts['users_deleted'] = count($nonAdminUserIds);

            if (!empty($nonAdminUserIds)) {
                // 2. Identify JobSeekers and Companies to delete
                $jobSeekerIds = JobSeeker::whereIn('user_id', $nonAdminUserIds)->pluck('id')->toArray();
                $companyIds = Company::whereIn('user_id', $nonAdminUserIds)->pluck('id')->toArray();
                $jobPostingIds = JobPosting::whereIn('company_id', $companyIds)->pluck('id')->toArray();
                $applicationIds = Application::whereIn('job_seeker_id', $jobSeekerIds)
                    ->orWhereIn('job_id', $jobPostingIds)
                    ->pluck('id')
                    ->toArray();

                // 3. Delete Application Sub-relations
                if (!empty($applicationIds)) {
                    SkillGap::whereIn('application_id', $applicationIds)->delete();
                    QuizResponse::whereIn('application_id', $applicationIds)->delete();
                    $deletedCounts['applications'] = Application::whereIn('id', $applicationIds)->delete();
                }

                // 4. Delete JobSeeker Data
                if (!empty($jobSeekerIds)) {
                    Resume::whereIn('job_seeker_id', $jobSeekerIds)->delete();
                    SavedJob::whereIn('job_seeker_id', $jobSeekerIds)->delete();
                    JobExperience::whereIn('job_seeker_id', $jobSeekerIds)->delete();
                    $deletedCounts['job_seekers'] = JobSeeker::whereIn('id', $jobSeekerIds)->delete();
                }

                JobAlert::whereIn('user_id', $nonAdminUserIds)->delete();
                SearchAppearance::whereIn('profile_user_id', $nonAdminUserIds)
                    ->orWhereIn('searcher_user_id', $nonAdminUserIds)
                    ->delete();

                // 5. Delete Company & Job Data
                if (!empty($companyIds)) {
                    QuizQuestion::whereIn('company_id', $companyIds)->delete();
                    if (!empty($jobPostingIds)) {
                        $deletedCounts['job_postings'] = JobPosting::whereIn('id', $jobPostingIds)->delete();
                    }
                    $deletedCounts['companies'] = Company::whereIn('id', $companyIds)->delete();
                }

                // 6. Delete Social & Messaging Data
                $postIds = Post::whereIn('user_id', $nonAdminUserIds)->pluck('id')->toArray();
                if (!empty($postIds)) {
                    PostMedia::whereIn('post_id', $postIds)->delete();
                    PostLike::whereIn('post_id', $postIds)->delete();
                    PostComment::whereIn('post_id', $postIds)->delete();
                    PostImpression::whereIn('post_id', $postIds)->delete();
                    Post::whereIn('id', $postIds)->delete();
                }

                PostLike::whereIn('user_id', $nonAdminUserIds)->delete();
                PostComment::whereIn('user_id', $nonAdminUserIds)->delete();
                PostImpression::whereIn('viewer_user_id', $nonAdminUserIds)->delete();
                Connection::whereIn('requester_id', $nonAdminUserIds)->orWhereIn('receiver_id', $nonAdminUserIds)->delete();
                Message::whereIn('sender_id', $nonAdminUserIds)->delete();
                Conversation::whereIn('user_one_id', $nonAdminUserIds)->orWhereIn('user_two_id', $nonAdminUserIds)->delete();
                AppNotification::whereIn('user_id', $nonAdminUserIds)->orWhereIn('actor_id', $nonAdminUserIds)->delete();
                ProfileView::whereIn('profile_user_id', $nonAdminUserIds)->orWhereIn('viewer_user_id', $nonAdminUserIds)->delete();
                ContentReport::whereIn('reporter_id', $nonAdminUserIds)->orWhereIn('reported_user_id', $nonAdminUserIds)->delete();
                UserBlock::whereIn('blocker_id', $nonAdminUserIds)->orWhereIn('blocked_id', $nonAdminUserIds)->delete();

                // 7. Delete Personal Access Tokens & Sessions
                DB::table('personal_access_tokens')->whereIn('tokenable_id', $nonAdminUserIds)->delete();

                // 8. Delete Non-Admin Users
                User::whereIn('id', $nonAdminUserIds)->delete();
            }

            // 9. Ensure at least one active Admin exists
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount === 0) {
                User::create([
                    'name' => 'System Administrator',
                    'email' => 'admin@recruitsense.com',
                    'password' => Hash::make('password123'),
                    'role' => 'admin',
                    'email_verified_at' => now(),
                    'account_status' => 'active',
                ]);
                $deletedCounts['admin_recreated'] = 'admin@recruitsense.com';
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $remainingUsers = User::select('id', 'name', 'email', 'role')->get();

            return [
                'status' => 'success',
                'message' => 'All non-admin user accounts successfully deleted.',
                'deleted_summary' => $deletedCounts,
                'remaining_admins' => $remainingUsers,
            ];

        } catch (\Throwable $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            Log::error('Database cleanup error: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }
}
