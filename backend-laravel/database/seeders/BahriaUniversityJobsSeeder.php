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
     * and candidate accounts with actual CV files and verified real candidate names.
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
        // 2. THE 4 JOBS & AUTHENTIC CANDIDATES FROM PHYSICAL CVs
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
                'candidates' => [
                    1 => [
                        'name' => 'Muhammad Saleh',
                        'email' => 'muhammad.saleh@recruitsense.test',
                        'phone' => '+92 312 9584721',
                        'education' => 'BS (Hons) Computer Science - HEC Recognized',
                        'skills' => 'BCS, Computer Hardware, Windows Server, Linux, Networking, Lab Management, Hardware Troubleshooting, System Maintenance',
                        'status' => 'shortlisted',
                        'score' => 94,
                        'about' => 'Experienced computer laboratory assistant with comprehensive hardware maintenance, networking, and lab administration expertise.',
                    ],
                    2 => [
                        'name' => 'Sabahat Munir',
                        'email' => 'sabahat.munir@recruitsense.test',
                        'phone' => '+92 333 5849201',
                        'education' => 'BSc Computer Science',
                        'skills' => 'BSc, Computer Science, IT Support, Database Management, Lab Administration, Network Setup',
                        'status' => 'shortlisted',
                        'score' => 91,
                        'about' => 'BSc Computer Science graduate with hands-on lab supervision, IT support, and operating system configuration proficiency.',
                    ],
                    3 => [
                        'name' => 'Muhammad Waseem',
                        'email' => 'muhammad.waseem@recruitsense.test',
                        'phone' => '+92 301 7845123',
                        'education' => 'BCS in Information Technology',
                        'skills' => 'Computer Systems, Hardware Diagnostics, Network Configuration, Academic Lab Support, System Backups',
                        'status' => 'screening',
                        'score' => 88,
                        'about' => 'Technical support specialist with proven track record in hardware diagnostics, local area network setups, and student assistance.',
                    ],
                    4 => [
                        'name' => 'Shabbir Khan',
                        'email' => 'shabbir.khan@recruitsense.test',
                        'phone' => '+92 345 6128490',
                        'education' => 'BSc in Science & Computing',
                        'skills' => 'Lab Equipment Maintenance, System Software, OS Installation, Student Lab Assistance, Troubleshooting',
                        'status' => 'screening',
                        'score' => 85,
                        'about' => 'Dedicated academic lab technician experienced in software installation, equipment inventory, and routine maintenance.',
                    ],
                    5 => [
                        'name' => 'Afaq Gardazi',
                        'email' => 'afaq.gardazi@recruitsense.test',
                        'phone' => '+92 321 4455667',
                        'education' => 'BCS Computer Science',
                        'skills' => 'Information Technology, Lab Coordination, Hardware Maintenance, Network Cabling, Inventory Tracking',
                        'status' => 'pending',
                        'score' => 82,
                        'about' => 'IT professional with background in laboratory networking, computer repair, and educational institution support.',
                    ],
                    6 => [
                        'name' => 'Syeda Jaweria Bibi',
                        'email' => 'syeda.jaweria@recruitsense.test',
                        'phone' => '+92 300 9988776',
                        'education' => 'BSc Computer Science',
                        'skills' => 'Computer Applications, Science Lab Setup, IT Equipment Inventory, Student Guidance, Lab Safety',
                        'status' => 'shortlisted',
                        'score' => 89,
                        'about' => 'Skilled computer science lab administrator specialized in practical session coordination and laboratory safety protocols.',
                    ],
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
                'candidates' => [
                    1 => [
                        'name' => 'Muhammad Atiq Khan',
                        'email' => 'muhammad.atiq@recruitsense.test',
                        'phone' => '+92 313 1234501',
                        'education' => 'Matriculation & AV Technical Diploma',
                        'status' => 'shortlisted',
                        'score' => 93,
                    ],
                    2 => [
                        'name' => 'Haris Bin Sohrab',
                        'email' => 'haris.sohrab@recruitsense.test',
                        'phone' => '+92 313 1234502',
                        'education' => 'Matriculation & Audio Visual Certificate',
                        'status' => 'shortlisted',
                        'score' => 91,
                    ],
                    3 => [
                        'name' => 'Muhammad Tayyab Shahzeb',
                        'email' => 'tayyab.shahzeb@recruitsense.test',
                        'phone' => '+92 313 1234503',
                        'education' => 'Matriculation & Multimedia Electronics',
                        'status' => 'shortlisted',
                        'score' => 89,
                    ],
                    4 => [
                        'name' => 'Sohail Ahmed',
                        'email' => 'sohail.ahmed@recruitsense.test',
                        'phone' => '+92 313 1234504',
                        'education' => 'Matriculation',
                        'status' => 'shortlisted',
                        'score' => 88,
                    ],
                    5 => [
                        'name' => 'Jawad Shah',
                        'email' => 'jawad.shah@recruitsense.test',
                        'phone' => '+92 313 1234505',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 86,
                    ],
                    6 => [
                        'name' => 'Daniyal Shafique Abbasi',
                        'email' => 'daniyal.abbasi@recruitsense.test',
                        'phone' => '+92 313 1234506',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 85,
                    ],
                    7 => [
                        'name' => 'Arshad Ullah',
                        'email' => 'arshad.ullah@recruitsense.test',
                        'phone' => '+92 313 1234507',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 84,
                    ],
                    8 => [
                        'name' => 'Sajjad Shah',
                        'email' => 'sajjad.shah@recruitsense.test',
                        'phone' => '+92 313 1234508',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 83,
                    ],
                    9 => [
                        'name' => 'Muhammad Waleed Sajid',
                        'email' => 'waleed.sajid@recruitsense.test',
                        'phone' => '+92 313 1234509',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 82,
                    ],
                    10 => [
                        'name' => 'Muhammad Munib Ur Rehman',
                        'email' => 'munib.rehman@recruitsense.test',
                        'phone' => '+92 313 1234510',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 82,
                    ],
                    11 => [
                        'name' => 'Asad Nawaz',
                        'email' => 'asad.nawaz@recruitsense.test',
                        'phone' => '+92 313 1234511',
                        'education' => 'Matriculation & Technical Certificate in Audio Visual',
                        'status' => 'shortlisted',
                        'score' => 92,
                    ],
                    12 => [
                        'name' => 'Niaz Khan',
                        'email' => 'niaz.khan@recruitsense.test',
                        'phone' => '+92 313 1234512',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 79,
                    ],
                    13 => [
                        'name' => 'Aamir Mehmood',
                        'email' => 'aamir.mehmood@recruitsense.test',
                        'phone' => '+92 313 1234513',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 78,
                    ],
                    14 => [
                        'name' => 'Huzaifa Nadeem',
                        'email' => 'huzaifa.nadeem@recruitsense.test',
                        'phone' => '+92 313 1234514',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 77,
                    ],
                    15 => [
                        'name' => 'Muhammad Aden Gul',
                        'email' => 'aden.gul@recruitsense.test',
                        'phone' => '+92 313 1234515',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 76,
                    ],
                    16 => [
                        'name' => 'Saif Ullah',
                        'email' => 'saif.ullah@recruitsense.test',
                        'phone' => '+92 313 1234516',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 75,
                    ],
                    17 => [
                        'name' => 'Moazam Ali',
                        'email' => 'moazam.ali@recruitsense.test',
                        'phone' => '+92 313 1234517',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 74,
                    ],
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
                'candidates' => [
                    1 => [
                        'name' => 'Sajid Gulzar',
                        'email' => 'sajid.gulzar@recruitsense.test',
                        'phone' => '+92 302 1122334',
                        'education' => 'Matriculation',
                        'status' => 'shortlisted',
                        'score' => 92,
                    ],
                    2 => [
                        'name' => 'Muhammad Arif',
                        'email' => 'muhammad.arif@recruitsense.test',
                        'phone' => '+92 303 2233445',
                        'education' => 'Matriculation',
                        'status' => 'shortlisted',
                        'score' => 89,
                    ],
                    3 => [
                        'name' => 'Muhammad Ishtiaq',
                        'email' => 'muhammad.ishtiaq@recruitsense.test',
                        'phone' => '+92 304 3344556',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 86,
                    ],
                    4 => [
                        'name' => 'Akbar Zaman',
                        'email' => 'akbar.zaman@recruitsense.test',
                        'phone' => '+92 305 4455667',
                        'education' => 'Matriculation',
                        'status' => 'screening',
                        'score' => 84,
                    ],
                    5 => [
                        'name' => 'Muhammad Saqlain',
                        'email' => 'muhammad.saqlain@recruitsense.test',
                        'phone' => '+92 306 5566778',
                        'education' => 'Matriculation',
                        'status' => 'pending',
                        'score' => 81,
                    ],
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
                'candidates' => [
                    1 => [
                        'name' => 'Gulfam Anwar Gill',
                        'email' => 'gulfam.anwar@recruitsense.test',
                        'phone' => '+92 307 6677889',
                        'education' => 'Literate (Middle)',
                        'status' => 'shortlisted',
                        'score' => 93,
                    ],
                    2 => [
                        'name' => 'Yashwa Arif',
                        'email' => 'yashwa.arif@recruitsense.test',
                        'phone' => '+92 308 7788990',
                        'education' => 'Literate (Middle)',
                        'status' => 'shortlisted',
                        'score' => 90,
                    ],
                    3 => [
                        'name' => 'Qaiser Masih',
                        'email' => 'qaiser.masih@recruitsense.test',
                        'phone' => '+92 309 8899001',
                        'education' => 'Literate (Primary)',
                        'status' => 'screening',
                        'score' => 87,
                    ],
                    4 => [
                        'name' => 'Shahzad',
                        'email' => 'shahzad@recruitsense.test',
                        'phone' => '+92 310 9900112',
                        'education' => 'Literate',
                        'status' => 'screening',
                        'score' => 84,
                    ],
                    5 => [
                        'name' => 'Najam Ayub',
                        'email' => 'najam.ayub@recruitsense.test',
                        'phone' => '+92 311 0011223',
                        'education' => 'Literate',
                        'status' => 'pending',
                        'score' => 80,
                    ],
                ],
            ],
        ];

        // Gather all valid emails to purge outdated placeholder test users
        $validEmails = [];
        foreach ($jobDefinitions as $job) {
            foreach ($job['candidates'] as $candidate) {
                $validEmails[] = $candidate['email'];
            }
        }

        // Clean up previous placeholder test candidates (e.g. Aamir Liaquat, etc.)
        User::where('email', 'like', '%@recruitsense.test')
            ->whereNotIn('email', $validEmails)
            ->delete();

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

            $folderPath = $testingCvsBase . DIRECTORY_SEPARATOR . $jobData['folder'];

            foreach ($jobData['candidates'] as $fileNumber => $candidateInfo) {
                $candidateName = $candidateInfo['name'];
                $email = $candidateInfo['email'];

                // Create or update candidate User
                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => $candidateName,
                        'password' => $candidatePasswordHash,
                        'role' => 'jobseeker',
                        'email_verified_at' => now(),
                        'account_status' => 'active',
                    ]
                );

                // Create or update JobSeeker profile
                $jobSeeker = JobSeeker::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'headline' => "Applicant for {$jobData['title']} - {$candidateName}",
                        'location' => 'Islamabad, Pakistan',
                        'phone' => $candidateInfo['phone'] ?? '+92 300 0000000',
                        'education' => $candidateInfo['education'] ?? 'Relevant Qualification',
                        'experience' => ($jobKey === 'multimedia' ? '3' : '2') . ' years relevant experience',
                        'about' => $candidateInfo['about'] ?? "Experienced and dedicated applicant applying for {$jobData['title']} at Bahria University Islamabad Campus.",
                        'skills' => $candidateInfo['skills'] ?? $jobData['required_skills'],
                    ]
                );

                // Copy actual physical CV file to public storage with deterministic naming
                $storedFileName = "resumes/bahria_{$jobKey}_{$fileNumber}.pdf";
                $sourceFile = $folderPath . DIRECTORY_SEPARATOR . "{$fileNumber}.pdf";

                if (File::exists($sourceFile)) {
                    $targetDiskPath = Storage::disk('public')->path($storedFileName);
                    File::ensureDirectoryExists(dirname($targetDiskPath));
                    File::copy($sourceFile, $targetDiskPath);
                }

                // Create or update Resume record
                Resume::updateOrCreate(
                    ['job_seeker_id' => $jobSeeker->id],
                    [
                        'file_path' => $storedFileName,
                        'extracted_text' => "Application for {$jobData['title']} at Bahria University. Candidate Name: {$candidateName}. Education: " . ($candidateInfo['education'] ?? 'Matriculation') . ". Skills: " . ($candidateInfo['skills'] ?? $jobData['required_skills']),
                        'parsed_skills' => json_encode(array_map('trim', explode(',', $candidateInfo['skills'] ?? $jobData['required_skills']))),
                    ]
                );

                // Create or update Application: all start in pending so HR manually evaluates, shortlists, or rejects
                $score = $candidateInfo['score'] ?? 85;
                $status = 'pending';

                Application::updateOrCreate(
                    [
                        'job_seeker_id' => $jobSeeker->id,
                        'job_id' => $posting->id,
                    ],
                    [
                        'status' => $status,
                        'similarity_score' => $score,
                        'skill_gap_score' => max(5, 100 - $score - rand(0, 5)),
                        'soft_skill_score' => rand(80, 95),
                        'final_score' => $score,
                        'cover_letter' => "Respected HR Manager, I am applying for the post of {$jobData['title']} at Bahria University Islamabad Campus. My verified resume is attached for your kind evaluation. Sincerely, {$candidateName}.",
                    ]
                );

                $totalApplications++;
            }
        }
    }
}
