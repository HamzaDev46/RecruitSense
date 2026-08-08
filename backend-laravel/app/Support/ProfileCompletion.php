<?php

namespace App\Support;

class ProfileCompletion
{
    public static function forJobSeeker($jobSeeker): array
    {
        $jobSeeker->loadMissing('experiences', 'resume');

        $checks = [
            [
                'id' => 'headline',
                'complete' => filled($jobSeeker->headline),
                'task' => 'Add headline',
                'description' => 'Tell companies what role you are targeting.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'location',
                'complete' => filled($jobSeeker->location),
                'task' => 'Add location',
                'description' => 'Help recruiters understand where you are based.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'phone',
                'complete' => filled($jobSeeker->phone),
                'task' => 'Add phone number',
                'description' => 'Keep contact information ready for companies.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'company',
                'complete' => filled($jobSeeker->company),
                'task' => 'Add company',
                'description' => 'Show your current workplace, company, or self-employment status.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'education',
                'complete' => filled($jobSeeker->education),
                'task' => 'Add education',
                'description' => 'Add your degree, institute, or relevant education.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'about',
                'complete' => filled($jobSeeker->about),
                'task' => 'Add about section',
                'description' => 'Write a short summary recruiters can scan quickly.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'skills',
                'complete' => filled($jobSeeker->skills),
                'task' => 'Add skills',
                'description' => 'Skills improve recommendations and match scores.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'profile_image',
                'complete' => filled($jobSeeker->profile_image),
                'task' => 'Upload profile photo',
                'description' => 'Make your profile recognizable across the network.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'cover_image',
                'complete' => filled($jobSeeker->cover_image),
                'task' => 'Upload cover photo',
                'description' => 'Give your profile a professional first impression.',
                'action_path' => '/profile?setup=profile',
            ],
            [
                'id' => 'experience',
                'complete' => $jobSeeker->experiences->isNotEmpty(),
                'task' => 'Add experience',
                'description' => 'Add work, internship, freelance, or project experience.',
                'action_path' => '/profile?setup=experience',
            ],
            [
                'id' => 'resume',
                'complete' => (bool) $jobSeeker->resume,
                'task' => 'Upload resume',
                'description' => 'Resume powers AI job matching and application scoring.',
                'action_path' => '/resume',
            ],
        ];

        $tasks = collect($checks)->values();
        $completed = $tasks->where('complete', true)->count();
        $missingTasks = $tasks->where('complete', false)->values();

        return [
            'completion' => (int) round(($completed / $tasks->count()) * 100),
            'completed_tasks' => $completed,
            'total_tasks' => $tasks->count(),
            'tasks' => $tasks->all(),
            'next_task' => $missingTasks->first(),
            'missing_tasks' => $missingTasks->all(),
        ];
    }
}
