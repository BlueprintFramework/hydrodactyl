<?php

namespace Pterodactyl\Services\Dns\Providers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;

class SpaceshipProvider implements DnsProviderInterface
{
    private const MIN_TTL = 60;
    private const MAX_TTL = 3600;
    private const PAGE_SIZE = 500;

    private Client $client;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        // Only initialize the client if we have both halves of the credential
        if (!empty($config['api_key']) && !empty($config['api_secret'])) {
            $this->client = new Client([
                'base_uri' => 'https://spaceship.dev/api/v1/',
                'headers' => [
                    'X-API-Key' => $config['api_key'],
                    'X-API-Secret' => $config['api_secret'],
                    'Content-Type' => 'application/json',
                ],
                'timeout' => 30,
            ]);
        }
    }

    /**
     * Test the connection to the Spaceship API.
     */
    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('spaceship', empty($this->config['api_key']) ? 'api_key' : 'api_secret');
        }

        try {
            $this->client->get('domains', [
                'query' => ['take' => 1, 'skip' => 0],
            ]);

            return true;
        } catch (RequestException $e) {
            if ($e->getResponse()?->getStatusCode() === 401) {
                throw DnsProviderException::authenticationFailed('spaceship');
            }

            throw DnsProviderException::connectionFailed('spaceship', $this->parseErrorMessage($e));
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('spaceship', $this->parseErrorMessage($e));
        }
    }

    /**
     * Create a DNS record.
     *
     * Spaceship has no record IDs, so the returned ID is "TYPE/name" (see buildRecordId).
     */
    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $type = strtoupper($type);
        $item = $this->buildItem($domain, $name, $type, $content);
        $item['ttl'] = $this->clampTtl($ttl);

        try {
            $this->saveRecords($domain, [$item]);

            return $this->buildRecordId($item);
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordCreationFailed($domain, $name, $this->parseErrorMessage($e));
        }
    }

    /**
     * Update a DNS record.
     */
    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        [$type, $name] = $this->parseRecordId($recordId);

        try {
            $existing = $this->findRecords($domain, $recordId);

            $item = $this->buildItem($domain, $name, $type, $content);
            $item['ttl'] = $this->clampTtl($ttl ?? $existing[0]['ttl'] ?? 300);

            // Records are matched by value, so saving a new value adds a record
            // instead of replacing the old one. Save first, then drop the stale ones.
            $this->saveRecords($domain, [$item]);

            $stale = array_values(array_filter(
                $existing,
                fn (array $record) => $this->identity($record) !== $this->identity($item)
            ));

            if (!empty($stale)) {
                $this->removeRecords($domain, $stale);
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordUpdateFailed($domain, [$recordId], $this->parseErrorMessage($e));
        }
    }

    /**
     * Delete a DNS record.
     */
    public function deleteRecord(string $domain, string $recordId): void
    {
        try {
            $existing = $this->findRecords($domain, $recordId);

            if (!empty($existing)) {
                $this->removeRecords($domain, $existing);
            }
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordDeletionFailed($domain, [$recordId], $this->parseErrorMessage($e));
        }
    }

    /**
     * Get a specific DNS record.
     */
    public function getRecord(string $domain, string $recordId): array
    {
        try {
            $existing = $this->findRecords($domain, $recordId);
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('spaceship', $this->parseErrorMessage($e));
        }

        if (empty($existing)) {
            throw new DnsProviderException("DNS record not found or inaccessible: {$recordId}");
        }

        $record = $existing[0];

        // 'content' is shaped so it can be passed straight back into updateRecord.
        return $record + [
            'id' => $recordId,
            'content' => $this->extractContent($record),
        ];
    }

    /**
     * List existing DNS records for a domain.
     */
    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        $filterName = $name !== null ? $this->normalizeRecordName($domain, $name) : null;
        $filterType = $type !== null ? strtoupper($type) : null;

        try {
            $records = [];
            $skip = 0;

            do {
                $response = $this->client->get('dns/records/' . rawurlencode($domain), [
                    'query' => ['take' => self::PAGE_SIZE, 'skip' => $skip],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                $items = $data['items'] ?? [];

                foreach ($items as $record) {
                    if ($filterType !== null && strtoupper($record['type'] ?? '') !== $filterType) {
                        continue;
                    }
                    if ($filterName !== null && $this->fullRecordName($record) !== $filterName) {
                        continue;
                    }
                    $records[] = $record;
                }

                $skip += count($items);
            } while (!empty($items) && $skip < ($data['total'] ?? 0));

            return $records;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('spaceship', $this->parseErrorMessage($e));
        }
    }

    /**
     * Get the configuration schema for Spaceship.
     */
    public function getConfigurationSchema(): array
    {
        return [
            'api_key' => [
                'type' => 'string',
                'label' => 'API key',
                'required' => true,
                'description' => 'The key Spaceship shows under "Use this key in your external application". Needs the domains:read, dnsrecords:read and dnsrecords:write scopes',
                'sensitive' => true,
            ],
            'api_secret' => [
                'type' => 'string',
                'label' => 'Secret',
                'required' => true,
                'description' => 'The value Spaceship shows under "Secret" when the API key is created',
                'sensitive' => true,
            ],
        ];
    }

    /**
     * Validate the provider configuration.
     */
    public function validateConfiguration(array $config): bool
    {
        if (empty($config['api_key'])) {
            throw DnsProviderException::invalidConfiguration('spaceship', 'api_key');
        }

        if (empty($config['api_secret'])) {
            throw DnsProviderException::invalidConfiguration('spaceship', 'api_secret');
        }

        return true;
    }

    /**
     * Get the supported record types for Spaceship.
     */
    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'SRV'];
    }

    /**
     * Build a Spaceship record item (without TTL) from the generic record data.
     */
    private function buildItem(string $domain, string $name, string $type, $content): array
    {
        $name = $this->normalizeRecordName($domain, $name);

        switch ($type) {
            case 'A':
            case 'AAAA':
                return ['type' => $type, 'name' => $name, 'address' => $this->scalarContent($content)];
            case 'CNAME':
                return ['type' => $type, 'name' => $name, 'cname' => rtrim($this->scalarContent($content), '.')];
            case 'SRV':
                return $this->buildSrvItem($name, is_array($content) ? $content : ['content' => (string) $content]);
            default:
                throw DnsProviderException::unsupportedRecordType('spaceship', $type);
        }
    }

    /**
     * Spaceship keeps the service and protocol labels out of the SRV record name.
     */
    private function buildSrvItem(string $name, array $content): array
    {
        $service = $content['service'] ?? null;
        $protocol = $content['proto'] ?? $content['protocol'] ?? null;

        // "_service._proto.host" -> ["_service", "_proto", "host"]
        $labels = explode('.', $name);
        if (count($labels) >= 2 && str_starts_with($labels[0], '_') && str_starts_with($labels[1], '_')) {
            $service ??= $labels[0];
            $protocol ??= $labels[1];
            $name = implode('.', array_slice($labels, 2));
        }

        // Fall back to the "SRV {priority} {weight} {port} {target}" string
        $parts = isset($content['content']) && is_string($content['content']) ? explode(' ', $content['content']) : [];
        if (count($parts) >= 5 && strtoupper($parts[0]) === 'SRV') {
            $content += ['priority' => $parts[1], 'weight' => $parts[2], 'port' => $parts[3], 'target' => $parts[4]];
        }

        if (empty($service) || empty($protocol) || !isset($content['port'], $content['target'])) {
            throw new DnsProviderException("Incomplete SRV record data for '{$name}'.");
        }

        return [
            'type' => 'SRV',
            'name' => $name === '' ? '@' : $name,
            'service' => $service,
            'protocol' => $protocol,
            'priority' => (int) ($content['priority'] ?? 0),
            'weight' => (int) ($content['weight'] ?? 0),
            'port' => (int) $content['port'],
            'target' => rtrim((string) $content['target'], '.'),
        ];
    }

    /**
     * The record ID is the record type and its full name relative to the zone,
     * e.g. "A/play" or "SRV/_minecraft._tcp.play". It stays stable when the value changes.
     */
    private function buildRecordId(array $item): string
    {
        return $item['type'] . '/' . $this->fullRecordName($item);
    }

    private function parseRecordId(string $recordId): array
    {
        $parts = explode('/', $recordId, 2);
        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            throw new DnsProviderException("Invalid Spaceship DNS record identifier: {$recordId}");
        }

        return [strtoupper($parts[0]), $parts[1]];
    }

    /**
     * Find the custom records a record ID refers to.
     */
    private function findRecords(string $domain, string $recordId): array
    {
        [$type, $name] = $this->parseRecordId($recordId);

        return array_values(array_filter(
            $this->listRecords($domain, $name, $type),
            fn (array $record) => ($record['group']['type'] ?? 'custom') === 'custom'
        ));
    }

    private function saveRecords(string $domain, array $items): void
    {
        $this->client->put('dns/records/' . rawurlencode($domain), [
            'json' => ['force' => false, 'items' => $items],
        ]);
    }

    private function removeRecords(string $domain, array $records): void
    {
        $items = array_map(function (array $record) {
            unset($record['ttl'], $record['group']);

            return $record;
        }, $records);

        $this->client->delete('dns/records/' . rawurlencode($domain), [
            'json' => array_values($items),
        ]);
    }

    /**
     * Record name relative to the zone, including the SRV service and protocol labels.
     */
    private function fullRecordName(array $record): string
    {
        $name = strtolower($record['name'] ?? '@');

        if (strtoupper($record['type'] ?? '') === 'SRV' && isset($record['service'], $record['protocol'])) {
            $prefix = strtolower($record['service'] . '.' . $record['protocol']);

            return $name === '@' ? $prefix : $prefix . '.' . $name;
        }

        return $name;
    }

    /**
     * Everything that identifies a record besides its TTL.
     */
    private function identity(array $record): string
    {
        unset($record['ttl'], $record['group']);
        ksort($record);

        return strtolower(json_encode($record));
    }

    private function extractContent(array $record)
    {
        return match (strtoupper($record['type'] ?? '')) {
            'A', 'AAAA' => $record['address'] ?? '',
            'CNAME' => $record['cname'] ?? '',
            'SRV' => [
                'service' => $record['service'] ?? null,
                'proto' => $record['protocol'] ?? null,
                'priority' => $record['priority'] ?? 0,
                'weight' => $record['weight'] ?? 0,
                'port' => $record['port'] ?? null,
                'target' => $record['target'] ?? null,
            ],
            default => $record,
        };
    }

    private function scalarContent($content): string
    {
        if (is_array($content)) {
            return (string) ($content['content'] ?? $content['value'] ?? '');
        }

        return (string) $content;
    }

    /**
     * Spaceship expects names relative to the zone, with "@" for the apex.
     */
    private function normalizeRecordName(string $domain, string $name): string
    {
        $domain = strtolower(rtrim($domain, '.'));
        $name = strtolower(rtrim($name, '.'));

        if ($name === '' || $name === '@' || $name === $domain) {
            return '@';
        }

        if (str_ends_with($name, '.' . $domain)) {
            return substr($name, 0, -strlen('.' . $domain));
        }

        return $name;
    }

    private function clampTtl(int $ttl): int
    {
        return max(self::MIN_TTL, min(self::MAX_TTL, $ttl));
    }

    private function parseErrorMessage(GuzzleException $e): string
    {
        if (!$e instanceof RequestException || !$e->hasResponse()) {
            return 'DNS service temporarily unavailable.';
        }

        $data = json_decode((string) $e->getResponse()->getBody(), true);
        if (!is_array($data)) {
            return 'DNS provider rejected the request.';
        }

        $messages = [];
        foreach ($data['data'] ?? [] as $error) {
            if (!empty($error['details'])) {
                $messages[] = $error['details'];
            }
        }

        return empty($messages) ? ($data['detail'] ?? 'DNS provider rejected the request.') : implode(' ', $messages);
    }
}
