<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Middleware\PasskeyErrorResponse;
use Pterodactyl\Http\Controllers\Auth\PasskeyController;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Laravel\Passkeys\Http\Controllers\PasskeyRegistrationController;

Route::middleware(['auth', PasskeyErrorResponse::class])->group(function () {
    Route::get('/user/passkeys', [PasskeyController::class, 'index'])->name('account.passkeys.index');
    Route::get('/user/passkeys/options', [PasskeyRegistrationController::class, 'index'])->name('account.passkeys.options');
    Route::post('/user/passkeys', [PasskeyRegistrationController::class, 'store'])->name('account.passkeys.store');
    Route::delete('/user/passkeys/{passkey}', [PasskeyRegistrationController::class, 'destroy'])->name('account.passkeys.destroy');
});

Route::get('/', [Base\IndexController::class, 'index'])->name('index')->fallback();
Route::get('/account', [Base\IndexController::class, 'index'])
  ->withoutMiddleware(RequireTwoFactorAuthentication::class)
  ->name('account');

Route::get('/locales/locale.json', Base\LocaleController::class)
  ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
  ->where('namespace', '.*');

Route::get('/locales/{locale}/ui.json', Base\LocaleDictionaryController::class)
  ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
  ->where('locale', '[a-z]{2,3}(-[A-Za-z0-9]{2,8})*');

Route::get('/{react}', [Base\IndexController::class, 'index'])
  ->where('react', '^(?!(\/)?(api|auth|admin|daemon|setup)).+');
