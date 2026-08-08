<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reported_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('reportable_type', 30);
            $table->unsignedBigInteger('reportable_id');
            $table->string('reason', 40);
            $table->text('details')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestamps();

            $table->unique(['reporter_id', 'reportable_type', 'reportable_id'], 'content_reports_unique_report');
            $table->index(['reported_user_id', 'status']);
            $table->index(['reportable_type', 'reportable_id']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_reports');
    }
};
