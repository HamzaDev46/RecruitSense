<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->string('profile_visibility')->default('public');
            $table->boolean('show_profile_view_notifications')->default(true);
            $table->boolean('allow_search_appearance_tracking')->default(true);
            $table->boolean('notify_connections')->default(true);
            $table->boolean('notify_messages')->default(true);
            $table->boolean('notify_application_updates')->default(true);
            $table->boolean('notify_job_alerts')->default(true);
            $table->boolean('notify_post_activity')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->dropColumn([
                'profile_visibility',
                'show_profile_view_notifications',
                'allow_search_appearance_tracking',
                'notify_connections',
                'notify_messages',
                'notify_application_updates',
                'notify_job_alerts',
                'notify_post_activity',
            ]);
        });
    }
};
