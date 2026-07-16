<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('viewer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('viewer_ip')->nullable();
            $table->date('viewed_on');
            $table->timestamps();

            $table->unique(['profile_user_id', 'viewer_user_id', 'viewed_on'], 'profile_view_user_day_unique');
            $table->index(['profile_user_id', 'viewed_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_views');
    }
};
