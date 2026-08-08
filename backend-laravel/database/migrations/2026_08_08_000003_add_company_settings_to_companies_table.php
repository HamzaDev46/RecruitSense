<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('dark_mode')->default(false)->after('founded_year');
            $table->boolean('notify_messages')->default(true)->after('dark_mode');
            $table->boolean('notify_candidate_activity')->default(true)->after('notify_messages');
            $table->boolean('notify_quiz_results')->default(true)->after('notify_candidate_activity');
            $table->boolean('notify_post_activity')->default(true)->after('notify_quiz_results');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'dark_mode',
                'notify_messages',
                'notify_candidate_activity',
                'notify_quiz_results',
                'notify_post_activity',
            ]);
        });
    }
};
