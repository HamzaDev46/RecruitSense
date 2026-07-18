<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'shortlisted', 'rejected', 'withdrawn') DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::table('applications')
                ->where('status', 'withdrawn')
                ->update(['status' => 'pending']);

            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'shortlisted', 'rejected') DEFAULT 'pending'");
        }
    }
};
