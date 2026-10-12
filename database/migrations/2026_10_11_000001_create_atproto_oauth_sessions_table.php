<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('atproto_oauth_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // pending: an authorization flow is in progress; authorized: tokens stored.
            $table->string('status', 20)->default('pending');

            $table->string('account_did', 191)->nullable();
            $table->string('handle', 191)->nullable();
            $table->string('pds_url', 255)->nullable();
            $table->string('authorization_server', 255)->nullable();
            $table->text('scope')->nullable();

            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('access_token_expires_at')->nullable();

            // The per-session DPoP key. Tokens are bound to this key for the
            // lifetime of the session, so it must be preserved across requests.
            $table->text('dpop_private_key');

            // Server issued DPoP nonces, tracked separately per server.
            $table->string('dpop_nonce_pds', 255)->nullable();
            $table->string('dpop_nonce_as', 255)->nullable();

            // Values needed to complete a pending authorization flow.
            $table->string('state', 191)->nullable()->index();
            $table->string('code_verifier', 191)->nullable();
            $table->string('return_url', 500)->nullable();

            $table->timestamp('authorized_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atproto_oauth_sessions');
    }
};
