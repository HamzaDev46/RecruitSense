<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'cover_letter')) {
                $table->text('cover_letter')->nullable()->after('status');
            }

            if (!Schema::hasColumn('applications', 'withdraw_reason')) {
                $table->text('withdraw_reason')->nullable()->after('cover_letter');
            }

            if (!Schema::hasColumn('applications', 'withdrawn_at')) {
                $table->timestamp('withdrawn_at')->nullable()->after('withdraw_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'withdrawn_at')) {
                $table->dropColumn('withdrawn_at');
            }

            if (Schema::hasColumn('applications', 'withdraw_reason')) {
                $table->dropColumn('withdraw_reason');
            }

            if (Schema::hasColumn('applications', 'cover_letter')) {
                $table->dropColumn('cover_letter');
            }
        });
    }
};
