<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProfileCompletionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public int $completion;
    public array $missingTasks;
    public string $portalUrl;

    public function __construct(User $user, int $completion, array $missingTasks = [])
    {
        $this->user = $user;
        $this->completion = $completion;
        $this->missingTasks = array_slice($missingTasks, 0, 4); // show up to top 4 pending steps
        $this->portalUrl = rtrim(config('services.frontend.url', env('FRONTEND_URL', 'https://recruitsense.online')), '/');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "⚡ Complete your profile ({$this->completion}%) to get 4x more recruiter views",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.profile-completion-reminder',
            with: [
                'user' => $this->user,
                'completion' => $this->completion,
                'missingTasks' => $this->missingTasks,
                'portalUrl' => $this->portalUrl,
            ],
        );
    }
}

