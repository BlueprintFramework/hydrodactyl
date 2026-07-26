<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

/*
|--------------------------------------------------------------------------
| Marketplace install history
|--------------------------------------------------------------------------
|
| Tracks plugins/mods installed through the native installer. This lives in
| the panel database — NOT on the daemon filesystem — so the install history
| is private to the panel: it never appears in the file manager and is never
| bundled into a server backup/archive.
|
*/
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('marketplace_installs', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->unsignedInteger('server_id');
            $table->string('type', 16); // 'mod' | 'plugin'
            $table->string('source', 32);
            $table->string('project_id', 128);
            $table->string('project_title', 255);
            $table->string('version_id', 128);
            $table->string('version_name', 192);
            $table->string('filename', 255);
            $table->timestamp('installed_at')->nullable();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            // One record per (server, type, source, project); reinstall updates it.
            $table->unique(['server_id', 'type', 'source', 'project_id'], 'marketplace_installs_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_installs');
    }
};
