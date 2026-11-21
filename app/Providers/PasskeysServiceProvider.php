<?php

namespace Pterodactyl\Providers;

use Pterodactyl\Models\User;
use Laravel\Passkeys\Passkeys;
use Illuminate\Support\ServiceProvider;

class PasskeysServiceProvider extends ServiceProvider
{
    /**
     * Register the panel's passkey integration.
     */
    public function register(): void
    {
        Passkeys::useUserModel(User::class);

        // The panel supplies TOTP-aware authentication routes below, so the
        // package's default passwordless login controller must not be exposed.
        Passkeys::ignoreRoutes();
    }
}
