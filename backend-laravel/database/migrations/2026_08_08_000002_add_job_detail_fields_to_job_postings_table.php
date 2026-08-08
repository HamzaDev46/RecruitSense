<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->string('job_type')->nullable()->after('required_skills');
            $table->string('work_mode')->nullable()->after('job_type');
            $table->string('experience_level')->nullable()->after('work_mode');
            $table->string('location')->nullable()->after('experience_level');
            $table->unsignedInteger('salary_min')->nullable()->after('location');
            $table->unsignedInteger('salary_max')->nullable()->after('salary_min');
            $table->string('salary_currency', 10)->default('PKR')->after('salary_max');
            $table->date('application_deadline')->nullable()->after('salary_currency');
        });
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropColumn([
                'job_type',
                'work_mode',
                'experience_level',
                'location',
                'salary_min',
                'salary_max',
                'salary_currency',
                'application_deadline',
            ]);
        });
    }
};
