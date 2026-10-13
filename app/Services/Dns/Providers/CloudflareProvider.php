<?php

namespace Pterodactyl\Services\Dns\Providers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Illuminate\Support\Facades\Log;

use Pterodactyl\Services\Dns;


class CloudflareProvider implements DnsProviderInterface
{
    public const TOKEN_REJECTED = 'The API token was rejected by Cloudflare.';

    private Client $client;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        // Only initialize the client if we have an API token
        if (!empty($config['api_token'])) {
            $this->client = new Client([
                'base_uri' => 'https://api.cloudflare.com/client/v4/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $config['api_token'],
                    'Content-Type' => 'application/json',
                ],
                'timeout' => 30,
            ]);
        }
    }

    /**
     * Test the connection to Cloudflare API.
     */
    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('cloudflare', 'api_token');
        }

        try {
            $response = $this->client->get('user/tokens/verify');
            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw DnsProviderException::authenticationFailed('cloudflare');
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', $e->getMessage());
        }
    }

    /**
     * Create a DNS record.
     */
    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $zoneId = $this->getZoneId($domain);
        $displayName = $name;
        $name = $this->normalizeRecordName($domain, $name);


        try {
            $payload = [
                'type' => strtoupper($type),
                'name' => $name,
                'ttl' => $ttl,
            ];

            if (!empty($this->config['comment'])) {
                $payload['comment'] = $this->config['comment'];
            }

            // Handle different content types
            if (is_array($content)) {
                // For SRV records and other structured data
                $payload['data'] = $content;
                if (isset($content['content'])) {
                    $payload['content'] = $content['content'];
                }
            } else {
                // For simple records like A, CNAME
                $payload['content'] = $content;
            }

            $response = $this->client->post("zones/{$zoneId}/dns_records", [
                'json' => $payload
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception('DNS provider rejected the record creation request.');
            }

            /* Log::debug("Create Record", [ */
            /*     "Domain" => $domain, */
            /*     "Name" => $name, */
            /*     "Payload" => $payload, */
            /*     "Response" => $response, */
            /*     "Data" => $data */
            /* ]); */

            return $data['result']['id'];
        } catch (RequestException $e) {
            throw DnsProviderException::recordCreationFailed(
                $domain,
                $displayName,
                $this->getRequestExceptionMessage($e)
            );
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordCreationFailed($domain, $displayName, $this->failureReason($e));
        }
    }

    /**
     * Update a DNS record.
     */
    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $payload = [];

            if (!empty($this->config['comment'])) {
                $payload['comment'] = $this->config['comment'];
            }

            // Handle different content types
            if (is_array($content)) {
                // For SRV records and other structured data
                $payload['data'] = $content;
                if (isset($content['content'])) {
                    $payload['content'] = $content['content'];
                }
            } else {
                // For simple records like A, CNAME
                $payload['content'] = $content;
            }

            if ($ttl !== null) {
                $payload['ttl'] = $ttl;
            }

            $response = $this->client->patch("zones/{$zoneId}/dns_records/{$recordId}", [
                'json' => $payload
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception('DNS provider rejected the record update request.');
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordUpdateFailed($domain, [$recordId], $this->failureReason($e));
        }
    }

    /**
     * Delete a DNS record.
     */
    public function deleteRecord(string $domain, string $recordId): void
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $response = $this->client->delete("zones/{$zoneId}/dns_records/{$recordId}");
            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception('DNS provider rejected the record deletion request.');
            }
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordDeletionFailed($domain, [$recordId], $this->failureReason($e));
        }
    }

    /**
     * Get a specific DNS record.
     */
    public function getRecord(string $domain, string $recordId): array
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $response = $this->client->get("zones/{$zoneId}/dns_records/{$recordId}");
            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception("DNS record not found or inaccessible.");
            }

            return $data['result'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', $this->failureReason($e));
        }
    }

    /**
     * List existing DNS records for a domain.
     */
    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $params = [];
            if ($name) {
                $params['name'] = $this->normalizeRecordName($domain, $name);
            }
            if ($type) {
                $params['type'] = strtoupper($type);
            }

            $response = $this->client->get("zones/{$zoneId}/dns_records", [
                'query' => $params
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception('Failed to retrieve DNS records.');
            }

            return $data['result'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', $this->failureReason($e));
        }
    }

    /**
     * Find the zone a hostname belongs to by walking up its labels, so
     * 'play.example.com' and 'example.com' both resolve to the 'example.com' zone.
     *
     * @return array{id: string, name: string}|null
     */
    public function findZone(string $hostname): ?array
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('cloudflare', 'api_token');
        }

        $labels = explode('.', rtrim($hostname, '.'));

        try {
            while (count($labels) >= 2) {
                $response = $this->client->get('zones', [
                    'query' => ['name' => implode('.', $labels)]
                ]);

                $data = json_decode($response->getBody()->getContents(), true);

                if (!empty($data['result'])) {
                    return ['id' => $data['result'][0]['id'], 'name' => $data['result'][0]['name']];
                }

                array_shift($labels);
            }
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', $this->failureReason($e));
        }

        return null;
    }

    private function normalizeRecordName(string $domain, string $name): string
    {
        $domain = rtrim($domain, '.');
        $name = rtrim($name, '.');

        if ($name === '' || $name === '@') {
            return $domain;
        }

        if ($name === $domain || str_ends_with($name, '.' . $domain)) {
            return $name;
        }

        return $name . '.' . $domain;
    }

    /**
     * Describe why a request to Cloudflare failed, telling a rejected API
     * token apart from Cloudflare being unreachable.
     */
    private function failureReason(GuzzleException $e): string
    {
        $status = $e instanceof RequestException ? $e->getResponse()?->getStatusCode() : null;

        return in_array($status, [401, 403], true) ? self::TOKEN_REJECTED : 'DNS service temporarily unavailable.';
    }

    private function getRequestExceptionMessage(RequestException $e): string
    {
        $response = $e->getResponse();
        if (!$response || in_array($response->getStatusCode(), [401, 403], true)) {
            return $this->failureReason($e);
        }

        $data = json_decode((string) $response->getBody(), true);
        if (!is_array($data)) {
            return 'DNS provider rejected the record creation request.';
        }

        $messages = [];
        foreach ($data['errors'] ?? [] as $error) {
            if (!empty($error['message'])) {
                $messages[] = $error['message'];
            }
        }

        return empty($messages) ? 'DNS provider rejected the record creation request.' : implode(' ', $messages);
    }

    /**
     * Get the configuration schema for Cloudflare.
     */
    public function getConfigurationSchema(): array
    {
        return [
            'api_token' => [
                'type' => 'string',
                'required' => true,
                'description' => 'Cloudflare API Token with Zone:Edit permissions',
                'sensitive' => true,
            ],
            'zone_id' => [
                'type' => 'string',
                'required' => true,
                'description' => 'Cloudflare Zone ID',
                'sensitive' => false,
            ],
        ];
    }

    /**
     * Validate the provider configuration.
     */
    public function validateConfiguration(array $config): bool
    {
        if (empty($config['api_token'])) {
            throw DnsProviderException::invalidConfiguration('cloudflare', 'api_token');
        }

        return true;
    }

    /**
     * Get the supported record types for Cloudflare.
     */
    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'PTR', 'CAA'];
    }

    /**
     * Get the zone ID for a domain.
     */
    private function getZoneId(string $domain): string
    {
        // Use provided zone_id if available
        if (!empty($this->config['zone_id'])) {
            return $this->config['zone_id'];
        }

        // Fall back to auto-discovery
        try {
            $response = $this->client->get('zones', [
                'query' => ['name' => $domain]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success'] || empty($data['result'])) {
                throw new \Exception("Domain zone not found or inaccessible.");
            }

            return $data['result'][0]['id'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', $this->failureReason($e));
        }
    }
}
