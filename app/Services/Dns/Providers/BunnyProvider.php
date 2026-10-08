<?php

namespace Pterodactyl\Services\Dns\Providers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;

class BunnyProvider implements DnsProviderInterface
{
    private const RECORD_TYPE_MAP = [
        'A' => 0, 'AAAA' => 1, 'CNAME' => 2, 'TXT' => 3, 'MX' => 4,
        'REDIRECT' => 5, 'FLATTEN' => 6, 'PULLZONE' => 7, 'SRV' => 8,
        'CAA' => 9, 'PTR' => 10, 'SCRIPT' => 11, 'NS' => 12,
        'SVCB' => 13, 'HTTPS' => 14, 'TLSA' => 15,
    ];

    private Client $client;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        if (!empty($config['api_key'])) {
            $this->client = new Client([
                'base_uri' => 'https://api.bunny.net/',
                'headers' => [
                    'AccessKey' => $config['api_key'],
                    'Content-Type' => 'application/json',
                ],
                'timeout' => 30,
            ]);
        }
    }

    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('bunny', 'api_key');
        }

        try {
            $response = $this->client->get('dnszone', [
                'query' => ['page' => 1, 'perPage' => 1],
            ]);
            $data = json_decode($response->getBody()->getContents(), true);

            if (!empty($data['ErrorKey'])) {
                throw DnsProviderException::connectionFailed('bunny', $data['Message'] ?? $data['ErrorKey']);
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('bunny', $this->parseErrorMessage($e));
        }
    }

    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $payload = [
                'Type' => $this->getRecordTypeCode($type),
                'Ttl' => $ttl,
                'Name' => $this->normalizeRecordName($domain, $name),
            ];

            $this->applyContentToPayload($payload, $content, $type);

            $response = $this->client->put("dnszone/{$zoneId}/records", [
                'json' => $payload,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!empty($data['ErrorKey'])) {
                throw DnsProviderException::recordCreationFailed($domain, $name, $data['Message'] ?? $data['ErrorKey']);
            }

            return (string) $data['Id'];
        } catch (RequestException $e) {
            throw DnsProviderException::recordCreationFailed($domain, $name, $this->getRequestExceptionMessage($e));
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordCreationFailed($domain, $name, $this->parseErrorMessage($e));
        }
    }

    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        $zoneId = $this->getZoneId($domain);
        $recordId = (int) $recordId;

        try {
            $existing = $this->getRecord($domain, (string) $recordId);

            $payload = [
                'Id' => $recordId,
                'Type' => $existing['Type'] ?? self::RECORD_TYPE_MAP['A'],
                'Name' => $existing['Name'] ?? '',
                'Ttl' => $ttl ?? $existing['Ttl'] ?? 300,
            ];

            $typeString = $existing['TypeString'] ?? 'A';
            $this->applyContentToPayload($payload, $content, $typeString);

            $response = $this->client->post("dnszone/{$zoneId}/records/{$recordId}", [
                'json' => $payload,
            ]);

            $body = $response->getBody()->getContents();
            if (!empty($body)) {
                $data = json_decode($body, true);
                if (!empty($data['ErrorKey'])) {
                    throw DnsProviderException::recordUpdateFailed($domain, [$recordId], $data['Message'] ?? $data['ErrorKey']);
                }
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordUpdateFailed($domain, [(string) $recordId], $this->parseErrorMessage($e));
        }
    }

    public function deleteRecord(string $domain, string $recordId): void
    {
        $zoneId = $this->getZoneId($domain);
        $recordId = (int) $recordId;

        try {
            $response = $this->client->delete("dnszone/{$zoneId}/records/{$recordId}");

            $body = $response->getBody()->getContents();
            if (!empty($body)) {
                $data = json_decode($body, true);
                if (!empty($data['ErrorKey'])) {
                    throw DnsProviderException::recordDeletionFailed($domain, [(string) $recordId], $data['Message'] ?? $data['ErrorKey']);
                }
            }
        } catch (GuzzleException $e) {
            if ($e instanceof RequestException && $e->hasResponse() && $e->getResponse()->getStatusCode() === 404) {
                return;
            }
            throw DnsProviderException::recordDeletionFailed($domain, [(string) $recordId], $this->parseErrorMessage($e));
        }
    }

    public function getRecord(string $domain, string $recordId): array
    {
        $zoneId = $this->getZoneId($domain);
        $recordId = (int) $recordId;

        try {
            $response = $this->client->get("dnszone/{$zoneId}/records", [
                'query' => ['page' => 1, 'perPage' => 5000],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!empty($data['ErrorKey'])) {
                throw DnsProviderException::connectionFailed('bunny', $data['Message'] ?? $data['ErrorKey']);
            }

            foreach ($data['Items'] ?? $data['Records'] ?? [] as $record) {
                if ((int) ($record['Id'] ?? -1) === $recordId) {
                    $record['TypeString'] = array_flip(self::RECORD_TYPE_MAP)[$record['Type'] ?? -1] ?? 'A';

                    return $record;
                }
            }

            throw DnsProviderException::recordDeletionFailed($domain, [(string) $recordId], __('exceptions.dns.record_not_found_reason'));
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('bunny', $this->parseErrorMessage($e));
        }
    }

    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        $zoneId = $this->getZoneId($domain);
        $typeCode = $type !== null ? (self::RECORD_TYPE_MAP[strtoupper($type)] ?? -1) : null;
        $filterName = $name !== null ? $this->normalizeRecordName($domain, $name) : null;

        try {
            $allRecords = [];
            $page = 1;

            do {
                $response = $this->client->get("dnszone/{$zoneId}/records", [
                    'query' => ['page' => $page, 'perPage' => 100],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);

                if (!empty($data['ErrorKey'])) {
                    throw DnsProviderException::connectionFailed('bunny', $data['Message'] ?? $data['ErrorKey']);
                }

                foreach ($data['Items'] ?? $data['Records'] ?? [] as $record) {
                    if ($filterName !== null && ($record['Name'] ?? '') !== $filterName) {
                        continue;
                    }
                    if ($typeCode !== null && ($record['Type'] ?? -1) !== $typeCode) {
                        continue;
                    }
                    $record['TypeString'] = array_flip(self::RECORD_TYPE_MAP)[$record['Type'] ?? -1] ?? 'UNKNOWN';
                    $allRecords[] = $record;
                }

                $hasMorePages = $data['HasMoreItems'] ?? false;
                ++$page;
            } while ($hasMorePages);

            return $allRecords;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('bunny', $this->parseErrorMessage($e));
        }
    }

    public function getConfigurationSchema(): array
    {
        return [
            'api_key' => [
                'type' => 'string',
                'required' => true,
                'description' => __('admin/domains.schema.bunny.api_key'),
                'sensitive' => true,
            ],
            'zone_id' => [
                'type' => 'string',
                'required' => true,
                'description' => __('admin/domains.schema.bunny.zone_id'),
                'sensitive' => false,
            ],
        ];
    }

    public function validateConfiguration(array $config): bool
    {
        if (empty($config['api_key'])) {
            throw DnsProviderException::invalidConfiguration('bunny', 'api_key');
        }

        if (empty($config['zone_id'])) {
            throw DnsProviderException::invalidConfiguration('bunny', 'zone_id');
        }

        return true;
    }

    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'PTR', 'CAA', 'REDIRECT', 'FLATTEN', 'PULLZONE'];
    }

    private function getZoneId(string $domain): string
    {
        if (!empty($this->config['zone_id'])) {
            return (string) $this->config['zone_id'];
        }

        try {
            $page = 1;

            do {
                $response = $this->client->get('dnszone', [
                    'query' => ['page' => $page, 'perPage' => 100],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);

                if (!empty($data['ErrorKey'])) {
                    throw DnsProviderException::connectionFailed('bunny', $data['Message'] ?? $data['ErrorKey']);
                }

                foreach ($data['Items'] ?? $data['Records'] ?? [] as $zone) {
                    if (($zone['Domain'] ?? '') === $domain) {
                        return (string) $zone['Id'];
                    }
                }

                $hasMorePages = $data['HasMoreItems'] ?? false;
                ++$page;
            } while ($hasMorePages);

            throw new \Exception(__('exceptions.dns.bunny_zone_not_found', ['domain' => $domain]));
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('bunny', $this->parseErrorMessage($e));
        }
    }

    private function normalizeRecordName(string $domain, string $name): string
    {
        $domain = rtrim($domain, '.');
        $name = rtrim($name, '.');

        if ($name === '' || $name === '@') {
            return '';
        }

        if ($name === $domain || str_ends_with($name, '.' . $domain)) {
            return substr($name, 0, -strlen('.' . $domain));
        }

        return $name;
    }

    private function getRecordTypeCode(string $type): int
    {
        $upperType = strtoupper($type);
        if (!isset(self::RECORD_TYPE_MAP[$upperType])) {
            throw DnsProviderException::unsupportedRecordType('bunny', $upperType);
        }

        return self::RECORD_TYPE_MAP[$upperType];
    }

    /**
     * Build the payload fields from the content (handles both simple strings and SRV arrays).
     */
    private function applyContentToPayload(array &$payload, $content, string $type): void
    {
        if (!is_array($content)) {
            $payload['Value'] = (string) $content;

            return;
        }

        // Parse SRV content string: "SRV {priority} {weight} {port} {target}"
        if (isset($content['content']) && is_string($content['content'])) {
            $parts = explode(' ', $content['content']);
            if (count($parts) >= 5 && strtoupper($parts[0]) === 'SRV') {
                $payload['Priority'] = (int) $parts[1];
                $payload['Weight'] = (int) $parts[2];
                $payload['Port'] = (int) $parts[3];
                $payload['Value'] = $parts[4];

                return;
            }
        }

        if (isset($content['priority'])) {
            $payload['Priority'] = (int) $content['priority'];
        }
        if (isset($content['weight'])) {
            $payload['Weight'] = (int) $content['weight'];
        }
        if (isset($content['port'])) {
            $payload['Port'] = (int) $content['port'];
        }
        if (isset($content['target'])) {
            $payload['Value'] = $content['target'];
        } elseif (isset($content['content'])) {
            $payload['Value'] = (string) $content['content'];
        }
    }

    private function getRequestExceptionMessage(RequestException $e): string
    {
        $response = $e->getResponse();
        if (!$response) {
            return __('exceptions.dns.service_unavailable');
        }

        $data = json_decode((string) $response->getBody(), true);
        if (!is_array($data)) {
            return __('exceptions.dns.provider_rejected_creation');
        }

        return $data['Message'] ?? $data['ErrorKey'] ?? __('exceptions.dns.provider_rejected_creation');
    }

    private function parseErrorMessage(GuzzleException $e): string
    {
        if ($e instanceof RequestException && $e->hasResponse()) {
            return $this->getRequestExceptionMessage($e);
        }

        $message = $e->getMessage();

        return strlen($message) > 200 ? __('exceptions.dns.service_unavailable') : $message;
    }
}
