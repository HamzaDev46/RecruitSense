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
        // Enforce strict email verification to prevent spam and fake accounts
        DB::table('admin_settings')->updateOrInsert(
            ['key' => 'require_email_verification'],
            [
                'value' => json_encode(true),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('admin_settings')->updateOrInsert(
            ['key' => 'require_email_verification'],
            [
                'value' => json_encode(false),
                'updated_at' => now(),
            ]
        );
    }
};

