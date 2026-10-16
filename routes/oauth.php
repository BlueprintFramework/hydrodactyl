<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Atproto;

/*
|--------------------------------------------------------------------------
| AT Protocol OAuth Routes
|--------------------------------------------------------------------------
|
| These routes are registered directly in the "web" middleware group rather
| than the authenticated group, because they are public on purpose. PDS
| instances fetch the client metadata document anonymously, and the callback
| is the browser redirect target that must not require an authenticated
| session.
|
*/

Route::get('/oauth/client-metadata.json', [Atproto\OAuthController::class, 'metadata'])
    ->name('atproto.oauth.metadata');

Route::get('/oauth/callback', [Atproto\OAuthController::class, 'callback'])
    ->name('atproto.oauth.callback');
