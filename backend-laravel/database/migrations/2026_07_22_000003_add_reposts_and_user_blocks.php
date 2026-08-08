<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('repost_of_id')
                ->nullable()
                ->after('user_id')
                ->constrained('posts')
                ->cascadeOnDelete();
            $table->unique(['user_id', 'repost_of_id'], 'posts_user_repost_unique');
            $table->index(['repost_of_id', 'created_at']);
        });

        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['blocker_id', 'blocked_id']);
            $table->index(['blocked_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_blocks');

        Schema::table('posts', function (Blueprint $table) {
            $table->dropUnique('posts_user_repost_unique');
            $table->dropIndex(['repost_of_id', 'created_at']);
            $table->dropConstrainedForeignId('repost_of_id');
        });
    }
};
