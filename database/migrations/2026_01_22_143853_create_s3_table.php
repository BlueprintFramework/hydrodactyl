<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('s3', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->text('access_key');
            $table->text('secret_key');
            $table->text('bucket_name');
            $table->string('endpoint')->nullable();
            $table->boolean('use_path_style_endpoint')->default(false)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('s3');
    }
};
