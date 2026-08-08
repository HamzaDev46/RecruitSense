<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('description');
            $table->string('cover_image')->nullable()->after('logo_path');
            $table->string('website')->nullable()->after('cover_image');
            $table->string('location')->nullable()->after('website');
            $table->string('phone')->nullable()->after('location');
            $table->string('contact_email')->nullable()->after('phone');
            $table->string('company_size')->nullable()->after('contact_email');
            $table->unsignedSmallInteger('founded_year')->nullable()->after('company_size');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'logo_path',
                'cover_image',
                'website',
                'location',
                'phone',
                'contact_email',
                'company_size',
                'founded_year',
            ]);
        });
    }
};
