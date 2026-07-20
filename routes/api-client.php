<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\CheckDaemonType;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Controllers\Api\Client\Servers\MarketplaceController;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Activity\AccountSubject;
use Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client
|
*/

Route::get('/', [Client\ClientController::class, 'index'])->name('api:client.index');
Route::get('/filter-options', [Client\ClientController::class, 'filterOptions'])->name('api:client.filter-options');
Route::get('/permissions', [Client\ClientController::class, 'permissions']);
Route::get('/version', function () {
    return response()->json(['version' => config('app.version')]);
});

Route::prefix('/nests')->group(function () {
    Route::get('/', [Client\Nests\NestController::class, 'index'])->name('api:client.nests');
    Route::get('/{nest}', [Client\Nests\NestController::class, 'view'])->name('api:client.nests.view');
});

Route::prefix('/account')->middleware(AccountSubject::class)->group(function () {
    Route::prefix('/')->withoutMiddleware(RequireTwoFactorAuthentication::class)->group(function () {
        Route::get('/', [Client\AccountController::class, 'index'])->name('api:client.account');
        Route::get('/two-factor', [Client\TwoFactorController::class, 'index']);
        Route::post('/two-factor', [Client\TwoFactorController::class, 'store']);
        Route::post('/two-factor/disable', [Client\TwoFactorController::class, 'delete']);
    });

    Route::put('/email', [Client\AccountController::class, 'updateEmail'])->name('api:client.account.update-email');
    Route::put('/password', [Client\AccountController::class, 'updatePassword'])->name('api:client.account.update-password');

    Route::get('/activity', Client\ActivityLogController::class)->name('api:client.account.activity');

    Route::get('/api-keys', [Client\ApiKeyController::class, 'index']);
    Route::post('/api-keys', [Client\ApiKeyController::class, 'store']);
    Route::delete('/api-keys/{identifier}', [Client\ApiKeyController::class, 'delete']);

    Route::prefix('/ssh-keys')->group(function () {
        Route::get('/', [Client\SSHKeyController::class, 'index']);
        Route::post('/', [Client\SSHKeyController::class, 'store']);
        Route::post('/remove', [Client\SSHKeyController::class, 'delete']);
    });
});

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/{server}
|
*/

Route::group([
    'prefix' => '/servers/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
    ],
], function () {
    Route::get('/', [Client\ServerController::class, 'index'])->name('api.client.servers.daemonType');
    Route::get('/resources', [Client\ServerController::class, 'resources'])->name('api.client.servers.resources');

    Route::group(['prefix' => '/subdomain'], function () {
        Route::get('/', [Elytra\SubdomainController::class, 'index']);
        Route::post('/', [Elytra\SubdomainController::class, 'store'])
            ->middleware('throttle:10,1');
        Route::delete('/', [Elytra\SubdomainController::class, 'destroy'])
            ->middleware('throttle:10,1');
        Route::post('/check-availability', [Elytra\SubdomainController::class, 'checkAvailability'])
            ->middleware('throttle:25,1');
    });

    // Native plugin/mod installer (Minecraft). Browse/search are cached and
    // throttled; the actual file transfer happens via the per-daemon pull.
    Route::group(['prefix' => '/marketplace', 'middleware' => ['throttle:30,1']], function () {
        Route::get('/search', [MarketplaceController::class, 'search'])->name('api.client.servers.marketplace.search');
        Route::get('/project', [MarketplaceController::class, 'project'])->name('api.client.servers.marketplace.project');
        // Resolve yields a daemon-pulled download URL, so it gets a tighter
        // limiter than browse (caps upstream amplification per user).
        Route::get('/resolve', [MarketplaceController::class, 'resolve'])
            ->name('api.client.servers.marketplace.resolve');

        // Install history. Stored in the panel database (not on the daemon) so
        // it stays private — invisible in the file manager and out of backups.
        Route::get('/installed', [MarketplaceController::class, 'installed'])
            ->name('api.client.servers.marketplace.installed');
        Route::post('/installed', [MarketplaceController::class, 'store']);
        Route::delete('/installed', [MarketplaceController::class, 'destroy']);

        // Cached Modrinth loader-tag list, so egg-feature loaders are validated
        // against the live set instead of a hard-coded list.
        Route::get('/loaders', [MarketplaceController::class, 'loaders'])
            ->name('api.client.servers.marketplace.loaders');

        Route::get('/game-versions', [MarketplaceController::class, 'gameVersions'])
            ->name('api.client.servers.marketplace.game-versions');
    });
});



/*
|--------------------------------------------------------------------------
| Client Control API(Wings)
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/wings/{server}
|
*/

Route::group([
    'prefix' => 'servers/wings',
], function () {
    require __DIR__ . '/servers/wings.php';
});


/*
|--------------------------------------------------------------------------
| Client Control API(Elytra)
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/elytra/{server}
|
*/
Route::group([
    'prefix' => 'servers/elytra',
], function () {
    require __DIR__ . '/servers/elytra.php';
});
