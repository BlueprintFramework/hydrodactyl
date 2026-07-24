<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('s3', function (Blueprint $table) {
            $table->boolean('is_local')->default(false)->after('enabled');
            $table->string('minio_instance_url')->nullable()->after('is_local');
        });
    }

    public function down(): void
    {
        Schema::table('s3', function (Blueprint $table) {
            $table->dropColumn(['is_local', 'minio_instance_url']);
        });
    }
};
