<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewScheduledMail extends Mailable
{
    use Queueable, SerializesModels;

    public Application $application;
    public bool $isReschedule;

    public function __construct(Application $application, bool $isReschedule = false)
    {
        $this->application = $application;
        $this->isReschedule = $isReschedule;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isReschedule
                ? 'Your Interview Has Been Rescheduled'
                : 'Your Interview Has Been Scheduled',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.interview-scheduled',
        );
    }
}
