<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Mark all registered users as verified
        DB::table('users')->whereNull('email_verified_at')->update([
            'email_verified_at' => now(),
            'account_status' => 'active'
        ]);

        // Set require_email_verification default to false
        DB::table('admin_settings')->updateOrInsert(
            ['key' => 'require_email_verification'],
            [
                'value' => json_encode(false),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
