<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Auth\SetupController;
use Pterodactyl\Http\Middleware\SetupRequired;

/*
|--------------------------------------------------------------------------
| First-run setup routes
|--------------------------------------------------------------------------
|
| Endpoint: /setup
|
| These routes only exist while the panel has zero users. The SetupRequired
| middleware returns a 404 for every request here the moment a single user
| has been created, so the surface closes itself off permanently once the
| initial administrator exists.
|
*/

Route::middleware(SetupRequired::class)->group(function () {
    Route::get('/setup', [SetupController::class, 'index'])->name('setup.index');
    Route::post('/setup', [SetupController::class, 'store'])->name('setup.store');
});
