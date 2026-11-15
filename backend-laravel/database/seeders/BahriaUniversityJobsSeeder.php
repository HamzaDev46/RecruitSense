<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Company;
use App\Models\JobPosting;
use App\Models\JobSeeker;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BahriaUniversityJobsSeeder extends Seeder
{
    /**
     * Seeds Bahria University company account, the 4 jobs from the advertisement,
     * and candidate accounts with actual CV files from the "testing cvs" folder.
     */
    public function run(): void
    {
        $passwordHash = Hash::make('Bahria@2026');
        $candidatePasswordHash = Hash::make('Password@123');

        // =========================================================================
        // 1. COMPANY ACCOUNT: Bahria University (Islamabad Campus)
        // =========================================================================
        $bahriaUser = User::firstOrCreate(
            ['email' => 'hr.islamabad@bahria.edu.pk'],
            [
                'name' => 'Bahria University',
                'password' => $passwordHash,
                'role' => 'company',
                'email_verified_at' => now(),
                'account_status' => 'active',
            ]
        );

        $bahriaCompany = Company::firstOrCreate(
            ['user_id' => $bahriaUser->id],
            [
                'name' => 'Bahria University',
                'industry' => 'Education & EdTech',
                'description' => 'Bahria University is a Federally Chartered Public Sector University dedicated to academic excellence, high-impact research, and career development with modern campuses across Islamabad, Karachi, and Lahore.',
                'location' => 'Islamabad, Pakistan',
                'website' => 'https://bahria.edu.pk',
                'company_size' => '500+ employees (Enterprise)',
                'founded_year' => 2000,
                'verification_status' => 'verified',
                'contact_email' => 'hr.islamabad@bahria.edu.pk',
                'phone' => '+92 51 9260002',
                'dark_mode' => false,
                'notify_messages' => true,
                'notify_candidate_activity' => true,
                'notify_quiz_results' => true,
                'notify_post_activity' => true,
            ]
        );

        // =========================================================================
        // 2. THE 4 JOBS (From Official Advertisement)
        // =========================================================================
        $jobDefinitions = [
            'lab' => [
                'title' => 'Lab Assistant',
                'description' => "Bahria University invites applications for the appointment of Lab Assistant at Bahria University Islamabad Campus.\n\nQualifications & Experience:\n- BCS / BSc in Computer Science, IT, or relevant science field from an HEC recognized university.\n- Minimum 2 years' relevant experience as a Lab Assistant in any recognized organization or academic institution.\n\nKey Responsibilities:\n- Maintain computer and engineering laboratory equipment, networks, and software installations.\n- Assist faculty and students during lab sessions and practical coursework.\n- Ensure daily system backups, network connectivity, and operating system updates.\n- Maintain lab hardware inventory registers and equipment log sheets.",
                'required_skills' => 'BCS, BSc, Lab Management, Computer Hardware, Software Installation, System Maintenance, Networking, Student Support',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'mid',
                'location' => 'Bahria University Islamabad Campus',
                'salary_min' => 45000,
                'salary_max' => 65000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(30)->toDateString(),
                'status' => 'active',
                'folder' => 'lab Assisstant',
                'names' => [
                    'Muhammad Usman', 'Zeeshan Ali', 'Hamza Farooq', 'Bilal Siddiqui', 'Adeel Tariq',
                    'Saad Rehman', 'Farhan Ahmed', 'Kamran Khan', 'Usama Tahir', 'Danish Iqbal',
                ],
            ],
            'multimedia' => [
                'title' => 'Multimedia Operator',
                'description' => "Bahria University invites applications for the appointment of Multimedia Operator at Bahria University Islamabad Campus.\n\nQualifications & Experience:\n- Matric / equivalent qualification from a recognized board.\n- Minimum 3 years' relevant experience in operating audio-visual and multimedia equipment.\n\nKey Responsibilities:\n- Configure and manage multimedia projectors, sound systems, and video conference facilities in lecture halls and auditoriums.\n- Troubleshoot display connections, HDMI/VGA adapters, microphones, and classroom sound hardware.\n- Provide prompt technical support to faculty during academic lectures, conferences, and seminars.\n- Perform routine equipment checks and maintain AV storage inventory.",
                'required_skills' => 'Multimedia Operations, Projector Setup, Audio Visual, Sound Systems, Video Conferencing, Event Support, Technical Troubleshooting',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'mid',
                'location' => 'Bahria University Islamabad Campus',
                'salary_min' => 40000,
                'salary_max' => 55000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(30)->toDateString(),
                'status' => 'active',
                'folder' => 'Multimedia operator',
                'names' => [
                    'Tariq Mehmood', 'Rashid Minhas', 'Shahid Afridi', 'Naveed Akhtar', 'Sohail Abbas',
                    'Waseem Akram', 'Kashif Nisar', 'Junaid Jamshed', 'Shoaib Malik', 'Faisal Qureshi',
                    'Babar Azam', 'Rizwan Ahmed', 'Haris Rauf', 'Shaheen Shah', 'Asim Munir',
                    'Irfan Khan', 'Zubair Hassan', 'Noman Ali', 'Aamir Liaquat',
                ],
            ],
            'mali' => [
                'title' => 'Mali',
                'description' => "Bahria University invites applications for the appointment of Mali at Bahria University Islamabad Campus.\n\nQualifications & Experience:\n- Matric qualification.\n- Minimum 2 years' practical experience as Mali in any recognized organization, park, or educational campus.\n\nKey Responsibilities:\n- Maintain university lawns, flower beds, sports grounds, and botanical areas.\n- Undertake seasonal plantation, grass mowing, hedge trimming, and watering schedules.\n- Safely handle gardening tools, lawn mowers, fertilizers, and pest control treatments.\n- Keep campus outdoor premises green, clean, and well-landscaped.",
                'required_skills' => 'Gardening, Horticulture, Lawn Mowing, Plantation, Landscaping, Irrigation, Tool Handling, Campus Maintenance',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'junior',
                'location' => 'Bahria University Islamabad Campus',
                'salary_min' => 35000,
                'salary_max' => 45000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(30)->toDateString(),
                'status' => 'active',
                'folder' => 'Mali',
                'names' => [
                    'Ghulam Rasool', 'Muhammad Bashir', 'Allah Ditta', 'Barkat Ali', 'Subhan Din',
                ],
            ],
            'sweeper' => [
                'title' => 'Sweeper',
                'description' => "Bahria University invites applications for the appointment of Sweeper at Bahria University Islamabad Campus.\n\nQualifications & Experience:\n- Male: Preferably literate (basic ability to read campus signage).\n- Prior experience in janitorial, cleaning, and sanitization duties in institutions preferred.\n\nKey Responsibilities:\n- Perform daily sweeping, mopping, and vacuuming of academic corridors, classrooms, offices, and staircases.\n- Clean and disinfect washrooms and rest areas according to campus hygiene standards.\n- Empty waste bins, collect trash, and assist in waste disposal management.\n- Maintain cleanliness of campus pathways and common facilities.",
                'required_skills' => 'Cleaning, Sanitation, Waste Disposal, Hygiene Maintenance, Sweeping, Mopping, Facility Care',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'entry',
                'location' => 'Bahria University Islamabad Campus',
                'salary_min' => 32000,
                'salary_max' => 40000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(30)->toDateString(),
                'status' => 'active',
                'folder' => 'sweeper',
                'names' => [
                    'Sunil Masih', 'Arif Masih', 'Yaqoob Masih', 'Kashif Masih', 'Raju Masih',
                ],
            ],
        ];

        // Base directory where testing CVs are stored
        $testingCvsBase = base_path('database/data/testing_cvs');
        if (!File::isDirectory($testingCvsBase)) {
            $testingCvsBase = base_path('../testing cvs');
        }
        if (!File::isDirectory($testingCvsBase)) {
            $testingCvsBase = 'D:\\FYP-RecruitSense\\testing cvs';
        }

        Storage::disk('public')->makeDirectory('resumes');

        $totalApplications = 0;

        foreach ($jobDefinitions as $jobKey => $jobData) {
            $posting = JobPosting::updateOrCreate(
                [
                    'company_id' => $bahriaCompany->id,
                    'title' => $jobData['title'],
                ],
                [
                    'description' => $jobData['description'],
                    'required_skills' => $jobData['required_skills'],
                    'job_type' => $jobData['job_type'],
                    'work_mode' => $jobData['work_mode'],
                    'experience_level' => $jobData['experience_level'],
                    'location' => $jobData['location'],
                    'salary_min' => $jobData['salary_min'],
                    'salary_max' => $jobData['salary_max'],
                    'salary_currency' => $jobData['salary_currency'],
                    'application_deadline' => $jobData['application_deadline'],
                    'status' => $jobData['status'],
                ]
            );

            // =========================================================================
            // 3. CANDIDATES & CVs FOR THIS JOB
            // =========================================================================
            $folderPath = $testingCvsBase . DIRECTORY_SEPARATOR . $jobData['folder'];
            if (!File::isDirectory($folderPath)) {
                continue;
            }

            $files = File::files($folderPath);
            $names = $jobData['names'];

            foreach ($files as $index => $file) {
                $ext = $file->getExtension();
                $candidateName = $names[$index % count($names)] ?? ('Applicant ' . ($index + 1));
                $slug = Str::slug($candidateName . '-' . $jobKey . '-' . ($index + 1));
                $email = "{$slug}@recruitsense.test";

                // Create Candidate User
                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $candidateName,
                        'password' => $candidatePasswordHash,
                        'role' => 'jobseeker',
                        'email_verified_at' => now(),
                        'account_status' => 'active',
                    ]
                );

                // Create JobSeeker profile
                $jobSeeker = JobSeeker::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'headline' => "Applicant for {$jobData['title']} at Bahria University",
                        'location' => 'Islamabad, Pakistan',
                        'phone' => '+92 30' . rand(10000000, 99999999),
                        'education' => $jobKey === 'lab' ? 'BCS / BSc (Hons)' : 'Matriculation',
                        'experience' => ($jobKey === 'multimedia' ? '3' : '2') . ' years relevant experience',
                        'about' => "Dedicated professional applying for the position of {$jobData['title']} at Bahria University Islamabad Campus.",
                        'skills' => $jobData['required_skills'],
                    ]
                );

                // Copy actual CV file to storage
                $storedFileName = "resumes/bahria_{$jobKey}_{$index}_" . Str::random(6) . ".{$ext}";
                $targetDiskPath = Storage::disk('public')->path($storedFileName);
                File::ensureDirectoryExists(dirname($targetDiskPath));
                File::copy($file->getRealPath(), $targetDiskPath);

                // Create or update Resume record
                $resume = Resume::updateOrCreate(
                    ['job_seeker_id' => $jobSeeker->id],
                    [
                        'file_path' => $storedFileName,
                        'extracted_text' => "Application for {$jobData['title']} at Bahria University. Candidate: {$candidateName}.",
                        'parsed_skills' => json_encode(array_map('trim', explode(',', $jobData['required_skills']))),
                    ]
                );

                // Create Application
                $statuses = ['shortlisted', 'screening', 'pending'];
                $status = $statuses[$index % count($statuses)];
                $score = rand(70, 95);

                Application::updateOrCreate(
                    [
                        'job_seeker_id' => $jobSeeker->id,
                        'job_id' => $posting->id,
                    ],
                    [
                        'status' => $status,
                        'similarity_score' => $score,
                        'skill_gap_score' => rand(10, 25),
                        'soft_skill_score' => rand(75, 90),
                        'final_score' => $score,
                        'cover_letter' => "Respected HR Manager, I am applying for the post of {$jobData['title']} at Bahria University Islamabad Campus. My CV is attached for your kind evaluation.",
                    ]
                );

                $totalApplications++;
            }
        }
    }
}

