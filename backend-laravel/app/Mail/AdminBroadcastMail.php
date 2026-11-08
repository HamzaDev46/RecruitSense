<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminBroadcastMail extends Mailable
{
    use Queueable, SerializesModels;

    public ?User $user;
    public string $broadcastTitle;
    public string $broadcastMessage;
    public string $sentBy;
    public string $frontendUrl;
    public string $recipientName;

    public function __construct(string $broadcastTitle, string $broadcastMessage, ?User $user = null, string $sentBy = 'Platform Administration', ?string $recipientName = null)
    {
        $this->user = $user;
        $this->broadcastTitle = $broadcastTitle;
        $this->broadcastMessage = $broadcastMessage;
        $this->sentBy = $sentBy;
        $this->recipientName = $recipientName ?? ($user ? $user->name : 'RecruitSense Member');
        $this->frontendUrl = rtrim(config('services.frontend.url', env('FRONTEND_URL', 'https://recruitsense.online')), '/');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Notice: ' . $this->broadcastTitle,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-broadcast',
            with: [
                'user' => $this->user,
                'recipientName' => $this->recipientName,
                'title' => $this->broadcastTitle,
                'messageContent' => $this->broadcastMessage,
                'sentBy' => $this->sentBy,
                'portalUrl' => $this->frontendUrl,
            ],
        );
    }
}
