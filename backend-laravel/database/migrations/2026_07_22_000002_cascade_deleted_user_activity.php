<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('profile_views')
            ->whereNull('viewer_user_id')
            ->delete();

        Schema::table('profile_views', function (Blueprint $table) {
            $table->dropForeign(['viewer_user_id']);
            $table->foreign('viewer_user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['actor_id']);
            $table->foreign('actor_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['actor_id']);
            $table->foreign('actor_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });

        Schema::table('profile_views', function (Blueprint $table) {
            $table->dropForeign(['viewer_user_id']);
            $table->foreign('viewer_user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }
};
