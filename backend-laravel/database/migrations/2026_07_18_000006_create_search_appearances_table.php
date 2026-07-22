<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_appearances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('searcher_user_id')->constrained('users')->onDelete('cascade');
            $table->string('query')->nullable();
            $table->string('query_hash', 64);
            $table->date('appeared_on');
            $table->timestamps();

            $table->unique(
                ['profile_user_id', 'searcher_user_id', 'query_hash', 'appeared_on'],
                'search_appearance_user_query_day_unique'
            );
            $table->index(['profile_user_id', 'appeared_on']);
            $table->index(['searcher_user_id', 'appeared_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_appearances');
    }
};
