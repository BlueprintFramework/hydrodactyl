<?php


use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Controllers\Api\Client\Servers;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Controllers\Api\Client\Servers\Calagopus;
use Pterodactyl\Http\Middleware\Api\Client\Server\CheckDaemonType;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;

/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/calagopus/{server}
|
*/

Route::group([
    'prefix' => '/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
        CheckDaemonType::class . ':calagopus',
    ],
], function () {
    Route::get('/', [Calagopus\ServerController::class, 'index'])->name('api:client:server.calagopus.view');
    Route::get('/websocket', Calagopus\WebsocketController::class)->name('api:client:server.calagopus.ws');
    Route::get('/resources', Calagopus\ResourceUtilizationController::class)->name('api:client:server.calagopus.resources');
    Route::get('/activity', Calagopus\ActivityLogController::class)->name('api:client:server.calagopus.activity');

    Route::post('/command', [Calagopus\CommandController::class, 'index']);
    Route::post('/power', [Calagopus\PowerController::class, 'index']);

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Calagopus\DatabaseController::class, 'index']);
        Route::post('/', [Calagopus\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Calagopus\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Calagopus\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', [Calagopus\FileController::class, 'directory']);
        Route::get('/contents', [Calagopus\FileController::class, 'contents']);
        Route::get('/download', [Calagopus\FileController::class, 'download']);
        Route::put('/rename', [Calagopus\FileController::class, 'rename']);
        Route::post('/copy', [Calagopus\FileController::class, 'copy']);
        Route::post('/write', [Calagopus\FileController::class, 'write']);
        Route::post('/compress', [Calagopus\FileController::class, 'compress']);
        Route::post('/decompress', [Calagopus\FileController::class, 'decompress']);
        Route::post('/delete', [Calagopus\FileController::class, 'delete']);
        Route::post('/create-folder', [Calagopus\FileController::class, 'create']);
        Route::post('/chmod', [Calagopus\FileController::class, 'chmod']);
        Route::post('/pull', [Calagopus\FileController::class, 'pull'])->middleware(['throttle:30,1']);
        Route::get('/upload', Calagopus\FileUploadController::class);
    });

    Route::group(['prefix' => '/schedules'], function () {
        Route::get('/', [Calagopus\ScheduleController::class, 'index']);
        Route::post('/', [Calagopus\ScheduleController::class, 'store']);
        Route::get('/{schedule}', [Calagopus\ScheduleController::class, 'view']);
        Route::post('/{schedule}', [Calagopus\ScheduleController::class, 'update']);
        Route::post('/{schedule}/execute', [Calagopus\ScheduleController::class, 'execute']);
        Route::delete('/{schedule}', [Calagopus\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Calagopus\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Calagopus\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Calagopus\ScheduleTaskController::class, 'delete']);
    });

    Route::group(['prefix' => '/network'], function () {
        Route::get('/allocations', [Calagopus\NetworkAllocationController::class, 'index']);
        Route::post('/allocations', [Calagopus\NetworkAllocationController::class, 'store']);
        Route::post('/allocations/{allocation}', [Calagopus\NetworkAllocationController::class, 'update']);
        Route::post('/allocations/{allocation}/primary', [Calagopus\NetworkAllocationController::class, 'setPrimary']);
        Route::delete('/allocations/{allocation}', [Calagopus\NetworkAllocationController::class, 'delete']);
    });

    Route::group(['prefix' => '/users'], function () {
        Route::get('/', [Servers\SubuserController::class, 'index']);
        Route::post('/', [Servers\SubuserController::class, 'store']);
        Route::get('/{user}', [Servers\SubuserController::class, 'view']);
        Route::post('/{user}', [Servers\SubuserController::class, 'update']);
        Route::delete('/{user}', [Servers\SubuserController::class, 'delete']);
    });

    Route::group(['prefix' => '/backups'], function () {
        Route::get('/', [Calagopus\BackupController::class, 'index']);
        Route::post('/', [Calagopus\BackupController::class, 'store']);
        Route::delete('/delete-all', [Calagopus\BackupController::class, 'deleteAll'])
            ->middleware('throttle:2,60');
        Route::post('/bulk-delete', [Calagopus\BackupController::class, 'bulkDelete'])
            ->middleware('throttle:10,60');
        Route::get('/{backup}', [Calagopus\BackupController::class, 'view']);
        Route::get('/{backup}/download', [Calagopus\BackupController::class, 'download']);
        Route::post('/{backup}/lock', [Calagopus\BackupController::class, 'toggleLock']);
        Route::post('/{backup}/restore', [Calagopus\BackupController::class, 'restore']);
        Route::delete('/{backup}', [Calagopus\BackupController::class, 'delete']);
    });

    Route::group(['prefix' => '/startup'], function () {
        Route::get('/', [Calagopus\StartupController::class, 'index']);
        Route::put('/variable', [Calagopus\StartupController::class, 'update']);
        Route::put('/command', [Calagopus\StartupController::class, 'updateCommand']);
        Route::get('/command/default', [Calagopus\StartupController::class, 'getDefaultCommand']);
        Route::post('/command/process', [Calagopus\StartupController::class, 'processCommand']);
    });

    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Calagopus\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Calagopus\SettingsController::class, 'reinstall']);
        Route::put('/docker-image', [Calagopus\SettingsController::class, 'dockerImage']);
        Route::post('/docker-image/revert', [Calagopus\SettingsController::class, 'revertDockerImage']);
        Route::put('/egg', [Calagopus\SettingsController::class, 'changeEgg']);
        Route::post('/egg/preview', [Calagopus\SettingsController::class, 'previewEggChange'])
            ->middleware('server.operation.rate-limit');
        Route::post('/egg/apply', [Calagopus\SettingsController::class, 'applyEggChange'])
            ->middleware('server.operation.rate-limit');
    });
});
