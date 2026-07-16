<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_impressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
            $table->foreignId('viewer_user_id')->constrained('users')->onDelete('cascade');
            $table->date('viewed_on');
            $table->timestamps();

            $table->unique(['post_id', 'viewer_user_id', 'viewed_on'], 'post_impression_user_day_unique');
            $table->index(['viewer_user_id', 'viewed_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_impressions');
    }
};
