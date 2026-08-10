<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'offer_title')) {
                $table->string('offer_title')->nullable()->after('interview_completed_at');
            }

            if (!Schema::hasColumn('applications', 'offer_compensation')) {
                $table->string('offer_compensation')->nullable()->after('offer_title');
            }

            if (!Schema::hasColumn('applications', 'offer_start_date')) {
                $table->date('offer_start_date')->nullable()->after('offer_compensation');
            }

            if (!Schema::hasColumn('applications', 'offer_notes')) {
                $table->text('offer_notes')->nullable()->after('offer_start_date');
            }

            if (!Schema::hasColumn('applications', 'offer_sent_at')) {
                $table->timestamp('offer_sent_at')->nullable()->after('offer_notes');
            }

            if (!Schema::hasColumn('applications', 'hired_at')) {
                $table->timestamp('hired_at')->nullable()->after('offer_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            foreach ([
                'hired_at',
                'offer_sent_at',
                'offer_notes',
                'offer_start_date',
                'offer_compensation',
                'offer_title',
            ] as $column) {
                if (Schema::hasColumn('applications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
