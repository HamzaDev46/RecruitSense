<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('applications', 'interview_location')) {
            return;
        }

        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE applications MODIFY interview_location TEXT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications ALTER COLUMN interview_location TYPE TEXT');
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('applications', 'interview_location')) {
            return;
        }

        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE applications MODIFY interview_location VARCHAR(500) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications ALTER COLUMN interview_location TYPE VARCHAR(500)');
        }
    }
};
