<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('s3', function (Blueprint $table) {
            $table->string('region', 64)->default('us-east-1')->after('endpoint');
        });
    }

    public function down(): void
    {
        Schema::table('s3', function (Blueprint $table) {
            $table->dropColumn('region');
        });
    }
};
