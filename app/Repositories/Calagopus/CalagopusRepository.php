<?php

namespace Pterodactyl\Repositories\Calagopus;

use Pterodactyl\Models\Server;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\TransferException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * Communicates with the Calagopus-only node endpoints that do not exist on
 * stock Wings (system information, stats, logs and remote self-upgrade).
 *
 * @method \Pterodactyl\Repositories\Calagopus\CalagopusRepository setNode(\Pterodactyl\Models\Node $node)
 * @method \Pterodactyl\Repositories\Calagopus\CalagopusRepository setServer(\Pterodactyl\Models\Server $server)
 */
class CalagopusRepository extends DaemonRepository
{
    /**
     * Basic node/system information (architecture, cpu count, kernel, version).
     *
     * @throws DaemonConnectionException
     */
    public function getSystem(): array
    {
        return $this->decode($this->request('GET', '/api/system'));
    }

    /**
     * @throws DaemonConnectionException
     */
    public function getOverview(): array
    {
        return $this->decode($this->request('GET', '/api/system/overview'));
    }

    /**
     * Live node resource statistics.
     *
     * @throws DaemonConnectionException
     */
    public function getStats(): array
    {
        return $this->decode($this->request('GET', '/api/system/stats'));
    }

    /**
     * List the log files available on the node.
     *
     * @throws DaemonConnectionException
     */
    public function getLogs(): array
    {
        return $this->decode($this->request('GET', '/api/system/logs'));
    }

    /**
     * Read a single (optionally compressed) log file, tailing to $lines lines.
     *
     * @throws DaemonConnectionException
     */
    public function getLog(string $file, ?int $lines = null): string
    {
        $query = $lines ? ['lines' => $lines] : [];

        try {
            return (string) $this->getHttpClient()->get(
                sprintf('/api/system/logs/%s', rawurlencode($file)),
                ['query' => $query]
            )->getBody();
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Ask the node to replace its own binary with the given download.
     *
     * @param array<string, string> $headers
     *
     * @throws DaemonConnectionException
     */
    public function upgrade(string $url, string $sha256, array $headers = [], string $restartCommand = 'systemctl', array $restartArgs = ['restart', 'wings']): array
    {
        return $this->decode($this->request('POST', '/api/system/upgrade', [
            'url' => $url,
            'headers' => $headers,
            'sha256' => $sha256,
            'restart_command' => $restartCommand,
            'restart_command_args' => $restartArgs,
        ], 60));
    }

    /**
     * Fetch the version hash for a single server's configuration.
     *
     * @throws DaemonConnectionException
     */
    public function getServerVersion(Server $server): array
    {
        return $this->decode($this->request('GET', sprintf('/api/servers/%s/version', $server->uuid)));
    }

    /**
     * Run a custom script against a server asynchronously.
     *
     * @throws DaemonConnectionException
     */
    public function runScript(Server $server, array $script): ResponseInterface
    {
        try {
            return $this->getHttpClient(['timeout' => 5])->post(
                sprintf('/api/servers/%s/script', $server->uuid),
                ['json' => $script]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * @throws DaemonConnectionException
     */
    private function request(string $method, string $path, array $json = [], int $timeout = 10): ResponseInterface
    {
        try {
            $options = ['timeout' => $timeout];
            if (!empty($json)) {
                $options['json'] = $json;
            }

            return $this->getHttpClient($options)->request($method, $path);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    private function decode(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true) ?? [];
    }
}
