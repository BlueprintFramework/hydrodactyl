<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Full locale codes such as "en-US" or "pt-BR" need a little more room
        // than the historical two letter codes.
        Schema::table('users', function (Blueprint $table) {
            $table->string('language', 16)->default('en-US')->change();
        });

        // Carry existing two letter preferences over to their regional codes.
        DB::table('users')->where('language', 'en')->update(['language' => 'en-US']);
        DB::table('users')->where('language', 'es')->update(['language' => 'es-ES']);

        DB::table('settings')
            ->where('key', 'settings::app:locale')
            ->where('value', 'en')
            ->update(['value' => 'en-US']);

        DB::table('settings')
            ->where('key', 'settings::app:locale')
            ->where('value', 'es')
            ->update(['value' => 'es-ES']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')
            ->where('key', 'settings::app:locale')
            ->where('value', 'en-US')
            ->update(['value' => 'en']);

        DB::table('settings')
            ->where('key', 'settings::app:locale')
            ->where('value', 'es-ES')
            ->update(['value' => 'es']);

        DB::table('users')->where('language', 'en-US')->update(['language' => 'en']);
        DB::table('users')->where('language', 'es-ES')->update(['language' => 'es']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('language', 5)->default('en')->change();
        });
    }
};
