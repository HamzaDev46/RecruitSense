<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'shortlisted', 'rejected', 'withdrawn') DEFAULT 'pending'");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'shortlisted', 'rejected', 'withdrawn'))");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        DB::table('applications')
            ->where('status', 'withdrawn')
            ->update(['status' => 'pending']);

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'shortlisted', 'rejected') DEFAULT 'pending'");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'shortlisted', 'rejected'))");
        }
    }
};
