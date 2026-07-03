<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('job_postings', function (Blueprint $table) {
        $table->id();
        $table->foreignId('company_id')->constrained()->onDelete('cascade');
        $table->string('title');
        $table->text('description');
        $table->text('required_skills');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('job_postings');
}
};
