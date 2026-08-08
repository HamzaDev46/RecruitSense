<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'interview_scheduled_at')) {
                $table->timestamp('interview_scheduled_at')->nullable()->after('withdrawn_at');
            }

            if (!Schema::hasColumn('applications', 'interview_mode')) {
                $table->string('interview_mode')->nullable()->after('interview_scheduled_at');
            }

            if (!Schema::hasColumn('applications', 'interview_location')) {
                $table->string('interview_location')->nullable()->after('interview_mode');
            }

            if (!Schema::hasColumn('applications', 'interview_notes')) {
                $table->text('interview_notes')->nullable()->after('interview_location');
            }

            if (!Schema::hasColumn('applications', 'interview_status')) {
                $table->string('interview_status')->nullable()->after('interview_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            foreach ([
                'interview_status',
                'interview_notes',
                'interview_location',
                'interview_mode',
                'interview_scheduled_at',
            ] as $column) {
                if (Schema::hasColumn('applications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
