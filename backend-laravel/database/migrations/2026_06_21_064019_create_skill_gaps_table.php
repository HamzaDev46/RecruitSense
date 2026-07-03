<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('skill_gaps', function (Blueprint $table) {
        $table->id();
        $table->foreignId('application_id')->constrained()->onDelete('cascade');
        $table->string('missing_skill');
        $table->text('recommendation')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('skill_gaps');
}
};
