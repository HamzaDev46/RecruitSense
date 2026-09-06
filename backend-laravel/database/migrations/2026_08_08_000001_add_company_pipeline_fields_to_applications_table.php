<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'company_notes')) {
                $table->text('company_notes')->nullable()->after('interview_status');
            }

            if (!Schema::hasColumn('applications', 'company_rating')) {
                $table->unsignedTinyInteger('company_rating')->nullable()->after('company_notes');
            }

            if (!Schema::hasColumn('applications', 'interview_feedback')) {
                $table->text('interview_feedback')->nullable()->after('company_rating');
            }

            if (!Schema::hasColumn('applications', 'interview_rating')) {
                $table->unsignedTinyInteger('interview_rating')->nullable()->after('interview_feedback');
            }

            if (!Schema::hasColumn('applications', 'interview_completed_at')) {
                $table->timestamp('interview_completed_at')->nullable()->after('interview_rating');
            }
        });

        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn') DEFAULT 'pending'");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'))");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        DB::table('applications')
            ->whereIn('status', ['screening', 'interview', 'offered', 'hired'])
            ->update(['status' => 'shortlisted']);

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'shortlisted', 'rejected', 'withdrawn') DEFAULT 'pending'");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'shortlisted', 'rejected', 'withdrawn'))");
        }

        Schema::table('applications', function (Blueprint $table) {
            foreach ([
                'interview_completed_at',
                'interview_rating',
                'interview_feedback',
                'company_rating',
                'company_notes',
            ] as $column) {
                if (Schema::hasColumn('applications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
