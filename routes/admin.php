<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Admin;
use Pterodactyl\Http\Controllers\Base;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| The admin panel is being migrated from the legacy AdminLTE blade pages to a
| React SPA. The shell lives at "/admin" and is served by Admin\AppController.
|
| Only rebuilt pages are served by the shell. Every section still running on
| the legacy layout keeps its own server-rendered route below, and the React
| sidebar links to those with a full page load so nothing breaks mid-migration.
|
| TODO: once every section has been rebuilt and its legacy route removed,
| replace the individual route groups with a single catch-all that serves the
| shell, e.g.:
|
|     Route::get('/{path?}', [Admin\AppController::class, 'index'])->where('path', '.*');
|
*/

Route::get('/', [Admin\AppController::class, 'index'])->name('admin.index');

/*
|--------------------------------------------------------------------------
| Internal Admin API
|--------------------------------------------------------------------------
|
| Session-authenticated JSON endpoints consumed by the React admin SPA. These
| are internal to the dashboard, unlike the token-authenticated public API
| under /api/application.
|
*/
Route::group(['prefix' => 'api'], function () {
    Route::get('/system-status', [Base\SystemStatusController::class, 'index'])->name('admin.api.system-status');

    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [Admin\Api\UserController::class, 'index'])->name('admin.api.users');
        Route::get('/languages', [Admin\Api\UserController::class, 'languages'])->name('admin.api.users.languages');
        Route::get('/{user:id}', [Admin\Api\UserController::class, 'view'])->name('admin.api.users.view');
        Route::post('/', [Admin\Api\UserController::class, 'store'])->name('admin.api.users.store');
        Route::patch('/{user:id}', [Admin\Api\UserController::class, 'update'])->name('admin.api.users.update');
        Route::delete('/{user:id}', [Admin\Api\UserController::class, 'destroy'])->name('admin.api.users.destroy');
    });

    Route::get('/settings', [Admin\Api\SettingsController::class, 'index'])->name('admin.api.settings');
    Route::patch('/settings/general', [Admin\Api\SettingsController::class, 'updateGeneral']);
    Route::patch('/settings/advanced', [Admin\Api\SettingsController::class, 'updateAdvanced']);
    Route::patch('/settings/mail', [Admin\Api\SettingsController::class, 'updateMail']);
    Route::patch('/settings/captcha', [Admin\Api\SettingsController::class, 'updateCaptcha']);
    Route::patch('/settings/custom-navigation', [Admin\Api\SettingsController::class, 'updateCustomNavigation']);

    Route::group(['prefix' => 'settings/domains'], function () {
        Route::get('/', [Admin\Api\DomainsController::class, 'index'])->name('admin.api.settings.domains');
        Route::get('/providers/{provider}/schema', [Admin\Api\DomainsController::class, 'schema']);
        Route::post('/', [Admin\Api\DomainsController::class, 'store']);
        Route::post('/test-connection', [Admin\Api\DomainsController::class, 'testConnection']);
        Route::patch('/{domain}', [Admin\Api\DomainsController::class, 'update']);
        Route::delete('/{domain}', [Admin\Api\DomainsController::class, 'destroy']);
    });

    Route::get('/settings/logo', [Admin\Api\LogoController::class, 'index'])->name('admin.api.settings.logo');
    Route::post('/settings/logo', [Admin\Api\LogoController::class, 'update']);

    Route::group(['prefix' => 'nodes'], function () {
        Route::get('/', [Admin\Api\NodesController::class, 'index'])->name('admin.api.nodes');
        Route::get('/options', [Admin\Api\NodesController::class, 'options']);
        Route::get('/{node:id}', [Admin\Api\NodesController::class, 'view']);
        Route::get('/{node:id}/status', [Admin\Api\NodesController::class, 'status']);
        Route::post('/', [Admin\Api\NodesController::class, 'store']);
        Route::patch('/{node:id}', [Admin\Api\NodesController::class, 'update']);
        Route::delete('/{node:id}', [Admin\Api\NodesController::class, 'destroy']);

        Route::get('/{node:id}/configuration', [Admin\Api\NodeConfigurationController::class, 'index']);
        Route::post('/{node:id}/configuration/token', Admin\NodeAutoDeployController::class);

        Route::get('/{node:id}/allocations', [Admin\Api\NodeAllocationController::class, 'index']);
        Route::post('/{node:id}/allocations', [Admin\Api\NodeAllocationController::class, 'store']);
        Route::delete('/{node:id}/allocations', [Admin\Api\NodeAllocationController::class, 'destroyMultiple']);
        Route::post('/{node:id}/allocations/remove-block', [Admin\Api\NodeAllocationController::class, 'destroyBlock']);
        Route::post('/{node:id}/allocations/alias', [Admin\Api\NodeAllocationController::class, 'updateAlias']);
        Route::patch('/{node:id}/allocations/{allocation:id}', [Admin\Api\NodeAllocationController::class, 'setAlias']);
        Route::delete('/{node:id}/allocations/{allocation:id}', [Admin\Api\NodeAllocationController::class, 'destroy']);

        Route::get('/{node:id}/servers', [Admin\Api\NodeServersController::class, 'index']);
    });

    Route::group(['prefix' => 'locations'], function () {
        Route::get('/', [Admin\Api\LocationController::class, 'index'])->name('admin.api.locations');
        Route::get('/{location:id}', [Admin\Api\LocationController::class, 'view']);
        Route::post('/', [Admin\Api\LocationController::class, 'store']);
        Route::patch('/{location:id}', [Admin\Api\LocationController::class, 'update']);
        Route::delete('/{location:id}', [Admin\Api\LocationController::class, 'destroy']);
    });

    Route::group(['prefix' => 'database-hosts'], function () {
        Route::get('/', [Admin\Api\DatabaseHostController::class, 'index'])->name('admin.api.database-hosts');
        Route::get('/options', [Admin\Api\DatabaseHostController::class, 'options']);
        Route::post('/test', [Admin\Api\DatabaseHostController::class, 'testConnection']);
        Route::get('/{host:id}', [Admin\Api\DatabaseHostController::class, 'view']);
        Route::post('/', [Admin\Api\DatabaseHostController::class, 'store']);
        Route::patch('/{host:id}', [Admin\Api\DatabaseHostController::class, 'update']);
        Route::delete('/{host:id}', [Admin\Api\DatabaseHostController::class, 'destroy']);
    });

    Route::group(['prefix' => 'servers'], function () {
        Route::get('/', [Admin\Api\ServerController::class, 'index'])->name('admin.api.servers');
        Route::post('/', [Admin\Api\ServerController::class, 'store']);
        Route::get('/create', [Admin\Api\ServerController::class, 'create']);
        Route::get('/create/allocations', [Admin\Api\ServerController::class, 'createAllocations']);
        Route::get('/{server:id}', [Admin\Api\ServerController::class, 'view']);
        Route::patch('/{server:id}/details', [Admin\Api\ServerController::class, 'updateDetails']);
        Route::get('/{server:id}/build', [Admin\Api\ServerController::class, 'build']);
        Route::patch('/{server:id}/build', [Admin\Api\ServerController::class, 'updateBuild']);
        Route::get('/{server:id}/startup', [Admin\Api\ServerController::class, 'startup']);
        Route::patch('/{server:id}/startup', [Admin\Api\ServerController::class, 'updateStartup']);
        Route::get('/{server:id}/database', [Admin\Api\ServerController::class, 'database']);
        Route::post('/{server:id}/database', [Admin\Api\ServerController::class, 'storeDatabase']);
        Route::patch('/{server:id}/database/{database:id}', [Admin\Api\ServerController::class, 'resetDatabasePassword']);
        Route::delete('/{server:id}/database/{database:id}', [Admin\Api\ServerController::class, 'destroyDatabase']);
        Route::get('/{server:id}/mounts', [Admin\Api\ServerController::class, 'mounts']);
        Route::post('/{server:id}/mounts', [Admin\Api\ServerController::class, 'addMount']);
        Route::delete('/{server:id}/mounts/{mount:id}', [Admin\Api\ServerController::class, 'deleteMount']);
        Route::get('/{server:id}/manage', [Admin\Api\ServerController::class, 'manage']);
        Route::get('/{server:id}/transfer/allocations', [Admin\Api\ServerController::class, 'transferAllocations']);
        Route::post('/{server:id}/manage/toggle', [Admin\Api\ServerController::class, 'toggleInstall']);
        Route::post('/{server:id}/manage/suspension', [Admin\Api\ServerController::class, 'suspension']);
        Route::post('/{server:id}/manage/reinstall', [Admin\Api\ServerController::class, 'reinstall']);
        Route::post('/{server:id}/manage/transfer', [Admin\Api\ServerController::class, 'transfer']);
        Route::delete('/{server:id}', [Admin\Api\ServerController::class, 'destroy']);
    });

    Route::group(['prefix' => 'mounts'], function () {
        Route::get('/', [Admin\Api\MountController::class, 'index'])->name('admin.api.mounts');
        Route::get('/{mount:id}', [Admin\Api\MountController::class, 'view']);
        Route::post('/', [Admin\Api\MountController::class, 'store']);
        Route::patch('/{mount:id}', [Admin\Api\MountController::class, 'update']);
        Route::delete('/{mount:id}', [Admin\Api\MountController::class, 'destroy']);
        Route::post('/{mount:id}/eggs', [Admin\Api\MountController::class, 'addEggs']);
        Route::post('/{mount:id}/nodes', [Admin\Api\MountController::class, 'addNodes']);
        Route::delete('/{mount:id}/eggs/{egg}', [Admin\Api\MountController::class, 'deleteEgg']);
        Route::delete('/{mount:id}/nodes/{node}', [Admin\Api\MountController::class, 'deleteNode']);
    });

    Route::group(['prefix' => 'application-keys'], function () {
        Route::get('/', [Admin\Api\ApplicationApiController::class, 'index'])->name('admin.api.application-keys');
        Route::post('/', [Admin\Api\ApplicationApiController::class, 'store']);
        Route::delete('/{identifier}', [Admin\Api\ApplicationApiController::class, 'destroy']);
    });

    Route::group(['prefix' => 'nests'], function () {
        Route::get('/', [Admin\Api\NestController::class, 'index']);
        Route::post('/', [Admin\Api\NestController::class, 'store']);
        Route::post('/import', [Admin\Api\EggShareController::class, 'import']);
        Route::post('/import-url', [Admin\Api\EggShareController::class, 'importFromUrl']);
        Route::get('/{nest:id}', [Admin\Api\NestController::class, 'view']);
        Route::patch('/{nest:id}', [Admin\Api\NestController::class, 'update']);
        Route::delete('/{nest:id}', [Admin\Api\NestController::class, 'destroy']);
    });

    Route::group(['prefix' => 'eggs'], function () {
        Route::post('/', [Admin\Api\EggController::class, 'store']);
        Route::get('/{egg:id}', [Admin\Api\EggController::class, 'view']);
        Route::patch('/{egg:id}', [Admin\Api\EggController::class, 'update']);
        Route::delete('/{egg:id}', [Admin\Api\EggController::class, 'destroy']);
        Route::post('/{egg:id}/import', [Admin\Api\EggController::class, 'importUpdate']);
        Route::get('/{egg:id}/variables', [Admin\Api\EggController::class, 'variables']);
        Route::post('/{egg:id}/variables', [Admin\Api\EggController::class, 'storeVariable']);
        Route::patch('/{egg:id}/variables/{variable:id}', [Admin\Api\EggController::class, 'updateVariable']);
        Route::delete('/{egg:id}/variables/{variable:id}', [Admin\Api\EggController::class, 'destroyVariable']);
        Route::get('/{egg:id}/scripts', [Admin\Api\EggController::class, 'scripts']);
        Route::patch('/{egg:id}/scripts', [Admin\Api\EggController::class, 'updateScripts']);
    });

    Route::group(['prefix' => 'buckets'], function () {
        Route::get('/', [Admin\Api\BucketController::class, 'index']);
        Route::post('/', [Admin\Api\BucketController::class, 'store']);
        Route::post('/test-connection', [Admin\Api\BucketController::class, 'testConnection']);
        Route::get('/{s3:id}', [Admin\Api\BucketController::class, 'view']);
        Route::patch('/{s3:id}', [Admin\Api\BucketController::class, 'update']);
        Route::delete('/{s3:id}', [Admin\Api\BucketController::class, 'destroy']);
        Route::get('/{s3:id}/servers', [Admin\Api\BucketController::class, 'servers']);
    });
});

/*
|--------------------------------------------------------------------------
| Rebuilt Sections
|--------------------------------------------------------------------------
|
| Sections that have been rebuilt in the React admin are served by the shell,
| which handles the rest of the routing client-side. Their legacy routes are
| removed, though any route still referenced elsewhere (like the user
| autocomplete JSON) is kept.
|
*/
Route::get('/users', [Admin\AppController::class, 'index'])->name('admin.users');
Route::get('/users/new', [Admin\AppController::class, 'index'])->name('admin.users.new');
Route::get('/users/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.users.view');

Route::get('/settings', [Admin\AppController::class, 'index'])->name('admin.settings');
Route::get('/settings/advanced', [Admin\AppController::class, 'index'])->name('admin.settings.advanced');
Route::get('/settings/mail', [Admin\AppController::class, 'index'])->name('admin.settings.mail');
Route::get('/settings/captcha', [Admin\AppController::class, 'index'])->name('admin.settings.captcha');
Route::get('/settings/custom-navigation', [Admin\AppController::class, 'index'])->name('admin.settings.custom-navigation');
Route::get('/settings/domains', [Admin\AppController::class, 'index'])->name('admin.settings.domains.index');
Route::get('/settings/domains/new', [Admin\AppController::class, 'index'])->name('admin.settings.domains.create');
Route::get('/settings/domains/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.settings.domains.edit');
Route::get('/settings/logo', [Admin\AppController::class, 'index'])->name('admin.settings.logo');

Route::get('/nodes', [Admin\AppController::class, 'index'])->name('admin.nodes');
Route::get('/nodes/new', [Admin\AppController::class, 'index'])->name('admin.nodes.new');
Route::get('/nodes/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nodes.view');
Route::get('/nodes/{id}/settings', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nodes.view.settings');
Route::get('/nodes/{id}/configuration', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nodes.view.configuration');
Route::get('/nodes/{id}/allocation', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nodes.view.allocation');
Route::get('/nodes/{id}/servers', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nodes.view.servers');

Route::get('/locations', [Admin\AppController::class, 'index'])->name('admin.locations');
Route::get('/locations/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.locations.view');

Route::get('/databases', [Admin\AppController::class, 'index'])->name('admin.databases');
Route::get('/databases/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.databases.view');

Route::get('/servers', [Admin\AppController::class, 'index'])->name('admin.servers');
Route::get('/servers/new', [Admin\AppController::class, 'index'])->name('admin.servers.new');
Route::get('/servers/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view');
Route::get('/servers/{id}/details', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.details');
Route::get('/servers/{id}/build', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.build');
Route::get('/servers/{id}/startup', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.startup');
Route::get('/servers/{id}/database', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.database');
Route::get('/servers/{id}/mounts', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.mounts');

Route::get('/mounts', [Admin\AppController::class, 'index'])->name('admin.mounts');
Route::get('/mounts/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.mounts.view');
Route::get('/servers/{id}/manage', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.manage');
Route::get('/servers/{id}/delete', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.delete');

Route::get('/api', [Admin\AppController::class, 'index'])->name('admin.api.index');
Route::get('/api/new', [Admin\AppController::class, 'index'])->name('admin.api.new');

Route::get('/nests', [Admin\AppController::class, 'index'])->name('admin.nests');
Route::get('/nests/new', [Admin\AppController::class, 'index'])->name('admin.nests.new');
Route::get('/nests/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nests.view');

Route::get('/eggs/new', [Admin\AppController::class, 'index'])->name('admin.nests.egg.new');
Route::get('/eggs/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nests.egg.view');
Route::get('/eggs/{id}/variables', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nests.egg.variables');
Route::get('/eggs/{id}/scripts', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.nests.egg.scripts');

Route::get('/buckets', [Admin\AppController::class, 'index'])->name('admin.buckets');
Route::get('/buckets/new', [Admin\AppController::class, 'index'])->name('admin.buckets.new');
Route::get('/buckets/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.buckets.view');
Route::get('/buckets/{id}/details', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.buckets.view.details');
Route::get('/buckets/{id}/servers', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.buckets.view.servers');
Route::get('/buckets/{id}/delete', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.buckets.view.delete');

/*
|--------------------------------------------------------------------------
| Application API
|--------------------------------------------------------------------------
|
| The credentials page is served by the React shell; its JSON endpoints live
| under the internal admin API (/admin/api/application-keys).
|
*/

/*
|--------------------------------------------------------------------------
| Settings Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/settings
|
*/
Route::group(['prefix' => 'settings'], function () {
    Route::post('/mail/test', [Admin\Settings\MailController::class, 'test'])->name('admin.settings.mail.test');
});

/*
|--------------------------------------------------------------------------
| User Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/users
|
*/
Route::group(['prefix' => 'users'], function () {
    // Still used by the legacy server owner autocomplete on the server pages.
    Route::get('/accounts.json', [Admin\UserController::class, 'json'])->name('admin.users.json');
});

/*
|--------------------------------------------------------------------------
| Server Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/servers
|
*/
/*
|--------------------------------------------------------------------------
| Mount Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/mounts
|
*/
/*
|--------------------------------------------------------------------------
| Egg Export
|--------------------------------------------------------------------------
|
| A file download kept outside the shell so admins can export an egg.
|
*/
Route::get('/eggs/{egg:id}/export', [Admin\Nests\EggShareController::class, 'export'])->name('admin.nests.egg.export');

/*
|--------------------------------------------------------------------------
| S3 Buckets
|--------------------------------------------------------------------------
|
| The bucket pages are served by the React shell; their JSON endpoints live
| under the internal admin API (/admin/api/buckets).
|
*/
