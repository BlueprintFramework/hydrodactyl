<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Middleware\PasskeyErrorResponse;
use Pterodactyl\Http\Controllers\Auth\PasskeyLoginController;

/*
|--------------------------------------------------------------------------
| Passkey Authentication Routes
|--------------------------------------------------------------------------
|
| This route is intentionally outside /auth/login: the panel verifies the
| passkey first, then either creates the session or hands the user to the TOTP
| checkpoint. The browser client is configured with these paths in the React
| login component.
|
*/

Route::middleware(['guest', 'throttle:authentication', PasskeyErrorResponse::class])->group(function () {
    Route::get('/auth/passkeys/login/options', [PasskeyLoginController::class, 'options'])
        ->name('auth.passkeys.options');

    Route::post('/auth/passkeys/login', [PasskeyLoginController::class, 'authenticate'])
        ->name('auth.passkeys.login');
});
