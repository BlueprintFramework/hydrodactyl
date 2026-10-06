<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Admin;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Middleware\Admin\Servers\ServerInstalled;

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

    Route::group(['prefix' => 'servers'], function () {
        Route::get('/', [Admin\Api\ServerController::class, 'index'])->name('admin.api.servers');
        Route::get('/{server:id}', [Admin\Api\ServerController::class, 'view']);
        Route::patch('/{server:id}/details', [Admin\Api\ServerController::class, 'updateDetails']);
        Route::get('/{server:id}/build', [Admin\Api\ServerController::class, 'build']);
        Route::patch('/{server:id}/build', [Admin\Api\ServerController::class, 'updateBuild']);
        Route::get('/{server:id}/startup', [Admin\Api\ServerController::class, 'startup']);
        Route::patch('/{server:id}/startup', [Admin\Api\ServerController::class, 'updateStartup']);
        Route::get('/{server:id}/manage', [Admin\Api\ServerController::class, 'manage']);
        Route::get('/{server:id}/transfer/allocations', [Admin\Api\ServerController::class, 'transferAllocations']);
        Route::post('/{server:id}/manage/toggle', [Admin\Api\ServerController::class, 'toggleInstall']);
        Route::post('/{server:id}/manage/suspension', [Admin\Api\ServerController::class, 'suspension']);
        Route::post('/{server:id}/manage/reinstall', [Admin\Api\ServerController::class, 'reinstall']);
        Route::post('/{server:id}/manage/transfer', [Admin\Api\ServerController::class, 'transfer']);
        Route::delete('/{server:id}', [Admin\Api\ServerController::class, 'destroy']);
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

Route::get('/servers', [Admin\AppController::class, 'index'])->name('admin.servers');
Route::get('/servers/{id}', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view');
Route::get('/servers/{id}/details', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.details');
Route::get('/servers/{id}/build', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.build');
Route::get('/servers/{id}/startup', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.startup');
Route::get('/servers/{id}/manage', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.manage');
Route::get('/servers/{id}/delete', [Admin\AppController::class, 'index'])->where('id', '[0-9]+')->name('admin.servers.view.delete');

/*
|--------------------------------------------------------------------------
| Location Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/api
|
*/
Route::group(['prefix' => 'api'], function () {
    Route::get('/', [Admin\ApiController::class, 'index'])->name('admin.api.index');
    Route::get('/new', [Admin\ApiController::class, 'create'])->name('admin.api.new');

    Route::post('/new', [Admin\ApiController::class, 'store']);

    Route::delete('/revoke/{identifier}', [Admin\ApiController::class, 'delete'])->name('admin.api.delete');
});

/*
|--------------------------------------------------------------------------
| Database Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/databases
|
*/
Route::group(['prefix' => 'databases'], function () {
    Route::get('/', [Admin\DatabaseController::class, 'index'])->name('admin.databases');
    Route::get('/view/{host:id}', [Admin\DatabaseController::class, 'view'])->name('admin.databases.view');

    Route::post('/', [Admin\DatabaseController::class, 'create']);
    Route::post('/test', [Admin\DatabaseController::class, 'testConnection'])->name('admin.databases.test');
    Route::patch('/view/{host:id}', [Admin\DatabaseController::class, 'update']);
    Route::delete('/view/{host:id}', [Admin\DatabaseController::class, 'delete']);
});

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
Route::group(['prefix' => 'servers'], function () {
    // The creation wizard and the build/startup/database/mounts sub-pages have
    // not been rebuilt in the React admin yet, so they stay on the legacy
    // AdminLTE interface for now.
    Route::get('/new', [Admin\Servers\CreateServerController::class, 'index'])->name('admin.servers.new');

    Route::group(['middleware' => [ServerInstalled::class]], function () {
        Route::get('/view/{server:id}/database', [Admin\Servers\ServerViewController::class, 'database'])->name('admin.servers.view.database');
        Route::get('/view/{server:id}/mounts', [Admin\Servers\ServerViewController::class, 'mounts'])->name('admin.servers.view.mounts');

        Route::post('/view/{server:id}/database', [Admin\ServersController::class, 'newDatabase']);
        Route::patch('/view/{server:id}/database', [Admin\ServersController::class, 'resetDatabasePassword']);

        Route::delete('/view/{server:id}/database/{database:id}/delete', [Admin\ServersController::class, 'deleteDatabase'])->name('admin.servers.view.database.delete');
    });

    Route::post('/new', [Admin\Servers\CreateServerController::class, 'store']);
    Route::post('/view/{server:id}/mounts', [Admin\ServersController::class, 'addMount'])->name('admin.servers.view.mounts.store');
    Route::delete('/view/{server:id}/mounts/{mount:id}', [Admin\ServersController::class, 'deleteMount'])->name('admin.servers.view.mounts.delete');
});

/*
|--------------------------------------------------------------------------
| Mount Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/mounts
|
*/
Route::group(['prefix' => 'mounts'], function () {
    Route::get('/', [Admin\MountController::class, 'index'])->name('admin.mounts');
    Route::get('/view/{mount:id}', [Admin\MountController::class, 'view'])->name('admin.mounts.view');

    Route::post('/', [Admin\MountController::class, 'create']);
    Route::post('/{mount:id}/eggs', [Admin\MountController::class, 'addEggs'])->name('admin.mounts.eggs');
    Route::post('/{mount:id}/nodes', [Admin\MountController::class, 'addNodes'])->name('admin.mounts.nodes');

    Route::patch('/view/{mount:id}', [Admin\MountController::class, 'update']);

    Route::delete('/{mount:id}/eggs/{egg_id}', [Admin\MountController::class, 'deleteEgg']);
    Route::delete('/{mount:id}/nodes/{node_id}', [Admin\MountController::class, 'deleteNode']);
});

/*
|--------------------------------------------------------------------------
| Nest Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/nests
|
*/
Route::group(['prefix' => 'nests'], function () {
    Route::get('/', [Admin\Nests\NestController::class, 'index'])->name('admin.nests');
    Route::get('/new', [Admin\Nests\NestController::class, 'create'])->name('admin.nests.new');
    Route::get('/view/{nest:id}', [Admin\Nests\NestController::class, 'view'])->name('admin.nests.view');
    Route::get('/egg/new', [Admin\Nests\EggController::class, 'create'])->name('admin.nests.egg.new');
    Route::get('/egg/{egg:id}', [Admin\Nests\EggController::class, 'view'])->name('admin.nests.egg.view');
    Route::get('/egg/{egg:id}/export', [Admin\Nests\EggShareController::class, 'export'])->name('admin.nests.egg.export');
    Route::get('/egg/{egg:id}/variables', [Admin\Nests\EggVariableController::class, 'view'])->name('admin.nests.egg.variables');
    Route::get('/egg/{egg:id}/scripts', [Admin\Nests\EggScriptController::class, 'index'])->name('admin.nests.egg.scripts');

    Route::post('/new', [Admin\Nests\NestController::class, 'store']);
    Route::post('/import', [Admin\Nests\EggShareController::class, 'import'])->name('admin.nests.egg.import');
    Route::post('/importFromUrl', [Admin\Nests\EggShareController::class, 'importFromUrl'])->name('admin.nests.egg.import_url');
    Route::post('/egg/new', [Admin\Nests\EggController::class, 'store']);
    Route::post('/egg/{egg:id}/variables', [Admin\Nests\EggVariableController::class, 'store']);

    Route::put('/egg/{egg:id}', [Admin\Nests\EggShareController::class, 'update']);

    Route::patch('/view/{nest:id}', [Admin\Nests\NestController::class, 'update']);
    Route::patch('/egg/{egg:id}', [Admin\Nests\EggController::class, 'update']);
    Route::patch('/egg/{egg:id}/scripts', [Admin\Nests\EggScriptController::class, 'update']);
    Route::patch('/egg/{egg:id}/variables/{variable:id}', [Admin\Nests\EggVariableController::class, 'update'])->name('admin.nests.egg.variables.edit');

    Route::delete('/view/{nest:id}', [Admin\Nests\NestController::class, 'destroy']);
    Route::delete('/egg/{egg:id}', [Admin\Nests\EggController::class, 'destroy']);
    Route::delete('/egg/{egg:id}/variables/{variable:id}', [Admin\Nests\EggVariableController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| S3 Bucket Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /admin/buckets
|
*/
Route::group(['prefix' => 'buckets'], function () {
    Route::get('/', [Admin\S3Controller::class, 'index'])->name('admin.buckets');
    Route::get('/new', [Admin\S3Controller::class, 'create'])->name('admin.buckets.new');

    Route::post('/', [Admin\S3Controller::class, 'store']);

    Route::post('/test-connection', [Admin\S3Controller::class, 'testConnection'])->name('admin.buckets.test-connection');

    Route::get('/view/{s3}', [Admin\Buckets\BucketViewController::class, 'index'])->name('admin.buckets.view');
    Route::get('/view/{s3}/details', [Admin\Buckets\BucketViewController::class, 'details'])->name('admin.buckets.view.details');
    Route::get('/view/{s3}/servers', [Admin\Buckets\BucketViewController::class, 'servers'])->name('admin.buckets.view.servers');
    Route::get('/view/{s3}/delete', [Admin\Buckets\BucketViewController::class, 'delete'])->name('admin.buckets.view.delete');

    Route::post('/view/{s3}/details', [Admin\Buckets\BucketViewController::class, 'update']);
    Route::delete('/view/{s3}/delete', [Admin\S3Controller::class, 'delete']);
});
