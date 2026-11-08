<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecommendedJobsMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public array $recommendations;
    public string $portalUrl;

    public function __construct(User $user, array $recommendations)
    {
        $this->user = $user;
        $this->recommendations = array_slice($recommendations, 0, 5); // top 5 matches
        $this->portalUrl = rtrim(config('services.frontend.url', env('FRONTEND_URL', 'https://recruitsense.online')), '/');
    }

    public function envelope(): Envelope
    {
        $count = count($this->recommendations);
        $subject = $count > 0
            ? "🔥 Top {$count} Job Matches for Your Profile on RecruitSense"
            : 'Explore Fresh Job Opportunities on RecruitSense';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.recommended-jobs',
            with: [
                'user' => $this->user,
                'recommendations' => $this->recommendations,
                'portalUrl' => $this->portalUrl,
            ],
        );
    }
}

