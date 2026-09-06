<?php

namespace Database\Seeders;

use App\Models\AdminSetting;
use App\Models\Company;
use App\Models\JobPosting;
use App\Models\JobSeeker;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Admin Settings
        $defaultSettings = [
            'allow_registrations' => true,
            'require_email_verification' => false,
            'auto_verify_companies' => true,
            'auto_screening_enabled' => true,
            'max_applications_per_day' => 10,
            'site_name' => 'RecruitSense AI',
            'support_email' => 'support@recruitsense.com',
        ];

        foreach ($defaultSettings as $key => $value) {
            AdminSetting::updateOrCreate(
                ['key' => $key],
                ['value' => json_encode($value)]
            );
        }

        // 2. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@recruitsense.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
                'account_status' => 'active',
            ]
        );

        // 3. Demo Company User
        $companyUser = User::firstOrCreate(
            ['email' => 'techcorp@recruitsense.com'],
            [
                'name' => 'TechCorp Solutions',
                'password' => Hash::make('password123'),
                'role' => 'company',
                'email_verified_at' => now(),
                'account_status' => 'active',
            ]
        );

        $company = Company::firstOrCreate(
            ['user_id' => $companyUser->id],
            [
                'name' => 'TechCorp Solutions',
                'industry' => 'Software & Artificial Intelligence',
                'location' => 'Singapore / Remote',
                'website' => 'https://techcorp.example.com',
                'description' => 'TechCorp Solutions builds cutting-edge enterprise AI platforms.',
                'verification_status' => 'verified',
            ]
        );

        // 4. Demo JobSeeker User
        $candidateUser = User::firstOrCreate(
            ['email' => 'hamza@recruitsense.com'],
            [
                'name' => 'Hamza Developer',
                'password' => Hash::make('password123'),
                'role' => 'jobseeker',
                'email_verified_at' => now(),
                'account_status' => 'active',
            ]
        );

        JobSeeker::firstOrCreate(
            ['user_id' => $candidateUser->id],
            [
                'headline' => 'Full-Stack Software Engineer & AI Enthusiast',
                'skills' => 'React, Laravel, Python, Machine Learning, PostgreSQL, REST APIs',
                'location' => 'Remote / Asia',
                'about' => 'Experienced software engineer specialized in full stack web development and intelligent matching systems.',
                'experience' => '3 years',
            ]
        );

        // 5. Demo Job Postings
        $job = JobPosting::firstOrCreate(
            ['company_id' => $company->id, 'title' => 'Senior Full-Stack AI Engineer'],
            [
                'description' => 'We are looking for a Senior Full-Stack Engineer with solid experience in React, Laravel, Python, and AI integrations.',
                'required_skills' => 'React, Laravel, Python, PostgreSQL, Machine Learning, REST APIs',
                'job_type' => 'Full-time',
                'work_mode' => 'remote',
                'location' => 'Remote',
                'experience_level' => 'Senior',
                'salary_min' => 4500,
                'salary_max' => 7500,
                'status' => 'active',
            ]
        );

        // 6. Demo Quiz Questions
        QuizQuestion::firstOrCreate(
            ['company_id' => $company->id, 'question_text' => 'A critical production bug is detected right after deployment. What is your first step?'],
            [
                'category' => 'Problem solving',
                'options' => [
                    'Immediately notify the team, assess impact, and consider rolling back or hotfixing',
                    'Ignore it until the next scheduled sprint release',
                    'Blame the QA team',
                    'Delete the deployment logs',
                ],
                'correct_answer' => 'Immediately notify the team, assess impact, and consider rolling back or hotfixing',
            ]
        );

        QuizQuestion::firstOrCreate(
            ['company_id' => $company->id, 'question_text' => 'How do you communicate a technical obstacle to non-technical stakeholders?'],
            [
                'category' => 'Communication',
                'options' => [
                    'Use plain business language focusing on impact, timeline, and proposed solutions',
                    'Send them raw SQL and stack traces',
                    'Avoid mentioning the obstacle',
                    'Tell them it is too complicated for them to understand',
                ],
                'correct_answer' => 'Use plain business language focusing on impact, timeline, and proposed solutions',
            ]
        );
    }
}
