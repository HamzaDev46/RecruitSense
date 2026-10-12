<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('users:clean-non-admins', function () {
    $this->info('Starting database cleanup for non-admin accounts...');
    $result = \App\Services\DatabaseCleanupService::cleanNonAdminAccounts();
    if ($result['status'] === 'success') {
        $this->info('Success: ' . $result['message']);
        $this->line(json_encode($result['deleted_summary'], JSON_PRETTY_PRINT));
    } else {
        $this->error('Error: ' . $result['message']);
    }
})->purpose('Safely delete all non-admin accounts and related data');

