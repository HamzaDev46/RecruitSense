<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Expands profile image, cover image, and company logo columns to LONGTEXT
     * so base64 Data URIs can be stored persistently in MySQL, preventing image loss
     * on ephemeral Render container restarts.
     */
    public function up(): void
    {
        if (Schema::hasTable('job_seekers')) {
            Schema::table('job_seekers', function (Blueprint $table) {
                if (Schema::hasColumn('job_seekers', 'profile_image')) {
                    $table->longText('profile_image')->nullable()->change();
                }
                if (Schema::hasColumn('job_seekers', 'cover_image')) {
                    $table->longText('cover_image')->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('companies')) {
            Schema::table('companies', function (Blueprint $table) {
                if (Schema::hasColumn('companies', 'logo_path')) {
                    $table->longText('logo_path')->nullable()->change();
                }
                if (Schema::hasColumn('companies', 'cover_image')) {
                    $table->longText('cover_image')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_seekers')) {
            Schema::table('job_seekers', function (Blueprint $table) {
                if (Schema::hasColumn('job_seekers', 'profile_image')) {
                    $table->string('profile_image', 255)->nullable()->change();
                }
                if (Schema::hasColumn('job_seekers', 'cover_image')) {
                    $table->string('cover_image', 255)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('companies')) {
            Schema::table('companies', function (Blueprint $table) {
                if (Schema::hasColumn('companies', 'logo_path')) {
                    $table->string('logo_path', 255)->nullable()->change();
                }
                if (Schema::hasColumn('companies', 'cover_image')) {
                    $table->string('cover_image', 255)->nullable()->change();
                }
            });
        }
    }
};

