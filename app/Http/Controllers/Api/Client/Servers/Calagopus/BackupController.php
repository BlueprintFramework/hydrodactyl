<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Calagopus;

use Illuminate\Http\Request;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use PragmaRX\Google2FA\Google2FA;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Permission;
use Pterodactyl\Enums\BackupAdapter;
use Illuminate\Support\Facades\Crypt;
use Pterodactyl\Enums\Daemon\Adapters;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Repositories\Eloquent\BackupRepository;
use Pterodactyl\Transformers\Api\Client\BackupTransformer;
use Pterodactyl\Repositories\Calagopus\DaemonBackupRepository;
use Pterodactyl\Services\Backups\Calagopus\DeleteBackupService;
use Pterodactyl\Services\Backups\Calagopus\DownloadLinkService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Services\Backups\Calagopus\InitiateBackupService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\StoreBackupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\RestoreBackupRequest;

class BackupController extends ClientApiController
{
    /**
     * BackupController constructor.
     */
    public function __construct(
        private DaemonBackupRepository $daemonRepository,
        private DeleteBackupService $deleteBackupService,
        private InitiateBackupService $initiateBackupService,
        private DownloadLinkService $downloadLinkService,
        private BackupRepository $repository,
        private Google2FA $google2FA,
    ) {
        parent::__construct();
    }

    /**
     * List backups.
     *
     * @throws AuthorizationException
     */
    public function index(Request $request, Server $server): array
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_READ, $server)) {
            throw new AuthorizationException();
        }

        $limit = min($request->query('per_page') ?? 20, 50);

        // Calagopus stores every successful backup inside a node-side repository.
        // Report the same storage shape the client expects from other daemons.
        $repositoryBytes = $server->backups()
            ->where('is_successful', true)
            ->whereIn('disk', Adapters::all_calagopus())
            ->sum('bytes');

        $repositoryUsageMb = round($repositoryBytes / 1024 / 1024, 2);

        $backupLimit = $server->backup_limit;
        $backupCount = $this->repository->getNonFailedBackups($server)->count();
        $storageLimitMb = $server->backup_storage_limit;
        $hasStorageLimit = is_numeric($storageLimitMb) && $storageLimitMb > 0;

        return $this->fractal->collection($server->backups()->paginate($limit))
            ->transformWith($this->getTransformer(BackupTransformer::class))
            ->addMeta([
                'backup_count' => $backupCount,
                'storage' => [
                    'used_mb' => $repositoryUsageMb,
                    'legacy_usage_mb' => 0,
                    'repository_usage_mb' => $repositoryUsageMb,
                    'rustic_backup_sum_mb' => $repositoryUsageMb,
                    'overhead_mb' => 0,
                    'overhead_percent' => 0,
                    'needs_pruning' => false,
                    'limit_mb' => $hasStorageLimit ? (float) $storageLimitMb : null,
                    'has_limit' => $hasStorageLimit,
                    'usage_percentage' => $hasStorageLimit ? round(($repositoryUsageMb / $storageLimitMb) * 100, 1) : null,
                    'available_mb' => $hasStorageLimit ? max(0, (float) $storageLimitMb - $repositoryUsageMb) : null,
                    'is_over_limit' => $hasStorageLimit ? $repositoryUsageMb > (float) $storageLimitMb : false,
                ],
                'limits' => [
                    'count_limit' => $backupLimit,
                    'has_count_limit' => $backupLimit !== null && $backupLimit > 0,
                    'storage_limit_mb' => $hasStorageLimit ? (float) $storageLimitMb : null,
                    'has_storage_limit' => $hasStorageLimit,
                ],
            ])
            ->toArray();
    }

    /**
     * Create a backup.
     *
     * @throws \Spatie\Fractalistic\Exceptions\InvalidTransformation
     * @throws \Spatie\Fractalistic\Exceptions\NoTransformerSpecified
     * @throws \Throwable
     */
    public function store(StoreBackupRequest $request, Server $server): array
    {
        $action = $this->initiateBackupService
            ->setIgnoredFiles(explode(PHP_EOL, $request->input('ignored') ?? ''));

        // Only set the lock status if the user even has permission to delete backups,
        // otherwise ignore this status. This gets a little funky since it isn't clear
        // how best to allow a user to create a backup that is locked without also preventing
        // them from just filling up a server with backups that can never be deleted?
        if ($request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            $action->setIsLocked($request->boolean('is_locked'));
        }

        $backup = $action->handle($server, $request->input('name'));

        Activity::event('server:backup.start')
            ->subject($backup)
            ->property(['name' => $backup->name, 'locked' => (bool) $request->input('is_locked')])
            ->log();

        return $this->fractal->item($backup)
            ->transformWith($this->getTransformer(BackupTransformer::class))
            ->toArray();
    }

    /**
     * Toggle backup lock.
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
     * View a backup.
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
     * Delete a backup.
     *
     * @throws \Throwable
     */
    public function delete(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $this->deleteBackupService->handle($backup);

        Activity::event('server:backup.delete')
            ->subject($backup)
            ->property(['name' => $backup->name, 'failed' => !$backup->is_successful])
            ->log();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Download a backup.
     *
     * @throws \Throwable
     * @throws AuthorizationException
     */
    public function download(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DOWNLOAD, $server)) {
            throw new AuthorizationException();
        }

        if ($backup->disk !== BackupAdapter::S3 && $backup->disk !== BackupAdapter::Wings && !$backup->disk->isCalagopus()) {
            throw new BadRequestHttpException('The backup requested references an unknown disk driver type and cannot be downloaded.');
        }

        $url = $this->downloadLinkService->handle($backup, $request->user());

        Activity::event('server:backup.download')->subject($backup)->property('name', $backup->name)->log();

        return new JsonResponse([
            'object' => 'signed_url',
            'attributes' => ['url' => $url],
        ]);
    }

    /**
     * Restore a backup.
     *
     * @throws \Throwable
     */
    public function restore(RestoreBackupRequest $request, Server $server, Backup $backup): JsonResponse
    {
        // Cannot restore a backup unless a server is fully installed and not currently
        // processing a different backup restoration request.
        if (!is_null($server->status)) {
            throw new BadRequestHttpException('This server is not currently in a state that allows for a backup to be restored.');
        }

        if (!$backup->is_successful && is_null($backup->completed_at)) {
            throw new BadRequestHttpException('This backup cannot be restored at this time: not completed or failed.');
        }

        $log = Activity::event('server:backup.restore')
            ->subject($backup)
            ->property(['name' => $backup->name, 'truncate' => $request->input('truncate')]);

        $log->transaction(function () use ($backup, $server, $request) {
            // If the backup is for an S3 file we need to generate a unique Download link for
            // it that will allow Wings to actually access the file.
            if ($backup->disk === BackupAdapter::S3) {
                $url = $this->downloadLinkService->handle($backup, $request->user());
            }

            // Update the status right away for the server so that we know not to allow certain
            // actions against it via the Panel API.
            $server->update(['status' => Server::STATUS_RESTORING_BACKUP]);

            $this->daemonRepository->setServer($server)->restore($backup, $url ?? null, $request->boolean('truncate'));
        });

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Delete every backup that belongs to the server.
     */
    public function deleteAll(Request $request, Server $server): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $this->confirmDestructiveAction($request);

        $backups = $server->backups()->get();
        if ($backups->isEmpty()) {
            throw new BadRequestHttpException('No backups to delete.');
        }

        $deleted = 0;
        foreach ($backups as $backup) {
            try {
                // "Delete All" is explicitly destructive: locked backups go too.
                if ($backup->is_locked) {
                    $backup->update(['is_locked' => false]);
                }

                $this->deleteBackupService->handle($backup);
                ++$deleted;
            } catch (\Exception $e) {
                \Log::error("Failed to delete backup {$backup->uuid}", ['error' => $e->getMessage()]);
            }
        }

        Activity::event('server:backup.delete_all')
            ->subject($server)
            ->property('count', $deleted)
            ->log();

        return new JsonResponse(['deleted' => $deleted]);
    }

    /**
     * Delete a specific set of backups belonging to the server.
     */
    public function bulkDelete(Request $request, Server $server): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $this->confirmDestructiveAction($request);

        $backupUuids = $request->input('backup_uuids', []);
        if (empty($backupUuids) || !is_array($backupUuids)) {
            throw new BadRequestHttpException('No backups specified for deletion.');
        }

        if (count($backupUuids) > 50) {
            throw new BadRequestHttpException('Cannot delete more than 50 backups at once.');
        }

        $backups = $server->backups()->whereIn('uuid', $backupUuids)->get();
        if ($backups->count() !== count($backupUuids)) {
            throw new BadRequestHttpException('One or more backups not found or do not belong to this server.');
        }

        $deleted = 0;
        foreach ($backups as $backup) {
            try {
                $this->deleteBackupService->handle($backup);
                ++$deleted;
            } catch (\Exception $e) {
                \Log::error("Failed to delete backup {$backup->uuid}", ['error' => $e->getMessage()]);
            }
        }

        Activity::event('server:backup.bulk_delete')
            ->subject($server)
            ->property('count', $deleted)
            ->log();

        return new JsonResponse(['deleted' => $deleted]);
    }

    /**
     * Require password (and TOTP when enabled) for destructive actions made
     * through a browser session. API keys are exempt.
     */
    private function confirmDestructiveAction(Request $request): void
    {
        if ($request->user()->currentAccessToken()) {
            return;
        }

        $password = $request->input('password');
        if (empty($password) || !password_verify($password, $request->user()->password)) {
            throw new BadRequestHttpException('The password provided was not valid.');
        }

        if ($request->user()->use_totp) {
            $totpCode = $request->input('totp_code');
            if (empty($totpCode)) {
                throw new BadRequestHttpException('Two-factor authentication code is required.');
            }

            $secret = Crypt::decrypt($request->user()->totp_secret);
            if (!$this->google2FA->verifyKey($secret, $totpCode)) {
                throw new BadRequestHttpException('The two-factor authentication code provided was not valid.');
            }
        }
    }
}
