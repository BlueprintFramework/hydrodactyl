<?php

namespace Pterodactyl\Repositories\Daemons;

use GuzzleHttp\Exception\TransferException;
use Pterodactyl\Repositories\Wings\DaemonRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * Generic self-upgrade call against a daemon's HTTP API.
 *
 * The daemons the panel supports share the same binary-download upgrade
 * contract (hand the node a URL + checksum and let it replace and restart
 * itself); only the path and the service name differ, and those are defined
 * per backend in config/daemons.php.
 *
 * @method \Pterodactyl\Repositories\Daemons\DaemonUpgradeRepository setNode(\Pterodactyl\Models\Node $node)
 */
class DaemonUpgradeRepository extends DaemonRepository
{
    /**
     * Ask the node to download and swap in a new binary, then restart.
     *
     * @param array<string, string> $headers
     * @param array<int, string> $restartArgs
     *
     * @throws DaemonConnectionException
     */
    public function upgradeAt(
        string $endpoint,
        string $url,
        string $sha256,
        array $headers = [],
        string $restartCommand = 'systemctl',
        array $restartArgs = ['restart', 'wings'],
    ): array {
        try {
            $response = $this->getHttpClient()->post($endpoint, [
                'json' => [
                    'url' => $url,
                    'headers' => $headers,
                    'sha256' => $sha256,
                    'restart_command' => $restartCommand,
                    'restart_command_args' => $restartArgs,
                ],
            ]);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }

        return json_decode((string) $response->getBody(), true) ?? [];
    }
}
