<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::create('job_seekers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('education')->nullable();
        $table->string('experience')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('job_seekers');
}
};
