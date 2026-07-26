<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Wings;

use Illuminate\Http\Request;
use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Permission;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Services\Backups\BackupCoordinator;
use Pterodactyl\Repositories\Eloquent\BackupRepository;
use Pterodactyl\Transformers\Api\Client\BackupTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\StoreBackupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\RestoreBackupRequest;

class BackupController extends ClientApiController
{
    public function __construct(
        private BackupCoordinator $backupCoordinator,
        private BackupRepository $repository,
    ) {
        parent::__construct();
    }

    /**
     * List backups
     *
     * @throws AuthorizationException
     */
    public function index(Request $request, Server $server): array
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_READ, $server)) {
            throw new AuthorizationException();
        }

        $limit = min($request->query('per_page') ?? 20, 50);

        return $this->fractal->collection($server->backups()->paginate($limit))
            ->transformWith($this->getTransformer(BackupTransformer::class))
            ->addMeta([
                'backup_count' => $this->repository->getNonFailedBackups($server)->count(),
            ])
            ->toArray();
    }

    /**
     * Create a backup
     *
     * @throws \Throwable
     */
    public function store(StoreBackupRequest $request, Server $server): array
    {
        $isLocked = false;
        if ($request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            $isLocked = $request->boolean('is_locked');
        }

        $backup = $this->backupCoordinator->create(
            $server,
            $request->user(),
            $request->input('name'),
            $request->input('ignored') ?? '',
            $isLocked,
        );

        Activity::event('server:backup.start')
            ->subject($backup)
            ->property(['name' => $backup->name, 'locked' => $isLocked])
            ->log();

        return $this->fractal->item($backup)
            ->transformWith($this->getTransformer(BackupTransformer::class))
            ->toArray();
    }

    /**
     * Toggle backup lock
     *
     * @throws \Throwable
     * @throws AuthorizationException
     */
    public function toggleLock(Request $request, Server $server, Backup $backup): array
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $action = $backup->is_locked ? 'server:backup.unlock' : 'server:backup.lock';

        $backup->update(['is_locked' => !$backup->is_locked]);

        Activity::event($action)->subject($backup)->property('name', $backup->name)->log();

        return $this->fractal->item($backup)
            ->transformWith($this->getTransformer(BackupTransformer::class))
            ->toArray();
    }

    /**
     * View a backup
     *
     * @throws AuthorizationException
     */
    public function view(Request $request, Server $server, Backup $backup): array
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_READ, $server)) {
            throw new AuthorizationException();
        }

        return $this->fractal->item($backup)
            ->transformWith($this->getTransformer(BackupTransformer::class))
            ->toArray();
    }

    /**
     * Delete a backup
     *
     * @throws \Throwable
     */
    public function delete(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $this->backupCoordinator->delete($server, $backup);

        Activity::event('server:backup.delete')
            ->subject($backup)
            ->property(['name' => $backup->name, 'failed' => !$backup->is_successful])
            ->log();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Download a backup
     *
     * @throws \Throwable
     * @throws AuthorizationException
     */
    public function download(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DOWNLOAD, $server)) {
            throw new AuthorizationException();
        }

        if ($backup->disk !== BackupAdapter::S3 && $backup->disk !== BackupAdapter::Wings
            && !($backup->disk instanceof BackupAdapter && $backup->disk->isRustic())) {
            throw new BadRequestHttpException('The backup requested references an unknown disk driver type and cannot be downloaded.');
        }

        $url = $this->backupCoordinator->download($backup, $request->user());

        Activity::event('server:backup.download')->subject($backup)->property('name', $backup->name)->log();

        return new JsonResponse([
            'object' => 'signed_url',
            'attributes' => ['url' => $url],
        ]);
    }

    /**
     * Restore a backup
     *
     * @throws \Throwable
     */
    public function restore(RestoreBackupRequest $request, Server $server, Backup $backup): JsonResponse
    {
        $log = Activity::event('server:backup.restore')
            ->subject($backup)
            ->property(['name' => $backup->name, 'truncate' => $request->input('truncate')]);

        $log->transaction(function () use ($backup, $server, $request) {
            $this->backupCoordinator->restore(
                $server,
                $backup,
                $request->user(),
                $request->boolean('truncate'),
            );
        });

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
