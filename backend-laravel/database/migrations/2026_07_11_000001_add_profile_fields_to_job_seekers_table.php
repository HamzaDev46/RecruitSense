<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->string('headline')->nullable()->after('user_id');
            $table->string('location')->nullable()->after('headline');
            $table->string('phone')->nullable()->after('location');
            $table->string('website')->nullable()->after('phone');
            $table->string('company')->nullable()->after('website');
            $table->text('about')->nullable()->after('experience');
            $table->text('skills')->nullable()->after('about');
            $table->string('profile_image')->nullable()->after('skills');
            $table->string('cover_image')->nullable()->after('profile_image');
        });
    }

    public function down(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->dropColumn([
                'headline',
                'location',
                'phone',
                'website',
                'company',
                'about',
                'skills',
                'profile_image',
                'cover_image',
            ]);
        });
    }
};
