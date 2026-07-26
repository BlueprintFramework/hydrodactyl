<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->foreignId('bucket')
                  ->nullable()
                  ->after('backupDisk')
                  ->constrained('s3')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropForeign(['bucket']);
            $table->dropColumn('bucket');
        });
    }
};
