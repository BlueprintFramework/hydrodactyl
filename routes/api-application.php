<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Application;
use Pterodactyl\Http\Controllers\Base;



/*
|--------------------------------------------------------------------------
| Root Server Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/panel
|
*/

Route::group(['prefix' => '/panel'], function () {
    Route::get('/status', [Base\SystemStatusController::class, 'index']);
    Route::get('/counts', [Base\SystemStatusController::class, 'counts']);
    Route::get('/metrics/history', [Base\SystemStatusController::class, 'metricsHistory']);
});


/*
|--------------------------------------------------------------------------
| User Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/users
|
*/


Route::group(['prefix' => '/users'], function () {
    Route::get('/', [Application\Users\UserController::class, 'index'])->name('api.application.users');
    Route::get('/{user:id}', [Application\Users\UserController::class, 'view'])->name('api.application.users.view');
    Route::get('/external/{external_id}', [Application\Users\ExternalUserController::class, 'index'])->name('api.application.users.external');

    Route::post('/', [Application\Users\UserController::class, 'store']);
    Route::patch('/{user:id}', [Application\Users\UserController::class, 'update']);

    Route::delete('/{user:id}', [Application\Users\UserController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Node Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/nodes
|
*/
Route::group(['prefix' => '/nodes'], function () {
    Route::get('/', [Application\Nodes\NodeController::class, 'index'])->name('api.application.nodes');
    Route::get('/deployable', Application\Nodes\NodeDeploymentController::class);
    Route::get('/{node:id}', [Application\Nodes\NodeController::class, 'view'])->name('api.application.nodes.view');
    Route::get('/{node:id}/configuration', Application\Nodes\NodeConfigurationController::class);

    Route::post('/', [Application\Nodes\NodeController::class, 'store']);
    Route::patch('/{node:id}', [Application\Nodes\NodeController::class, 'update']);

    Route::delete('/{node:id}', [Application\Nodes\NodeController::class, 'delete']);

    Route::group(['prefix' => '/{node:id}/allocations'], function () {
        Route::get('/', [Application\Nodes\AllocationController::class, 'index'])->name('api.application.allocations');
        Route::post('/', [Application\Nodes\AllocationController::class, 'store']);
        Route::delete('/{allocation:id}', [Application\Nodes\AllocationController::class, 'delete'])->name('api.application.allocations.view');
    });
});

/*
|--------------------------------------------------------------------------
| Location Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/locations
|
*/
Route::group(['prefix' => '/locations'], function () {
    Route::get('/', [Application\Locations\LocationController::class, 'index'])->name('api.applications.locations');
    Route::get('/{location:id}', [Application\Locations\LocationController::class, 'view'])->name('api.application.locations.view');

    Route::post('/', [Application\Locations\LocationController::class, 'store']);
    Route::patch('/{location:id}', [Application\Locations\LocationController::class, 'update']);

    Route::delete('/{location:id}', [Application\Locations\LocationController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Server Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/servers
|
*/
Route::group(['prefix' => '/servers'], function () {
    Route::get('/', [Application\Servers\ServerController::class, 'index'])->name('api.application.servers');
    Route::get('/{server:id}', [Application\Servers\ServerController::class, 'view'])->name('api.application.servers.view');
    Route::get('/external/{external_id}', [Application\Servers\ExternalServerController::class, 'index'])->name('api.application.servers.external');

    Route::patch('/{server:id}/details', [Application\Servers\ServerDetailsController::class, 'details'])->name('api.application.servers.details');
    Route::patch('/{server:id}/build', [Application\Servers\ServerDetailsController::class, 'build'])->name('api.application.servers.build');
    Route::patch('/{server:id}/startup', [Application\Servers\StartupController::class, 'index'])->name('api.application.servers.startup');

    Route::post('/', [Application\Servers\ServerController::class, 'store']);
    Route::post('/{server:id}/suspend', [Application\Servers\ServerManagementController::class, 'suspend'])->name('api.application.servers.suspend');
    Route::post('/{server:id}/unsuspend', [Application\Servers\ServerManagementController::class, 'unsuspend'])->name('api.application.servers.unsuspend');
    Route::post('/{server:id}/reinstall', [Application\Servers\ServerManagementController::class, 'reinstall'])->name('api.application.servers.reinstall');

    Route::delete('/{server:id}', [Application\Servers\ServerController::class, 'delete']);
    Route::delete('/{server:id}/{force?}', [Application\Servers\ServerController::class, 'delete']);

    // Database Management Endpoint
    Route::group(['prefix' => '/{server:id}/databases'], function () {
        Route::get('/', [Application\Servers\DatabaseController::class, 'index'])->name('api.application.servers.databases');
        Route::get('/{database:id}', [Application\Servers\DatabaseController::class, 'view'])->name('api.application.servers.databases.view');

        Route::post('/', [Application\Servers\DatabaseController::class, 'store']);
        Route::post('/{database:id}/reset-password', [Application\Servers\DatabaseController::class, 'resetPassword']);

        Route::delete('/{database:id}', [Application\Servers\DatabaseController::class, 'delete']);
    });
});

/*
|--------------------------------------------------------------------------
| Settings Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/settings
|
*/
Route::group(['prefix' => '/settings'], function () {
    Route::get('/general', [Application\Settings\SettingsController::class, 'general']);
    Route::patch('/general', [Application\Settings\SettingsController::class, 'updateGeneral']);

    Route::get('/mail', [Application\Settings\SettingsController::class, 'mail']);
    Route::patch('/mail', [Application\Settings\SettingsController::class, 'updateMail']);
    Route::post('/mail/test', [Application\Settings\SettingsController::class, 'testMail']);

    Route::get('/captcha', [Application\Settings\SettingsController::class, 'captcha']);
    Route::patch('/captcha', [Application\Settings\SettingsController::class, 'updateCaptcha']);

    Route::get('/branding', [Application\Settings\SettingsController::class, 'branding']);
    Route::post('/branding', [Application\Settings\SettingsController::class, 'updateBranding']);

    Route::get('/advanced', [Application\Settings\SettingsController::class, 'advanced']);
    Route::patch('/advanced', [Application\Settings\SettingsController::class, 'updateAdvanced']);

    Route::get('/domains', [Application\Settings\SettingsController::class, 'domains']);
    Route::post('/domains', [Application\Settings\SettingsController::class, 'storeDomain']);
    Route::patch('/domains/{domain}', [Application\Settings\SettingsController::class, 'updateDomain']);
    Route::delete('/domains/{domain}', [Application\Settings\SettingsController::class, 'deleteDomain']);
    Route::post('/domains/test-connection', [Application\Settings\SettingsController::class, 'testConnection']);
    Route::get('/domains/provider-schema/{provider}', [Application\Settings\SettingsController::class, 'getProviderSchema']);
});

/*
|--------------------------------------------------------------------------
| Api-Key Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/api-keys
|
*/
Route::group(['prefix' => '/api-keys'], function () {
    Route::get('/', [Application\ApiKeys\ApiKeyController::class, 'index'])->name('api.application.api-keys');
    Route::get('/{key:id}', [Application\ApiKeys\ApiKeyController::class, 'view'])->name('api.application.api-keys.view');

    Route::post('/', [Application\ApiKeys\ApiKeyController::class, 'store']);
    Route::patch('/{key:id}', [Application\ApiKeys\ApiKeyController::class, 'update']);

    Route::delete('/{key:id}', [Application\ApiKeys\ApiKeyController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Database Host Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/database-hosts
|
*/
Route::group(['prefix' => '/database-hosts'], function () {
    Route::get('/', [Application\DatabaseHosts\DatabaseHostController::class, 'index'])->name('api.application.database-hosts');
    Route::get('/{host:id}', [Application\DatabaseHosts\DatabaseHostController::class, 'view'])->name('api.application.database-hosts.view');

    Route::post('/', [Application\DatabaseHosts\DatabaseHostController::class, 'store']);
    Route::patch('/{host:id}', [Application\DatabaseHosts\DatabaseHostController::class, 'update']);

    Route::delete('/{host:id}', [Application\DatabaseHosts\DatabaseHostController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| S3 Bucket Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/buckets
|
*/
Route::group(['prefix' => '/buckets'], function () {
    Route::get('/', [Application\S3\S3Controller::class, 'index'])->name('api.application.buckets');
    Route::get('/{bucket:id}', [Application\S3\S3Controller::class, 'view'])->name('api.application.buckets.view');

    Route::post('/', [Application\S3\S3Controller::class, 'store']);
    Route::patch('/{bucket:id}', [Application\S3\S3Controller::class, 'update']);

    Route::delete('/{bucket:id}', [Application\S3\S3Controller::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Mount Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/mounts
|
*/
Route::group(['prefix' => '/mounts'], function () {
    Route::get('/', [Application\Mounts\MountController::class, 'index'])->name('api.application.mounts');
    Route::get('/{mount:id}', [Application\Mounts\MountController::class, 'view'])->name('api.application.mounts.view');

    Route::post('/', [Application\Mounts\MountController::class, 'store']);
    Route::patch('/{mount:id}', [Application\Mounts\MountController::class, 'update']);

    Route::delete('/{mount:id}', [Application\Mounts\MountController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Nest Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/nests
|
*/
Route::group(['prefix' => '/nests'], function () {
    Route::get('/', [Application\Nests\NestController::class, 'index'])->name('api.application.nests');
    Route::get('/{nest:id}', [Application\Nests\NestController::class, 'view'])->name('api.application.nests.view');

    Route::post('/', [Application\Nests\NestController::class, 'store']);
    Route::patch('/{nest:id}', [Application\Nests\NestController::class, 'update']);

    Route::post('/{nest:id}/icon', [Application\Nests\NestController::class, 'updateIcon'])->name('api.application.nests.icon');

    Route::delete('/{nest:id}', [Application\Nests\NestController::class, 'delete']);

    // Egg Management Endpoint
    Route::group(['prefix' => '/{nest:id}/eggs'], function () {
        Route::get('/', [Application\Nests\EggController::class, 'index'])->name('api.application.nests.eggs');
        Route::get('/{egg:id}', [Application\Nests\EggController::class, 'view'])->name('api.application.nests.eggs.view');

        Route::post('/', [Application\Nests\EggController::class, 'store']);
        Route::patch('/{egg:id}', [Application\Nests\EggController::class, 'update']);

        Route::delete('/{egg:id}', [Application\Nests\EggController::class, 'delete']);

        // Egg Variable Management Endpoint
        Route::group(['prefix' => '/{egg:id}/variables'], function () {
            Route::get('/', [Application\Nests\EggVariableController::class, 'index'])->name('api.application.nests.eggs.variables');
            Route::get('/{variable:id}', [Application\Nests\EggVariableController::class, 'view'])->name('api.application.nests.eggs.variables.view');

            Route::post('/', [Application\Nests\EggVariableController::class, 'store']);
            Route::patch('/{variable:id}', [Application\Nests\EggVariableController::class, 'update']);

            Route::delete('/{variable:id}', [Application\Nests\EggVariableController::class, 'delete']);
        });
    });
});
