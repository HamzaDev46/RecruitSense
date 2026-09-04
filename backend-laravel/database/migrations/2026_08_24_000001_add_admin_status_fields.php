<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'account_status')) {
                $table->string('account_status', 20)->default('active')->after('role')->index();
            }

            if (!Schema::hasColumn('users', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('account_status');
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'verification_status')) {
                $table->string('verification_status', 20)->default('verified')->after('founded_year')->index();
            }

            if (!Schema::hasColumn('companies', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('verification_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'admin_note')) {
                $table->dropColumn('admin_note');
            }

            if (Schema::hasColumn('users', 'account_status')) {
                $table->dropColumn('account_status');
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            if (Schema::hasColumn('companies', 'admin_note')) {
                $table->dropColumn('admin_note');
            }

            if (Schema::hasColumn('companies', 'verification_status')) {
                $table->dropColumn('verification_status');
            }
        });
    }
};
