<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class TrustedEmailDomain implements ValidationRule
{
    /**
     * Strict whitelist of trusted email domains.
     */
    public const TRUSTED_DOMAINS = [
        // Google
        'gmail.com',
        'googlemail.com',

        // Microsoft
        'outlook.com',
        'hotmail.com',
        'live.com',
        'msn.com',

        // Yahoo
        'yahoo.com',
        'ymail.com',
        'rocketmail.com',
        'yahoo.co.uk',
        'yahoo.com.pk',
        'yahoo.ca',
        'yahoo.fr',
        'yahoo.de',
        'yahoo.com.au',
        'yahoo.in',

        // Apple
        'icloud.com',
        'me.com',
        'mac.com',

        // Privacy & Popular Webmail
        'proton.me',
        'protonmail.com',
        'zoho.com',
        'zohomail.com',
        'aol.com',
        'gmx.com',
        'mail.com',
        'fastmail.com',

        // RecruitSense Platform & System
        'recruitsense.com',
    ];

    /**
     * Validate whether the email is from a strictly trusted domain.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $fail('The ' . $attribute . ' must be a valid email address.');
            return;
        }

        $parts = explode('@', strtolower(trim($value)));
        if (count($parts) !== 2) {
            $fail('The ' . $attribute . ' format is invalid.');
            return;
        }

        $domain = $parts[1];

        // 1. Strict Whitelist Check
        if (in_array($domain, self::TRUSTED_DOMAINS, true)) {
            return;
        }

        // 2. Recognized Academic Domains (.edu, .edu.pk, .ac.uk, .edu.au)
        if (
            str_ends_with($domain, '.edu') ||
            str_ends_with($domain, '.edu.pk') ||
            str_ends_with($domain, '.ac.uk') ||
            str_ends_with($domain, '.edu.au')
        ) {
            return;
        }

        $fail('Email must be from a trusted provider (e.g. Gmail, Yahoo, Outlook, Hotmail, iCloud, Proton, or .edu).');
    }
}
