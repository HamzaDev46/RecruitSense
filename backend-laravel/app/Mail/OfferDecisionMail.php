<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfferDecisionMail extends Mailable
{
    use Queueable, SerializesModels;

    public Application $application;
    public bool $isHired;

    public function __construct(Application $application, bool $isHired = false)
    {
        $this->application = $application;
        $this->isHired = $isHired;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isHired
                ? 'Congratulations! You Have Been Hired'
                : 'You Have Received a Job Offer',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.offer-decision',
        );
    }
}
