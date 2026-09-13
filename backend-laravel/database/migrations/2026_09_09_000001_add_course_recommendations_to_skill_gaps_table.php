<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skill_gaps', function (Blueprint $table) {
            $table->string('course_title')->nullable()->after('recommendation');
            $table->string('course_platform')->nullable()->after('course_title');
            $table->text('course_url')->nullable()->after('course_platform');
        });
    }

    public function down(): void
    {
        Schema::table('skill_gaps', function (Blueprint $table) {
            $table->dropColumn(['course_title', 'course_platform', 'course_url']);
        });
    }
};
