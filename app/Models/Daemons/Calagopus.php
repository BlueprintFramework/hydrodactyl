<?php

namespace Pterodactyl\Models\Daemons;

use Illuminate\Support\Str;
use Pterodactyl\Models\Node;
use Illuminate\Container\Container;
use Pterodactyl\Contracts\Daemon\Daemon;
use Illuminate\Contracts\Encryption\Encrypter;

/**
 * Calagopus Wings daemon implementation.
 *
 * Calagopus Wings is a Rust reimplementation of Pterodactyl Wings that is
 * 100% API compatible, while adding a number of configuration options and
 * backup drivers (ddup-bak, btrfs, zfs, restic, Proxmox Backup Server, ...).
 *
 * The configuration emitted below is a superset of the stock Wings config:
 * anything Wings understands is still sent verbatim, and the Calagopus-only
 * keys are layered on top. Because Calagopus performs a JSON merge-patch of
 * the panel response over its local config, only the keys we manage here are
 * overwritten on the node.
 */
class Calagopus implements Daemon
{
    public function getConfiguration(Node $node): array
    {
        return [
            'debug' => false,
            'app_name' => 'Calagopus',
            'uuid' => $node->uuid,
            'token_id' => $node->daemon_token_id,
            'token' => Container::getInstance()->make(Encrypter::class)->decrypt($node->daemon_token),
            'api' => array_merge([
                'host' => '0.0.0.0',
                'port' => $node->daemonListen,
                'ssl' => [
                    'enabled' => (!$node->behind_proxy && $node->scheme === 'https'),
                    'cert' => '/etc/letsencrypt/live/' . Str::lower($node->getInternalFqdn()) . '/fullchain.pem',
                    'key' => '/etc/letsencrypt/live/' . Str::lower($node->getInternalFqdn()) . '/privkey.pem',
                ],
                'upload_limit' => $node->upload_size,
            ], config('calagopus.api', [])),
            'system' => [
                'data' => $node->daemonBase,
                'sftp' => [
                    'bind_port' => $node->daemonSFTP,
                ],
                'backups' => $this->getBackupConfiguration(),
            ],
            'allowed_mounts' => $node->mounts->pluck('source')->toArray(),
            'remote' => route('index'),
            'allowed_origins' => [
                config('app.url'),
            ],
        ];
    }

    /**
     * Build the Calagopus "system.backups" block. This mirrors the daemon's own
     * schema so that the driver tuning knobs can be managed from the panel.
     */
    private function getBackupConfiguration(): array
    {
        $config = config('calagopus.backups', []);

        // Drop empty optional values so we don't clobber daemon defaults with blanks.
        // (The restic repository/password are deployment specific and are usually
        // configured locally on the node; only emit them when explicitly set.)
        $config['restic'] = array_filter(
            $config['restic'] ?? [],
            fn ($value) => $value !== '' && $value !== null && $value !== []
        );

        return $config;
    }

    public function getAutoDeploy(Node $node, string $token): string
    {
        $debugFlag = config('app.debug') ? ' --allow-insecure' : '';

        return 'cd /etc/calagopus-wings && sudo calagopus-wings configure --panel-url ' . escapeshellarg(config('app.url')) . ' --token ' . escapeshellarg($token) . ' --node ' . escapeshellarg((string) $node->id) . $debugFlag . '';
    }
}
