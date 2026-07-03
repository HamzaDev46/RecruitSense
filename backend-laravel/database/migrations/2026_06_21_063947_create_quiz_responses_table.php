<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::create('quiz_responses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('application_id')->constrained()->onDelete('cascade');
        $table->foreignId('question_id')->constrained('quiz_questions')->onDelete('cascade');
        $table->string('selected_answer');
        $table->boolean('is_correct');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('quiz_responses');
}
};
