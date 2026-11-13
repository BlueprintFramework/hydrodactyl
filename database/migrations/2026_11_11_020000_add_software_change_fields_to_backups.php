<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('backups', function (Blueprint $table) {
            $table->boolean('is_software_change')->default(false)->after('is_automatic');
            $table->timestamp('expires_at')->nullable()->after('completed_at');
            $table->index(['server_id', 'is_software_change', 'expires_at'], 'backups_software_change_expiry_idx');
        });
    }

    public function down(): void
    {
        Schema::table('backups', function (Blueprint $table) {
            $table->dropIndex('backups_software_change_expiry_idx');
            $table->dropColumn(['is_software_change', 'expires_at']);
        });
    }
};
