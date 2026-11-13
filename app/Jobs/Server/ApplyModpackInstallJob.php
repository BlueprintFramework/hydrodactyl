<?php

namespace Pterodactyl\Jobs\Server;

use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Exceptions\Service\Backup\BackupFailedException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Jobs\Job;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\MarketplaceInstall;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerOperation;
use Pterodactyl\Models\User;
use Pterodactyl\Repositories\Elytra\DaemonFileRepository as ElytraFileRepository;
use Pterodactyl\Repositories\Wings\DaemonFileRepository as WingsFileRepository;
use ZipArchive;
use Pterodactyl\Services\Backups\Wings\InitiateBackupService;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Services\Marketplace\LoaderEggResolver;
use Pterodactyl\Services\Marketplace\MarketplaceException;
use Pterodactyl\Services\Marketplace\MrpackParser;
use Pterodactyl\Services\Marketplace\Sources\ModrinthSource;
use Pterodactyl\Services\ServerOperations\EnsureServerStoppedService;
use Pterodactyl\Services\ServerOperations\ServerOperationService;
use Pterodactyl\Services\ServerOperations\SoftwareChangeBackupService;
use Pterodactyl\Services\Servers\EggVariableSyncService;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;

/**
 * Installs a Modrinth .mrpack: resolve pack → backup → wipe → egg/Java →
 * reinstall → daemon-pull pack files + write overrides.
 */
class ApplyModpackInstallJob extends Job implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    public $timeout;

    public $tries = 1;

    public $failOnTimeout = true;

    private ?string $tempMrpackPath = null;

    public function __construct(
        public Server $server,
        public User $user,
        public string $projectId,
        public string $versionId,
        public ?string $projectTitle,
        public ?string $versionName,
        public bool $shouldBackup,
        public bool $shouldWipe,
        public string $operationId,
    ) {
        $this->queue = 'standard';
        $this->timeout = config('server_operations.timeouts.modpack_install', 3600);
    }

    /**
     * One in-flight modpack install per server across the unique lock store.
     */
    public function uniqueId(): string
    {
        return (string) $this->server->id;
    }

    public function uniqueFor(): int
    {
        return (int) config('server_operations.timeouts.modpack_install', 3600);
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        $ttl = (int) config('server_operations.timeouts.modpack_install', 3600);

        return [
            (new WithoutOverlapping('modpack-install:' . $this->server->id))
                ->dontRelease()
                ->expireAfter($ttl),
        ];
    }

    public function handle(
        ModrinthSource $modrinth,
        MrpackParser $parser,
        LoaderEggResolver $eggResolver,
        ElytraJobService $elytraJobService,
        InitiateBackupService $initiateBackupService,
        ReinstallServerService $reinstallServerService,
        StartupModificationService $startupModificationService,
        EggVariableSyncService $variableSyncService,
        WingsFileRepository $wingsFileRepository,
        ElytraFileRepository $elytraFileRepository,
        ServerOperationService $operationService,
        SubdomainManagementService $subdomainService,
        EnsureServerStoppedService $ensureServerStopped,
    ): void {
        $operation = null;

        try {
            $operation = ServerOperation::where('operation_id', $this->operationId)->firstOrFail();
            $operation->markAsStarted();

            Activity::actor($this->user)->event('server:software.change-started')
                ->property([
                    'operation_id' => $this->operationId,
                    'project_id' => $this->projectId,
                    'version_id' => $this->versionId,
                    'should_backup' => $this->shouldBackup,
                    'should_wipe' => $this->shouldWipe,
                    'kind' => 'modpack',
                ])
                ->log();

            // Stop first so the running world flushes and the user sees power-off
            // immediately — before a large .mrpack download can burn the queue timeout.
            $this->reportProgress($operation, __('exceptions.server_operations.progress_stopping_server'), 3, stage: 'stopping');
            $ensureServerStopped->handle(
                $this->server,
                function (string $message) use ($operation) {
                    $this->reportProgress($operation, $message, 3, stage: 'stopping');
                },
            );
            $this->reportProgress($operation, __('exceptions.server_operations.progress_server_stopped'), 5, stage: 'stopped');

            // Resolve + parse before wipe so unsupported / client-only packs fail cleanly.
            $this->reportProgress($operation, __('exceptions.server_operations.progress_resolving_modpack'), 8, stage: 'resolving');
            $download = $modrinth->resolve('modpack', $this->projectId, $this->versionId);
            $this->tempMrpackPath = $this->downloadMrpack($download['url'], $download['filename'] ?? 'pack.mrpack');
            $parsed = $parser->parse($this->tempMrpackPath);
            $this->reportProgress(
                $operation,
                __('exceptions.server_operations.progress_modpack_validated', [
                    'loader' => $parsed['loader'],
                    'minecraft' => $parsed['minecraft'],
                    'files' => count($parsed['files']) + count($parsed['overrides']),
                ]),
                12,
                stage: 'resolved'
            );

            $resolved = $eggResolver->resolve(
                $this->server,
                $parsed['loader'],
                $parsed['loader_version'],
                $parsed['minecraft'],
            );

            /** @var Egg $egg */
            $egg = $resolved['egg'];
            $eggId = (int) $egg->id;
            $nestId = (int) $resolved['nest_id'];
            $dockerImage = $resolved['docker_image'];
            $startupCommand = $resolved['startup'];
            $environment = $resolved['environment'];

            $backupJobId = null;
            $wingsBackup = null;
            $softwareChangeBackupName = null;
            $softwareChangeBackups = app(SoftwareChangeBackupService::class);
            if ($this->shouldBackup) {
                $softwareChangeBackups->purgePrior($this->server, $this->user);

                if ($this->isElytraServer()) {
                    $softwareChangeBackupName = $this->backupName($egg);
                    $backupJobId = $this->createBackup($elytraJobService, $operation, $egg, $softwareChangeBackupName);
                } else {
                    $wingsBackup = $this->createWingsBackup($initiateBackupService, $operation, $egg, $softwareChangeBackups);
                }
            }

            if ($backupJobId && $softwareChangeBackupName) {
                $this->waitForJobCompletion($elytraJobService, $backupJobId, $operation);
                $softwareChangeBackups->markByName($this->server, $softwareChangeBackupName);
            }

            if ($wingsBackup) {
                $this->waitForWingsBackupCompletion($wingsBackup, $operation);
            }

            if ($this->shouldWipe) {
                $this->wipeServerFiles($operation, $wingsFileRepository, $elytraFileRepository, $eggId);
            }

            $this->applyServerChanges(
                $egg,
                $eggId,
                $nestId,
                $dockerImage,
                $startupCommand,
                $environment,
                $startupModificationService,
                $variableSyncService,
                $reinstallServerService,
                $operation,
                $subdomainService
            );

            $this->waitForInstallCompletion($operation);

            $this->reportProgress($operation, __('exceptions.server_operations.progress_materializing_modpack'), 70, stage: 'materializing');
            $this->materializePack(
                $parsed,
                $parser,
                $modrinth,
                $wingsFileRepository,
                $elytraFileRepository,
                $operation
            );

            $this->recordInstall($download['filename'] ?? 'pack.mrpack');

            Activity::actor($this->user)->event('server:modrinth.install-modpack')
                ->property([
                    'operation_id' => $this->operationId,
                    'project_id' => $this->projectId,
                    'project_title' => $this->projectTitle ?? $this->projectId,
                    'version' => $this->versionName ?? $this->versionId,
                    'loader' => $parsed['loader'],
                    'minecraft' => $parsed['minecraft'],
                    'egg_id' => $eggId,
                ])
                ->log();

            $this->reportProgress($operation, __('exceptions.server_operations.modpack_install_completed'), 100, stage: 'completed');
            $operation->markAsCompleted(__('exceptions.server_operations.modpack_install_completed'));
        } catch (Exception $e) {
            $this->handleJobFailure($e, $operation);
            throw $e;
        } finally {
            $this->cleanupTemp();
        }
    }

    /**
     * @param array{current?: string|null, done?: int, total?: int, stage?: string} $extra
     */
    private function reportProgress(
        ServerOperation $operation,
        string $message,
        int $percent,
        ?string $current = null,
        ?string $stage = null,
        ?int $done = null,
        ?int $total = null,
    ): void {
        $payload = ['percent' => $percent];
        if ($current !== null) {
            $payload['current'] = $current;
        }
        if ($stage !== null) {
            $payload['stage'] = $stage;
        }
        if ($done !== null) {
            $payload['done'] = $done;
        }
        if ($total !== null) {
            $payload['total'] = $total;
        }

        $operation->updateProgress($message, $payload);
    }

    /**
     * @param array{
     *     files: list<array{path: string, url: string, hashes: array<string, string>, size: int|null}>,
     *     overrides: list<array{path: string, zip_entry: string}>,
     * } $parsed
     */
    private function materializePack(
        array $parsed,
        MrpackParser $parser,
        ModrinthSource $modrinth,
        WingsFileRepository $wingsFileRepository,
        ElytraFileRepository $elytraFileRepository,
        ServerOperation $operation,
    ): void {
        $fileRepository = $this->isElytraServer() ? $elytraFileRepository : $wingsFileRepository;
        $fileRepository->setServer($this->server);

        $hosts = config('hydrodactyl.marketplace.sources.modrinth.download_hosts', ['cdn.modrinth.com']);
        $hosts = is_array($hosts) ? array_values(array_map('strval', $hosts)) : ['cdn.modrinth.com'];

        $modCount = count($parsed['files']);
        $overrideCount = count($parsed['overrides']);
        $total = $modCount + max($overrideCount, 0);
        $done = 0;
        $safeTotal = max($total, 1);

        // CDN / Modrinth files: one daemon pull each (usually dozens, not thousands).
        foreach ($parsed['files'] as $file) {
            $modrinth->assertPublicDownloadUrl($file['url'], $hosts);

            [$directory, $filename] = $this->splitPath($file['path']);
            if ($directory !== '/' && $directory !== '') {
                $this->withDaemonRetry(function () use ($fileRepository, $directory) {
                    $this->ensureDirectory($fileRepository, $directory);
                });
            }

            $this->reportProgress(
                $operation,
                __('exceptions.server_operations.progress_installing_modpack_file', [
                    'file' => $file['path'],
                    'done' => $done + 1,
                    'total' => $safeTotal,
                ]),
                70 + (int) floor(($done / $safeTotal) * 28),
                current: $file['path'],
                stage: 'materializing',
                done: $done,
                total: $safeTotal,
            );

            $this->withDaemonRetry(function () use ($fileRepository, $file, $directory, $filename) {
                $fileRepository->setServer($this->server)->pull($file['url'], $directory === '' ? '/' : $directory, [
                    'filename' => $filename,
                    'foreground' => true,
                ]);
            });

            $done++;
            $this->reportProgress(
                $operation,
                __('exceptions.server_operations.progress_materializing_modpack_files', [
                    'done' => $done,
                    'total' => $safeTotal,
                ]),
                70 + (int) floor(($done / $safeTotal) * 28),
                current: $file['path'],
                stage: 'materializing',
                done: $done,
                total: $safeTotal,
            );
        }

        if ($overrideCount === 0) {
            return;
        }

        if ($this->tempMrpackPath === null) {
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_unreadable'));
        }

        // Thousands of tiny putContent calls saturate Wings (TLS/handshake) and
        // drop mid-install. Bundle overrides into one archive, upload once, extract.
        $this->reportProgress(
            $operation,
            __('exceptions.server_operations.progress_bundling_overrides', [
                'count' => $overrideCount,
            ]),
            70 + (int) floor(($done / $safeTotal) * 28),
            stage: 'materializing',
            done: $done,
            total: $safeTotal,
        );

        $bundlePath = $this->buildOverridesBundle($parsed['overrides'], $operation, $done, $safeTotal);
        $archiveName = '.hd-modpack-overrides.zip';

        try {
            $this->reportProgress(
                $operation,
                __('exceptions.server_operations.progress_uploading_overrides'),
                70 + (int) floor(($done / $safeTotal) * 28),
                stage: 'materializing',
                done: $done,
                total: $safeTotal,
            );

            $this->withDaemonRetry(function () use ($fileRepository, $archiveName, $bundlePath) {
                $this->uploadBinaryFile($fileRepository, $archiveName, $bundlePath);
            });

            $this->reportProgress(
                $operation,
                __('exceptions.server_operations.progress_extracting_overrides'),
                92,
                stage: 'materializing',
                done: $done,
                total: $safeTotal,
            );

            $this->withDaemonRetry(function () use ($fileRepository, $archiveName) {
                $fileRepository->setServer($this->server)->decompressFile('/', $archiveName);
            });

            try {
                $this->withDaemonRetry(function () use ($fileRepository, $archiveName) {
                    $fileRepository->setServer($this->server)->deleteFiles('/', [$archiveName]);
                });
            } catch (\Throwable $e) {
                Log::warning('Failed to delete temporary modpack override archive', [
                    'server_id' => $this->server->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $done += $overrideCount;
            $this->reportProgress(
                $operation,
                __('exceptions.server_operations.progress_materializing_modpack_files', [
                    'done' => $done,
                    'total' => $safeTotal,
                ]),
                98,
                stage: 'materializing',
                done: $done,
                total: $safeTotal,
            );
        } finally {
            @unlink($bundlePath);
        }

        // $parser kept for signature compatibility / future per-file fallback.
        unset($parser);
    }

    /**
     * Retry transient Wings/daemon drops — Cobblemon-scale installs open thousands
     * of connections and the node occasionally resets mid-stream.
     *
     * @template T
     *
     * @param callable(): T $callback
     *
     * @return T
     */
    private function withDaemonRetry(callable $callback, int $attempts = 5): mixed
    {
        $last = null;
        for ($i = 1; $i <= $attempts; $i++) {
            try {
                return $callback();
            } catch (DaemonConnectionException $e) {
                $last = $e;
                if ($i >= $attempts) {
                    break;
                }
                // Exponential backoff: 1s, 2s, 4s, 8s…
                usleep((int) (1000000 * (2 ** ($i - 1))));
            }
        }

        throw $last ?? new \RuntimeException(__('exceptions.daemon.connection_failed'));
    }

    /**
     * @param list<array{path: string, zip_entry: string}> $overrides
     */
    private function buildOverridesBundle(array $overrides, ServerOperation $operation, int $doneBase, int $safeTotal): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'hdov_');
        if ($tmp === false) {
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_unreadable'));
        }
        $path = $tmp . '.zip';
        @rename($tmp, $path);

        $source = new ZipArchive();
        if ($source->open($this->tempMrpackPath) !== true) {
            @unlink($path);
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_unreadable'));
        }

        $bundle = new ZipArchive();
        if ($bundle->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $source->close();
            @unlink($path);
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_unreadable'));
        }

        try {
            $count = count($overrides);
            foreach ($overrides as $index => $override) {
                $contents = $source->getFromName($override['zip_entry']);
                if ($contents === false) {
                    continue;
                }
                $bundle->addFromString(ltrim(str_replace('\\', '/', $override['path']), '/'), $contents);
                unset($contents);

                if ($index > 0 && $index % 100 === 0) {
                    $this->reportProgress(
                        $operation,
                        __('exceptions.server_operations.progress_bundling_overrides_progress', [
                            'done' => $index,
                            'total' => $count,
                        ]),
                        70 + (int) floor(($doneBase / $safeTotal) * 28),
                        current: $override['path'],
                        stage: 'materializing',
                        done: $doneBase,
                        total: $safeTotal,
                    );
                }
            }
        } finally {
            $bundle->close();
            $source->close();
        }

        return $path;
    }

    /**
     * Upload a local file to the daemon write endpoint with a long timeout.
     *
     * @param WingsFileRepository|ElytraFileRepository $fileRepository
     */
    private function uploadBinaryFile(object $fileRepository, string $remotePath, string $localPath): void
    {
        $size = filesize($localPath);
        if ($size === false || $size < 1) {
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_unreadable'));
        }

        $handle = fopen($localPath, 'rb');
        if ($handle === false) {
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_unreadable'));
        }

        try {
            $client = $fileRepository->setServer($this->server)->getHttpClient();
            $client->post(
                sprintf('/api/servers/%s/files/write', $this->server->uuid),
                [
                    'query' => ['file' => $remotePath],
                    'body' => $handle,
                    'timeout' => 60 * 15,
                    'headers' => [
                        'Content-Type' => 'application/octet-stream',
                        'Content-Length' => (string) $size,
                    ],
                ]
            );
        } finally {
            if (is_resource($handle)) {
                fclose($handle);
            }
        }
    }

    /**
     * @param WingsFileRepository|ElytraFileRepository $fileRepository
     */
    private function ensureDirectory(object $fileRepository, string $directory): void
    {
        $parts = array_values(array_filter(explode('/', trim($directory, '/')), fn($p) => $p !== ''));
        $current = '/';
        foreach ($parts as $part) {
            try {
                $fileRepository->setServer($this->server)->createDirectory($part, $current);
            } catch (\Throwable) {
                // Directory may already exist — continue.
            }
            $current = ($current === '/' ? '' : rtrim($current, '/')) . '/' . $part;
        }
    }

    /**
     * @return array{0: string, 1: string} directory, filename
     */
    private function splitPath(string $path): array
    {
        $normalized = ltrim(str_replace('\\', '/', $path), '/');
        $pos = strrpos($normalized, '/');
        if ($pos === false) {
            return ['/', $normalized];
        }

        return ['/' . substr($normalized, 0, $pos), substr($normalized, $pos + 1)];
    }

    private function downloadMrpack(string $url, string $filename): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'mrpack_');
        if ($tmp === false) {
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_download_failed'));
        }

        $path = $tmp . '.mrpack';
        @rename($tmp, $path);

        $response = Http::withHeaders([
            'User-Agent' => (string) config('hydrodactyl.marketplace.user_agent', 'Hydrodactyl'),
            'Accept' => 'application/octet-stream',
        ])
            ->timeout(120)
            ->sink($path)
            ->get($url);

        if ($response->failed() || !is_file($path) || filesize($path) < 64) {
            @unlink($path);
            throw new \RuntimeException(__('exceptions.client.marketplace.modpack_download_failed'));
        }

        return $path;
    }

    private function recordInstall(string $filename): void
    {
        MarketplaceInstall::updateOrCreate(
            [
                'server_id' => $this->server->id,
                'type' => 'modpack',
                'source' => 'modrinth',
                'project_id' => $this->projectId,
            ],
            [
                'project_title' => $this->projectTitle ?: $this->projectId,
                'version_id' => $this->versionId,
                'version_name' => $this->versionName ?: $this->versionId,
                'filename' => $filename,
                'installed_at' => now(),
            ],
        );
    }

    private function applyServerChanges(
        Egg $egg,
        int $eggId,
        int $nestId,
        ?string $dockerImage,
        ?string $startupCommand,
        array $environment,
        StartupModificationService $startupModificationService,
        EggVariableSyncService $variableSyncService,
        ReinstallServerService $reinstallServerService,
        ServerOperation $operation,
        SubdomainManagementService $subdomainService,
    ): void {
        $this->reportProgress($operation, __('exceptions.server_operations.progress_applying_config'), 40, stage: 'configuring');

        DB::transaction(function () use (
            $egg,
            $eggId,
            $nestId,
            $dockerImage,
            $startupCommand,
            $environment,
            $startupModificationService,
            $variableSyncService,
            $reinstallServerService,
            $operation,
            $subdomainService
        ) {
            $activeSubdomain = $this->server->activeSubdomain;
            if ($activeSubdomain) {
                $tempServer = clone $this->server;
                $tempServer->egg = $egg;
                $tempServer->egg_id = $egg->id;

                if (!$tempServer->supportsSubdomains()) {
                    $this->reportProgress($operation, __('exceptions.server_operations.progress_removing_subdomain'), 42, stage: 'configuring');
                    try {
                        $subdomainService->deleteSubdomain($activeSubdomain);
                    } catch (Exception $e) {
                        Log::warning('Failed to delete subdomain during modpack install', [
                            'server_id' => $this->server->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            if ($this->server->egg_id !== $eggId || $this->server->nest_id !== $nestId) {
                $this->server->update([
                    'egg_id' => $eggId,
                    'nest_id' => $nestId,
                ]);
            }

            $variableSyncService->handle($this->server, $egg);

            $mergedEnvironment = $egg->variables->mapWithKeys(function ($variable) use ($environment) {
                $value = $environment[$variable->env_variable] ?? $variable->default_value;

                return [$variable->env_variable => $value === '' ? null : $value];
            })->all();

            $updateData = [
                'startup' => $startupCommand ?: $egg->startup,
                'docker_image' => $dockerImage,
                'environment' => $mergedEnvironment,
            ];

            $updatedServer = $startupModificationService
                ->setUserLevel(User::USER_LEVEL_ADMIN)
                ->handle($this->server, $updateData);

            $this->reportProgress($operation, __('exceptions.server_operations.progress_reinstalling'), 48, stage: 'reinstalling');
            $reinstallServerService->handle($updatedServer);

            $this->reportProgress($operation, __('exceptions.server_operations.progress_finalizing'), 52, stage: 'reinstalling');
        });
    }

    private function waitForInstallCompletion(ServerOperation $operation): void
    {
        $timeoutMinutes = (int) ceil(config('server_operations.timeouts.install_wait', 1800) / 60);
        $timeout = Carbon::now()->addMinutes(max($timeoutMinutes, 1));
        $lastProgressUpdate = 0;
        $startTime = Carbon::now();

        $this->reportProgress($operation, __('exceptions.server_operations.progress_waiting_for_install'), 55, stage: 'installing');

        while (Carbon::now()->lt($timeout)) {
            $this->server->refresh();
            $status = $this->server->status;

            if ($status === null || $status === '') {
                $this->reportProgress($operation, __('exceptions.server_operations.progress_install_completed'), 68, stage: 'installed');

                return;
            }

            if (in_array($status, [Server::STATUS_INSTALL_FAILED, Server::STATUS_REINSTALL_FAILED], true)) {
                throw new \RuntimeException(__('exceptions.server_operations.install_reported_failed', [
                    'status' => $status,
                ]));
            }

            $elapsed = Carbon::now()->diffInSeconds($startTime);
            if ($elapsed - $lastProgressUpdate >= 15) {
                // Creep toward 65% while waiting so the bar doesn't look stuck.
                $creep = min(65, 55 + (int) floor($elapsed / 30));
                $this->reportProgress($operation, __('exceptions.server_operations.progress_waiting_for_install'), $creep, stage: 'installing');
                $lastProgressUpdate = $elapsed;
            }

            sleep(5);
        }

        $this->server->refresh();
        if ($this->server->status === Server::STATUS_INSTALLING) {
            $this->server->update(['status' => Server::STATUS_REINSTALL_FAILED]);
        }

        throw new \RuntimeException(__('exceptions.server_operations.install_timed_out', [
            'minutes' => $timeoutMinutes,
        ]));
    }

    private function createBackup(
        ElytraJobService $elytraJobService,
        ServerOperation $operation,
        Egg $targetEgg,
        string $backupName,
    ): string {
        $this->reportProgress($operation, __('exceptions.server_operations.progress_creating_backup'), 12, stage: 'backup');

        try {
            $result = $elytraJobService->submitJob(
                $this->server,
                'backup_create',
                [
                    'operation' => 'create',
                    'adapter' => config('backups.default', 'elytra'),
                    'ignored' => '',
                    'name' => $backupName,
                ],
                $this->user
            );

            Activity::actor($this->user)->event('server:backup.software-change')
                ->property([
                    'backup_name' => $backupName,
                    'backup_job_id' => $result['job_id'],
                    'operation_id' => $this->operationId,
                    'from_egg' => $this->server->egg_id,
                    'to_egg' => $targetEgg->id,
                ])
                ->log();

            $this->reportProgress($operation, __('exceptions.server_operations.progress_backup_submitted'), 15, stage: 'backup');

            return $result['job_id'];
        } catch (\Exception $e) {
            throw new BackupFailedException(__('exceptions.server_operations.backup_creation_failed', ['error' => $e->getMessage()]));
        }
    }

    private function createWingsBackup(
        InitiateBackupService $initiateBackupService,
        ServerOperation $operation,
        Egg $targetEgg,
        SoftwareChangeBackupService $softwareChangeBackups,
    ): Backup {
        $this->reportProgress($operation, __('exceptions.server_operations.progress_creating_backup'), 12, stage: 'backup');
        $backupName = $this->backupName($targetEgg);

        try {
            $backup = $initiateBackupService->setIgnoredFiles([])->handle($this->server, $backupName, true);
            $softwareChangeBackups->markBackup($backup);
            $backup->refresh();

            Activity::actor($this->user)->event('server:backup.software-change')
                ->property([
                    'backup_name' => $backupName,
                    'backup_id' => $backup->id,
                    'operation_id' => $this->operationId,
                    'from_egg' => $this->server->egg_id,
                    'to_egg' => $targetEgg->id,
                    'expires_at' => $backup->expires_at?->toIso8601String(),
                ])
                ->log();

            $this->reportProgress($operation, __('exceptions.server_operations.progress_backup_submitted'), 15, stage: 'backup');

            return $backup;
        } catch (\Throwable $e) {
            throw new BackupFailedException(__('exceptions.server_operations.backup_creation_failed', ['error' => $e->getMessage()]));
        }
    }

    private function backupName(Egg $targetEgg): string
    {
        $currentEgg = $this->server->egg;
        $title = $this->projectTitle ?: $this->projectId;

        $backupName = __('exceptions.server_operations.modpack_change_backup_name', [
            'pack' => $title,
            'from' => $currentEgg->name ?? 'Unknown',
            'to' => $targetEgg->name ?? 'Unknown',
            'date' => now()->format('M j, g:i A'),
        ]);

        if (strlen($backupName) > 190) {
            $backupName = substr($backupName, 0, 187) . '...';
        }

        return $backupName;
    }

    private function isElytraServer(): bool
    {
        return strtolower((string) $this->server->node->daemonType) === 'elytra';
    }

    private function waitForWingsBackupCompletion(Backup $backup, ServerOperation $operation, int $timeoutMinutes = 30): void
    {
        $this->reportProgress($operation, __('exceptions.server_operations.progress_waiting_for_backup'), 18, stage: 'backup');

        $startTime = Carbon::now();
        $timeout = $startTime->copy()->addMinutes($timeoutMinutes);
        $lastProgressUpdate = 0;

        while (Carbon::now()->lt($timeout)) {
            $backup->refresh();

            if ($backup->completed_at !== null) {
                if ($backup->is_successful) {
                    $this->reportProgress($operation, __('exceptions.server_operations.progress_backup_completed'), 30, stage: 'backup');

                    return;
                }

                throw new BackupFailedException(__('exceptions.server_operations.backup_failed', ['error' => 'Unknown error']));
            }

            $elapsed = Carbon::now()->diffInSeconds($startTime);
            if ($elapsed - $lastProgressUpdate >= 15) {
                $creep = min(28, 18 + (int) floor($elapsed / 20));
                $this->reportProgress($operation, __('exceptions.server_operations.progress_waiting_for_backup'), $creep, stage: 'backup');
                $lastProgressUpdate = $elapsed;
            }

            sleep(5);
        }

        throw new BackupFailedException(__('exceptions.server_operations.backup_timed_out', ['minutes' => $timeoutMinutes]));
    }

    private function waitForJobCompletion(ElytraJobService $elytraJobService, string $jobId, ServerOperation $operation, int $timeoutMinutes = 30): void
    {
        $this->reportProgress($operation, __('exceptions.server_operations.progress_waiting_for_backup'), 18, stage: 'backup');

        $startTime = Carbon::now();
        $timeout = $startTime->addMinutes($timeoutMinutes);
        $lastProgressUpdate = 0;

        while (Carbon::now()->lt($timeout)) {
            $jobStatus = $elytraJobService->getJobStatus($this->server, $jobId);

            if (!$jobStatus) {
                throw new BackupFailedException(__('exceptions.server_operations.backup_job_not_found'));
            }

            if ($jobStatus['status'] === 'completed') {
                $this->reportProgress($operation, __('exceptions.server_operations.progress_backup_completed'), 30, stage: 'backup');

                return;
            }

            if (in_array($jobStatus['status'], ['failed', 'cancelled'])) {
                throw new BackupFailedException(__('exceptions.server_operations.backup_failed', ['error' => $jobStatus['error'] ?? 'Unknown error']));
            }

            $elapsed = Carbon::now()->diffInSeconds($startTime);
            if ($elapsed - $lastProgressUpdate >= 15) {
                $backupPct = (int) ($jobStatus['progress'] ?? 0);
                $mapped = 18 + (int) floor(min(100, max(0, $backupPct)) * 0.12);
                $this->reportProgress(
                    $operation,
                    __('exceptions.server_operations.progress_backup_in_progress', ['progress' => $backupPct]),
                    $mapped,
                    stage: 'backup'
                );
                $lastProgressUpdate = $elapsed;
            }

            sleep(5);
        }

        throw new BackupFailedException(__('exceptions.server_operations.backup_timed_out', ['minutes' => $timeoutMinutes]));
    }

    private function wipeServerFiles(
        ServerOperation $operation,
        WingsFileRepository $wingsFileRepository,
        ElytraFileRepository $elytraFileRepository,
        int $toEggId,
    ): void {
        $this->reportProgress($operation, __('exceptions.server_operations.progress_wiping_files'), 32, stage: 'wipe');

        $fileRepository = $this->isElytraServer() ? $elytraFileRepository : $wingsFileRepository;

        try {
            $contents = $fileRepository->setServer($this->server)->getDirectory('/');

            if (!empty($contents)) {
                $filesToDelete = array_map(fn($item) => $item['name'], $contents);
                $fileRepository->setServer($this->server)->deleteFiles('/', $filesToDelete);

                Activity::actor($this->user)->event('server:files.software-change-wipe')
                    ->property([
                        'operation_id' => $this->operationId,
                        'from_egg' => $this->server->egg_id,
                        'to_egg' => $toEggId,
                        'files_deleted' => count($filesToDelete),
                        'backup_created' => $this->shouldBackup,
                    ])
                    ->log();

                $this->reportProgress($operation, __('exceptions.server_operations.progress_files_wiped'), 36, stage: 'wipe');
            } else {
                $this->reportProgress($operation, __('exceptions.server_operations.progress_no_files_to_wipe'), 36, stage: 'wipe');
            }
        } catch (Exception $e) {
            Log::error('Failed to wipe files during modpack install', [
                'server_id' => $this->server->id,
                'error' => $e->getMessage(),
            ]);

            if (!$this->shouldBackup) {
                throw new \RuntimeException(__('exceptions.server_operations.file_wipe_no_backup'));
            }
        }
    }

    private function cleanupTemp(): void
    {
        if ($this->tempMrpackPath && is_file($this->tempMrpackPath)) {
            @unlink($this->tempMrpackPath);
        }
        $this->tempMrpackPath = null;
    }

    public function failed(\Throwable $exception): void
    {
        try {
            $operation = ServerOperation::where('operation_id', $this->operationId)->first();
            $this->handleJobFailure($exception, $operation);
        } catch (\Exception $e) {
            Log::error('Failed to handle modpack install job failure cleanup', [
                'operation_id' => $this->operationId,
                'error' => $e->getMessage(),
            ]);
            $this->handleJobFailure($exception, null);
        } finally {
            $this->cleanupTemp();
        }
    }

    private function handleJobFailure(\Throwable $exception, ?ServerOperation $operation): void
    {
        Log::error('Modpack install job failed', [
            'operation_id' => $this->operationId,
            'error' => $exception->getMessage(),
            'server_id' => $this->server->id,
            'user_id' => $this->user->id,
        ]);

        try {
            $this->server->refresh();
            if ($this->server->status === Server::STATUS_INSTALLING) {
                $this->server->update(['status' => Server::STATUS_REINSTALL_FAILED]);
            }
        } catch (\Throwable $statusError) {
            Log::warning('Failed to clear installing status after modpack install failure', [
                'server_id' => $this->server->id,
                'error' => $statusError->getMessage(),
            ]);
        }

        if ($operation) {
            $message = $exception instanceof MarketplaceException
                ? $exception->getMessage()
                : __('exceptions.server_operations.operation_failed', ['error' => $exception->getMessage()]);
            $operation->markAsFailed($message);
        }

        Activity::actor($this->user)->event('server:software.change-failed')
            ->property([
                'operation_id' => $this->operationId,
                'error' => $exception->getMessage(),
                'project_id' => $this->projectId,
                'version_id' => $this->versionId,
                'kind' => 'modpack',
            ])
            ->log();
    }
}
