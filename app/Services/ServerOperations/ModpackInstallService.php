<?php

namespace Pterodactyl\Services\ServerOperations;

use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Jobs\Server\ApplyModpackInstallJob;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Marketplace\DestinationResolver;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Queues an automatic Modrinth modpack install (backup → wipe → egg → materialize).
 */
class ModpackInstallService
{
    public function __construct(
        private ServerOperationService $operationService,
        private ServerStateValidationService $validationService,
        private DestinationResolver $destinations,
    ) {}

    /**
     * @return array{message: string, operation_id: string, status: string}
     */
    public function installAsync(
        Server $server,
        User $user,
        string $projectId,
        string $versionId,
        ?string $projectTitle = null,
        ?string $versionName = null,
        bool $shouldBackup = true,
        bool $shouldWipe = true,
    ): array {
        $this->validationService->validateCanAcceptOperation($server, 'modpack_install');

        $features = $server->egg?->inherit_features ?? [];
        if (!is_array($features)) {
            $features = [];
        }
        if (!$this->destinations->supportsType($features, 'modpack')) {
            throw new BadRequestHttpException(__('exceptions.client.marketplace.egg_type_unsupported'));
        }

        $this->assertPermissions($server, $user, $shouldBackup, $shouldWipe);

        $operation = $this->operationService->createOperation(
            $server,
            $user,
            'modpack_install',
            [
                'project_id' => $projectId,
                'version_id' => $versionId,
                'project_title' => $projectTitle,
                'version_name' => $versionName,
                'should_backup' => $shouldBackup,
                'should_wipe' => $shouldWipe,
            ]
        );

        try {
            ApplyModpackInstallJob::dispatch(
                $server,
                $user,
                $projectId,
                $versionId,
                $projectTitle,
                $versionName,
                $shouldBackup,
                $shouldWipe,
                $operation->operation_id
            );
        } catch (Exception $e) {
            $operation->delete();

            Log::error('Failed to dispatch modpack install job', [
                'server_id' => $server->id,
                'operation_id' => $operation->operation_id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException(__('exceptions.server_operations.queue_failed'));
        }

        return [
            'message' => __('exceptions.server_operations.modpack_install_queued'),
            'operation_id' => $operation->operation_id,
            'status' => 'pending',
        ];
    }

    private function assertPermissions(Server $server, User $user, bool $shouldBackup, bool $shouldWipe): void
    {
        $deny = fn () => throw new AuthorizationException();

        if (!$user->can(Permission::ACTION_MOD_DOWNLOAD, $server)) {
            $deny();
        }

        if (!$user->can(Permission::ACTION_SETTINGS_REINSTALL, $server)) {
            $deny();
        }

        if (!$user->can(Permission::ACTION_STARTUP_UPDATE, $server)) {
            $deny();
        }

        if (!$user->can(Permission::ACTION_STARTUP_DOCKER_IMAGE, $server)) {
            $deny();
        }

        if ($shouldBackup && !$user->can(Permission::ACTION_BACKUP_CREATE, $server)) {
            $deny();
        }

        if ($shouldWipe && (!$user->can(Permission::ACTION_FILE_READ, $server) || !$user->can(Permission::ACTION_FILE_DELETE, $server))) {
            $deny();
        }

        if (!$user->can(Permission::ACTION_FILE_CREATE, $server) || !$user->can(Permission::ACTION_FILE_UPDATE, $server)) {
            $deny();
        }
    }
}
