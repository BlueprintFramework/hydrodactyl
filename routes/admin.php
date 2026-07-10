<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Admin;
use Pterodactyl\Http\Middleware\Admin\Servers\ServerInstalled;

/*
|--------------------------------------------------------------------------
| React SPA Entry Point
|--------------------------------------------------------------------------
|
| Serves the React admin SPA shell at /admin. The catch-all route at the
| bottom ensures any unmatched /admin/* path also loads the SPA, letting
| React handle client-side routing.
|
*/
Route::get('/', [Admin\BaseController::class, 'index'])->name('admin.index');

/*
|--------------------------------------------------------------------------
| Legacy Blade Routes (deprecated)
|--------------------------------------------------------------------------
|
| These routes serve the original AdminLTE Blade views. They are mounted
| under /admin/depr/ so they remain accessible while /admin/* serves the
| React SPA.
|
*/
Route::group(['prefix' => 'depr'], function () {

    /*
    |--------------------------------------------------------------------------
    | API Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/api
    |
    */
    Route::group(['prefix' => 'api'], function () {
        Route::get('/', [Admin\ApiController::class, 'index'])->name('admin.depr.api.index');
        Route::get('/new', [Admin\ApiController::class, 'create'])->name('admin.depr.api.new');

        Route::post('/new', [Admin\ApiController::class, 'store']);

        Route::delete('/revoke/{identifier}', [Admin\ApiController::class, 'delete'])->name('admin.depr.api.delete');
    });

    /*
    |--------------------------------------------------------------------------
    | Location Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/locations
    |
    */
    Route::group(['prefix' => 'locations'], function () {
        Route::get('/', [Admin\LocationController::class, 'index'])->name('admin.depr.locations');
        Route::get('/view/{location:id}', [Admin\LocationController::class, 'view'])->name('admin.depr.locations.view');

        Route::post('/', [Admin\LocationController::class, 'create']);
        Route::patch('/view/{location:id}', [Admin\LocationController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | Database Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/databases
    |
    */
    Route::group(['prefix' => 'databases'], function () {
        Route::get('/', [Admin\DatabaseController::class, 'index'])->name('admin.depr.databases');
        Route::get('/view/{host:id}', [Admin\DatabaseController::class, 'view'])->name('admin.depr.databases.view');

        Route::post('/', [Admin\DatabaseController::class, 'create']);
        Route::post('/test', [Admin\DatabaseController::class, 'testConnection'])->name('admin.depr.databases.test');
        Route::patch('/view/{host:id}', [Admin\DatabaseController::class, 'update']);
        Route::delete('/view/{host:id}', [Admin\DatabaseController::class, 'delete']);
    });

    /*
    |--------------------------------------------------------------------------
    | Settings Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/settings
    |
    */
    Route::group(['prefix' => 'settings'], function () {
        Route::get('/', [Admin\Settings\IndexController::class, 'index'])->name('admin.depr.settings');
        Route::get('/mail', [Admin\Settings\MailController::class, 'index'])->name('admin.depr.settings.mail');
        Route::get('/advanced', [Admin\Settings\AdvancedController::class, 'index'])->name('admin.depr.settings.advanced');
        Route::get('/captcha', [Admin\Settings\CaptchaController::class, 'index'])->name('admin.depr.settings.captcha');
        Route::get('/logo', [Admin\Settings\LogoController::class, 'index'])->name('admin.depr.settings.logo');

        Route::group(['prefix' => 'domains'], function () {
            Route::get('/', [Admin\Settings\DomainsController::class, 'index'])->name('admin.depr.settings.domains.index');
            Route::get('/create', [Admin\Settings\DomainsController::class, 'create'])->name('admin.depr.settings.domains.create');
            Route::get('/{domain}/edit', [Admin\Settings\DomainsController::class, 'edit'])->name('admin.depr.settings.domains.edit');

            Route::post('/', [Admin\Settings\DomainsController::class, 'store'])->name('admin.depr.settings.domains.store');
            Route::patch('/{domain}', [Admin\Settings\DomainsController::class, 'update'])->name('admin.depr.settings.domains.update');
            Route::delete('/{domain}', [Admin\Settings\DomainsController::class, 'destroy'])->name('admin.depr.settings.domains.destroy');

            Route::post('/test-connection', [Admin\Settings\DomainsController::class, 'testConnection'])->name('admin.depr.settings.domains.test-connection');
            Route::get('/provider-schema/{provider}', [Admin\Settings\DomainsController::class, 'getProviderSchema'])->name('admin.depr.settings.domains.provider-schema');
        });

        Route::post('/mail/test', [Admin\Settings\MailController::class, 'test'])->name('admin.depr.settings.mail.test');

        Route::patch('/', [Admin\Settings\IndexController::class, 'update']);
        Route::patch('/mail', [Admin\Settings\MailController::class, 'update']);
        Route::patch('/advanced', [Admin\Settings\AdvancedController::class, 'update']);
        Route::patch('/captcha', [Admin\Settings\CaptchaController::class, 'update']);
        Route::patch('/logo', [Admin\Settings\LogoController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | User Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/users
    |
    */
    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [Admin\UserController::class, 'index'])->name('admin.depr.users');
        Route::get('/accounts.json', [Admin\UserController::class, 'json'])->name('admin.depr.users.json');
        Route::get('/new', [Admin\UserController::class, 'create'])->name('admin.depr.users.new');
        Route::get('/view/{user:id}', [Admin\UserController::class, 'view'])->name('admin.depr.users.view');

        Route::post('/new', [Admin\UserController::class, 'store']);

        Route::patch('/view/{user:id}', [Admin\UserController::class, 'update']);
        Route::delete('/view/{user:id}', [Admin\UserController::class, 'delete']);
    });

    /*
    |--------------------------------------------------------------------------
    | Server Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/servers
    |
    */
    Route::group(['prefix' => 'servers'], function () {
        Route::get('/', [Admin\Servers\ServerController::class, 'index'])->name('admin.depr.servers');
        Route::get('/new', [Admin\Servers\CreateServerController::class, 'index'])->name('admin.depr.servers.new');
        Route::get('/view/{server:id}', [Admin\Servers\ServerViewController::class, 'index'])->name('admin.depr.servers.view');

        Route::group(['middleware' => [ServerInstalled::class]], function () {
            Route::get('/view/{server:id}/details', [Admin\Servers\ServerViewController::class, 'details'])->name('admin.depr.servers.view.details');
            Route::get('/view/{server:id}/build', [Admin\Servers\ServerViewController::class, 'build'])->name('admin.depr.servers.view.build');
            Route::get('/view/{server:id}/startup', [Admin\Servers\ServerViewController::class, 'startup'])->name('admin.depr.servers.view.startup');
            Route::get('/view/{server:id}/database', [Admin\Servers\ServerViewController::class, 'database'])->name('admin.depr.servers.view.database');
            Route::get('/view/{server:id}/mounts', [Admin\Servers\ServerViewController::class, 'mounts'])->name('admin.depr.servers.view.mounts');
        });

        Route::get('/view/{server:id}/manage', [Admin\Servers\ServerViewController::class, 'manage'])->name('admin.depr.servers.view.manage');
        Route::get('/view/{server:id}/delete', [Admin\Servers\ServerViewController::class, 'delete'])->name('admin.depr.servers.view.delete');

        Route::post('/new', [Admin\Servers\CreateServerController::class, 'store']);
        Route::post('/view/{server:id}/build', [Admin\ServersController::class, 'updateBuild']);
        Route::post('/view/{server:id}/startup', [Admin\ServersController::class, 'saveStartup']);
        Route::post('/view/{server:id}/database', [Admin\ServersController::class, 'newDatabase']);
        Route::post('/view/{server:id}/mounts', [Admin\ServersController::class, 'addMount'])->name('admin.depr.servers.view.mounts.store');
        Route::post('/view/{server:id}/manage/toggle', [Admin\ServersController::class, 'toggleInstall'])->name('admin.depr.servers.view.manage.toggle');
        Route::post('/view/{server:id}/manage/suspension', [Admin\ServersController::class, 'manageSuspension'])->name('admin.depr.servers.view.manage.suspension');
        Route::post('/view/{server:id}/manage/reinstall', [Admin\ServersController::class, 'reinstallServer'])->name('admin.depr.servers.view.manage.reinstall');
        Route::post('/view/{server:id}/manage/transfer', [Admin\Servers\ServerTransferController::class, 'transfer'])->name('admin.depr.servers.view.manage.transfer');
        Route::post('/view/{server:id}/delete', [Admin\ServersController::class, 'delete']);

        Route::patch('/view/{server:id}/details', [Admin\ServersController::class, 'setDetails']);
        Route::patch('/view/{server:id}/database', [Admin\ServersController::class, 'resetDatabasePassword']);

        Route::delete('/view/{server:id}/database/{database:id}/delete', [Admin\ServersController::class, 'deleteDatabase'])->name('admin.depr.servers.view.database.delete');
        Route::delete('/view/{server:id}/mounts/{mount:id}', [Admin\ServersController::class, 'deleteMount'])
            ->name('admin.depr.servers.view.mounts.delete');
    });

    /*
    |--------------------------------------------------------------------------
    | Node Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/nodes
    |
    */
    Route::group(['prefix' => 'nodes'], function () {
        Route::get('/', [Admin\Nodes\NodeController::class, 'index'])->name('admin.depr.nodes');
        Route::get('/new', [Admin\NodesController::class, 'create'])->name('admin.depr.nodes.new');
        Route::get('/view/{node:id}', [Admin\Nodes\NodeViewController::class, 'index'])->name('admin.depr.nodes.view');
        Route::get('/view/{node:id}/settings', [Admin\Nodes\NodeViewController::class, 'settings'])->name('admin.depr.nodes.view.settings');
        Route::get('/view/{node:id}/configuration', [Admin\Nodes\NodeViewController::class, 'configuration'])->name('admin.depr.nodes.view.configuration');
        Route::get('/view/{node:id}/allocation', [Admin\Nodes\NodeViewController::class, 'allocations'])->name('admin.depr.nodes.view.allocation');
        Route::get('/view/{node:id}/servers', [Admin\Nodes\NodeViewController::class, 'servers'])->name('admin.depr.nodes.view.servers');
        Route::get('/view/{node:id}/system-information', Admin\Nodes\SystemInformationController::class);

        Route::post('/new', [Admin\NodesController::class, 'store']);
        Route::post('/view/{node:id}/allocation', [Admin\NodesController::class, 'createAllocation']);
        Route::post('/view/{node:id}/allocation/remove', [Admin\NodesController::class, 'allocationRemoveBlock'])->name('admin.depr.nodes.view.allocation.removeBlock');
        Route::post('/view/{node:id}/allocation/alias', [Admin\NodesController::class, 'allocationSetAlias'])->name('admin.depr.nodes.view.allocation.setAlias');
        Route::post('/view/{node:id}/settings/token', Admin\NodeAutoDeployController::class)->name('admin.depr.nodes.view.configuration.token');

        Route::patch('/view/{node:id}/settings', [Admin\NodesController::class, 'updateSettings']);

        Route::delete('/view/{node:id}/delete', [Admin\NodesController::class, 'delete'])->name('admin.depr.nodes.view.delete');
        Route::delete('/view/{node:id}/allocation/remove/{allocation:id}', [Admin\NodesController::class, 'allocationRemoveSingle'])->name('admin.depr.nodes.view.allocation.removeSingle');
        Route::delete('/view/{node:id}/allocations', [Admin\NodesController::class, 'allocationRemoveMultiple'])->name('admin.depr.nodes.view.allocation.removeMultiple');
    });

    /*
    |--------------------------------------------------------------------------
    | Mount Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/mounts
    |
    */
    Route::group(['prefix' => 'mounts'], function () {
        Route::get('/', [Admin\MountController::class, 'index'])->name('admin.depr.mounts');
        Route::get('/view/{mount:id}', [Admin\MountController::class, 'view'])->name('admin.depr.mounts.view');

        Route::post('/', [Admin\MountController::class, 'create']);
        Route::post('/{mount:id}/eggs', [Admin\MountController::class, 'addEggs'])->name('admin.depr.mounts.eggs');
        Route::post('/{mount:id}/nodes', [Admin\MountController::class, 'addNodes'])->name('admin.depr.mounts.nodes');

        Route::patch('/view/{mount:id}', [Admin\MountController::class, 'update']);

        Route::delete('/{mount:id}/eggs/{egg_id}', [Admin\MountController::class, 'deleteEgg']);
        Route::delete('/{mount:id}/nodes/{node_id}', [Admin\MountController::class, 'deleteNode']);
    });

    /*
    |--------------------------------------------------------------------------
    | Nest Controller Routes (Legacy)
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/nests
    |
    */
    Route::group(['prefix' => 'nests'], function () {
        Route::get('/', [Admin\Nests\NestController::class, 'index'])->name('admin.depr.nests');
        Route::get('/new', [Admin\Nests\NestController::class, 'create'])->name('admin.depr.nests.new');
        Route::get('/view/{nest:id}', [Admin\Nests\NestController::class, 'view'])->name('admin.depr.nests.view');
        Route::get('/egg/new', [Admin\Nests\EggController::class, 'create'])->name('admin.depr.nests.egg.new');
        Route::get('/egg/{egg:id}', [Admin\Nests\EggController::class, 'view'])->name('admin.depr.nests.egg.view');
        Route::get('/egg/{egg:id}/export', [Admin\Nests\EggShareController::class, 'export'])->name('admin.depr.nests.egg.export');
        Route::get('/egg/{egg:id}/variables', [Admin\Nests\EggVariableController::class, 'view'])->name('admin.depr.nests.egg.variables');
        Route::get('/egg/{egg:id}/scripts', [Admin\Nests\EggScriptController::class, 'index'])->name('admin.depr.nests.egg.scripts');

        Route::post('/new', [Admin\Nests\NestController::class, 'store']);
        Route::post('/import', [Admin\Nests\EggShareController::class, 'import'])->name('admin.depr.nests.egg.import');
        Route::post('/importFromUrl', [Admin\Nests\EggShareController::class, 'importFromUrl'])->name('admin.depr.nests.egg.import_url');
        Route::post('/egg/new', [Admin\Nests\EggController::class, 'store']);
        Route::post('/egg/{egg:id}/variables', [Admin\Nests\EggVariableController::class, 'store']);

        Route::put('/egg/{egg:id}', [Admin\Nests\EggShareController::class, 'update']);

        Route::patch('/view/{nest:id}', [Admin\Nests\NestController::class, 'update']);
        Route::patch('/egg/{egg:id}', [Admin\Nests\EggController::class, 'update']);
        Route::patch('/egg/{egg:id}/scripts', [Admin\Nests\EggScriptController::class, 'update']);
        Route::patch('/egg/{egg:id}/variables/{variable:id}', [Admin\Nests\EggVariableController::class, 'update'])->name('admin.depr.nests.egg.variables.edit');

        Route::delete('/view/{nest:id}', [Admin\Nests\NestController::class, 'destroy']);
        Route::delete('/egg/{egg:id}', [Admin\Nests\EggController::class, 'destroy']);
        Route::delete('/egg/{egg:id}/variables/{variable:id}', [Admin\Nests\EggVariableController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | S3 Bucket Controller Routes
    |--------------------------------------------------------------------------
    |
    | Endpoint: /admin/depr/buckets
    |
    */
    Route::group(['prefix' => 'buckets'], function () {
        Route::get('/', [Admin\S3Controller::class, 'index'])->name('admin.depr.buckets');
        Route::get('/new', [Admin\S3Controller::class, 'create'])->name('admin.depr.buckets.new');

        Route::post('/', [Admin\S3Controller::class, 'store']);

        Route::post('/test-connection', [Admin\S3Controller::class, 'testConnection'])->name('admin.depr.buckets.test-connection');
        Route::post('/provision-local', [Admin\S3Controller::class, 'provisionLocal'])->name('admin.depr.buckets.provision-local');

        Route::get('/view/{s3}', [Admin\Buckets\BucketViewController::class, 'index'])->name('admin.depr.buckets.view');
        Route::get('/view/{s3}/details', [Admin\Buckets\BucketViewController::class, 'details'])->name('admin.depr.buckets.view.details');
        Route::get('/view/{s3}/servers', [Admin\Buckets\BucketViewController::class, 'servers'])->name('admin.depr.buckets.view.servers');
        Route::get('/view/{s3}/delete', [Admin\Buckets\BucketViewController::class, 'delete'])->name('admin.depr.buckets.view.delete');

        Route::post('/view/{s3}/details', [Admin\Buckets\BucketViewController::class, 'update']);
        Route::delete('/view/{s3}/delete', [Admin\S3Controller::class, 'delete']);
    });

});

/*
|--------------------------------------------------------------------------
| React SPA Catch-all
|--------------------------------------------------------------------------
|
| Any unmatched /admin/{any} GET route serves the React SPA shell. This
| allows client-side routing to work for all /admin/* paths.
|
*/
Route::get('/{any}', [Admin\BaseController::class, 'index'])->where('any', '.*');
