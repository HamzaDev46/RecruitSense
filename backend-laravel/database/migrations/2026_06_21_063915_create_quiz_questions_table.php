<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('quiz_questions', function (Blueprint $table) {
        $table->id();
        $table->string('category');
        $table->text('question_text');
        $table->json('options');
        $table->string('correct_answer');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('quiz_questions');
}
};
