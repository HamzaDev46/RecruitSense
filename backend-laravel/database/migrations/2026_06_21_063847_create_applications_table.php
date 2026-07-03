<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('applications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('job_seeker_id')->constrained()->onDelete('cascade');
        $table->foreignId('job_id')->constrained('job_postings')->onDelete('cascade');
        $table->float('similarity_score')->nullable();
        $table->float('soft_skill_score')->nullable();
        $table->float('final_score')->nullable();
        $table->enum('status', ['pending', 'shortlisted', 'rejected'])->default('pending');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('applications');
}
};
