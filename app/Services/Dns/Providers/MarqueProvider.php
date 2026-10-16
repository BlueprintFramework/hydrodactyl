<?php

namespace Pterodactyl\Services\Dns\Providers;

use Pterodactyl\Models\AtprotoOauthSession;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Pterodactyl\Services\Atproto\AtprotoOAuthService;
use Pterodactyl\Services\Atproto\AtprotoPasswordService;
use Pterodactyl\Exceptions\Atproto\AtprotoOAuthException;

class MarqueProvider implements DnsProviderInterface
{
    private const DNS_COLLECTION = 'at.marque.dns';
    private const DOMAIN_COLLECTION = 'at.marque.domain';

    /**
     * How many times a zone write is retried when a concurrent write invalidates
     * the CID we based our change on.
     */
    private const MAX_WRITE_ATTEMPTS = 3;

    private ?AtprotoOauthSession $session = null;

    public function __construct(
        private readonly array $config,
        private readonly ?AtprotoOAuthService $oauth = null,
        private readonly ?AtprotoPasswordService $password = null,
    ) {
    }

    /**
     * Test the connection by probing the PDS with the configured credentials.
     */
    public function testConnection(): bool
    {
        try {
            $this->describeRepository();
        } catch (AtprotoOAuthException $exception) {
            throw new DnsProviderException($exception->getMessage(), 0, $exception);
        }

        return true;
    }

    /**
     * Create a DNS record.
     *
     * Marque stores a whole zone in a single record, so there is no server
     * assigned record identifier. We return a synthetic "{name}/{type}" id
     * (the same convention used by the Hetzner provider) that can be resolved
     * against the live zone on later calls.
     */
    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $entry = $this->buildEntry($domain, $name, $type, $content, $ttl);

        try {
            $this->mutateZone($domain, function (array $records) use ($entry): array {
                $records[] = $entry;

                return $records;
            });
        } catch (AtprotoOAuthException $exception) {
            throw DnsProviderException::recordCreationFailed($domain, $name, $exception->getMessage());
        }

        return $this->makeRecordId($entry['name'], $type);
    }

    /**
     * Update a DNS record.
     *
     * The live entry matching the "{name}/{type}" identity is replaced in place;
     * any duplicate entries of the same identity are collapsed into the update.
     */
    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        [$name, $type] = $this->parseRecordId($recordId);

        try {
            $existing = $this->findEntry($domain, $name, $type);
            $entry = $this->buildEntry($domain, $name, $type, $content, $ttl ?? (int) ($existing['ttl'] ?? 300));

            $this->mutateZone($domain, function (array $records) use ($entry, $name, $type): array {
                $result = [];
                $replaced = false;

                foreach ($records as $record) {
                    if ($this->entryMatches($record, $name, $type)) {
                        if (!$replaced) {
                            $result[] = $entry;
                            $replaced = true;
                        }

                        continue;
                    }

                    $result[] = $record;
                }

                if (!$replaced) {
                    $result[] = $entry;
                }

                return $result;
            });

            return true;
        } catch (AtprotoOAuthException $exception) {
            throw DnsProviderException::recordUpdateFailed($domain, [$recordId], $exception->getMessage());
        }
    }

    /**
     * Delete a DNS record.
     */
    public function deleteRecord(string $domain, string $recordId): void
    {
        [$name, $type] = $this->parseRecordId($recordId);

        try {
            // Nothing to do when the entry is already gone; also avoids requiring
            // a matching at.marque.domain record for a no-op.
            if ($this->findEntry($domain, $name, $type) === null) {
                return;
            }

            $this->mutateZone($domain, fn (array $records): array => array_values(array_filter(
                $records,
                fn ($record) => !$this->entryMatches($record, $name, $type)
            )));
        } catch (AtprotoOAuthException $exception) {
            throw DnsProviderException::recordDeletionFailed($domain, [$recordId], $exception->getMessage());
        }
    }

    /**
     * Get a specific DNS record by its synthetic "{name}/{type}" identifier.
     *
     * The returned "content" key is shaped so it can be fed straight back into
     * updateRecord() during subdomain rollbacks.
     */
    public function getRecord(string $domain, string $recordId): array
    {
        [$name, $type] = $this->parseRecordId($recordId);

        try {
            $entry = $this->findEntry($domain, $name, $type);
        } catch (AtprotoOAuthException $exception) {
            throw DnsProviderException::connectionFailed('marque', $exception->getMessage());
        }

        if ($entry === null) {
            throw new DnsProviderException("DNS record '{$recordId}' was not found in the Marque zone for '{$domain}'.");
        }

        return $this->normalizeRecord($entry);
    }

    /**
     * List existing DNS records for a domain.
     */
    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        try {
            $zone = $this->readZone($domain);
        } catch (AtprotoOAuthException $exception) {
            throw DnsProviderException::connectionFailed('marque', $exception->getMessage());
        }

        if ($zone === null) {
            return [];
        }

        $nameFilter = $name !== null ? $this->normalizeName($domain, $name) : null;
        $typeFilter = $type !== null ? strtoupper($type) : null;

        $records = [];
        foreach ($this->zoneEntries($zone) as $entry) {
            if ($typeFilter !== null && strtoupper((string) ($entry['recordType'] ?? '')) !== $typeFilter) {
                continue;
            }

            if ($nameFilter !== null && $this->normalizeName($domain, (string) ($entry['name'] ?? '')) !== $nameFilter) {
                continue;
            }

            $records[] = $this->normalizeRecord($entry);
        }

        return $records;
    }

    /**
     * Get the configuration schema for Marque.
     *
     * The account can either be connected through OAuth (which stores a session
     * id) or by pasting a handle/DID and app password.
     */
    public function getConfigurationSchema(): array
    {
        return [
            'session_id' => [
                'type' => 'string',
                'label' => 'AT Protocol account',
                'required' => false,
                'description' => 'The connected AT Protocol account whose repository holds this domain\'s DNS records.',
                'sensitive' => false,
            ],
            'identifier' => [
                'type' => 'string',
                'label' => 'Handle or DID',
                'required' => false,
                'description' => 'Used with an app password. The AT Protocol handle (e.g. alice.bsky.social) or DID of the account that owns the domain.',
                'sensitive' => false,
            ],
            'app_password' => [
                'type' => 'string',
                'label' => 'App password',
                'required' => false,
                'description' => 'Used with a handle/DID. An AT Protocol app password created for this panel. Never use the account\'s main password.',
                'sensitive' => true,
            ],
            'pds_url' => [
                'type' => 'string',
                'label' => 'PDS URL',
                'required' => false,
                'description' => 'Optional. Base URL of the account\'s PDS when using an app password. Leave empty to discover it automatically.',
                'sensitive' => false,
                'default' => '',
            ],
        ];
    }

    /**
     * Validate the provider configuration.
     */
    public function validateConfiguration(array $config): bool
    {
        if (!empty($config['session_id'])) {
            return true;
        }

        if (empty($config['identifier']) || empty($config['app_password'])) {
            throw new DnsProviderException('Connect an AT Protocol account or provide a handle/DID and app password for Marque.');
        }

        return true;
    }

    /**
     * Get the supported record types for Marque.
     *
     * Mirrors the knownValues of the at.marque.dns lexicon.
     */
    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'CAA'];
    }

    // ---------------------------------------------------------------------
    // Authentication mode
    // ---------------------------------------------------------------------

    private function usesOAuth(): bool
    {
        return !empty($this->config['session_id']);
    }

    /**
     * Resolve the configured OAuth session (OAuth mode only).
     */
    protected function session(): AtprotoOauthSession
    {
        if ($this->session !== null) {
            return $this->session;
        }

        $session = AtprotoOauthSession::query()->find($this->config['session_id'] ?? null);

        if (!$session || !$session->isAuthorized()) {
            throw new DnsProviderException('The configured Marque AT Protocol connection is missing or no longer authorized. Reconnect the account in the admin panel.');
        }

        return $this->session = $session;
    }

    private function oauth(): AtprotoOAuthService
    {
        return $this->oauth ?? app(AtprotoOAuthService::class);
    }

    private function password(): AtprotoPasswordService
    {
        return $this->password ?? new AtprotoPasswordService($this->config);
    }

    /**
     * Probe the PDS with whichever credentials are configured.
     *
     * @throws AtprotoOAuthException
     */
    private function describeRepository(): array
    {
        return $this->usesOAuth()
            ? $this->oauth()->describeSession($this->session())
            : $this->password()->describe();
    }

    /**
     * @throws AtprotoOAuthException
     */
    private function readRemoteRecord(string $collection, string $rkey): ?array
    {
        return $this->usesOAuth()
            ? $this->oauth()->repoGetRecord($this->session(), $collection, $rkey)
            : $this->password()->getRecord($collection, $rkey);
    }

    /**
     * @throws AtprotoOAuthException
     */
    private function writeRemoteRecord(string $collection, string $rkey, array $record, ?string $swapRecord): array
    {
        return $this->usesOAuth()
            ? $this->oauth()->repoPutRecord($this->session(), $collection, $rkey, $record, $swapRecord)
            : $this->password()->putRecord($collection, $rkey, $record, $swapRecord);
    }

    // ---------------------------------------------------------------------
    // Zone mapping
    // ---------------------------------------------------------------------

    /**
     * Read the at.marque.dns record for a domain, or null when none exists yet.
     *
     * @throws AtprotoOAuthException
     */
    private function readZone(string $domain): ?array
    {
        return $this->readRemoteRecord(self::DNS_COLLECTION, $this->zoneKey($domain));
    }

    /**
     * Return the entries held by a zone record.
     */
    private function zoneEntries(?array $zone): array
    {
        $records = $zone['value']['records'] ?? [];

        return is_array($records) ? array_values(array_filter($records, 'is_array')) : [];
    }

    /**
     * Resolve the at.marque.domain strong reference (uri + cid) required by the
     * zone record.
     *
     * @throws AtprotoOAuthException
     */
    private function resolveSubject(string $domain): array
    {
        $record = $this->readRemoteRecord(self::DOMAIN_COLLECTION, $this->zoneKey($domain));

        if ($record === null || empty($record['cid'])) {
            throw new DnsProviderException("No at.marque.domain record was found for '{$domain}' in the connected AT Protocol repository.");
        }

        return [
            'uri' => (string) ($record['uri'] ?? ''),
            'cid' => (string) $record['cid'],
        ];
    }

    /**
     * Apply a mutation to the at.marque.dns zone, retrying when a concurrent
     * writer invalidates the record version we based our change on.
     *
     * @throws AtprotoOAuthException
     */
    private function mutateZone(string $domain, callable $mutate): void
    {
        $subject = $this->resolveSubject($domain);
        $rkey = $this->zoneKey($domain);

        for ($attempt = 1; $attempt <= self::MAX_WRITE_ATTEMPTS; ++$attempt) {
            $zone = $this->readZone($domain);
            $records = $mutate($this->zoneEntries($zone));

            $record = [
                '$type' => self::DNS_COLLECTION,
                'domain' => $rkey,
                'subject' => $subject,
                'records' => array_values($records),
                'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
            ];

            try {
                $this->writeRemoteRecord(self::DNS_COLLECTION, $rkey, $record, $zone['cid'] ?? null);

                return;
            } catch (AtprotoOAuthException $exception) {
                if ($attempt < self::MAX_WRITE_ATTEMPTS && str_contains($exception->getMessage(), 'InvalidSwap')) {
                    continue;
                }

                throw $exception;
            }
        }
    }

    /**
     * Find a single zone entry matching a normalized "{name}/{type}" identity.
     *
     * @throws AtprotoOAuthException
     */
    private function findEntry(string $domain, string $name, string $type): ?array
    {
        foreach ($this->zoneEntries($this->readZone($domain)) as $entry) {
            if ($this->entryMatches($entry, $name, $type)) {
                return $entry;
            }
        }

        return null;
    }

    /**
     * Does a zone entry match the given normalized name and record type?
     */
    private function entryMatches(array $entry, string $name, string $type): bool
    {
        return strtoupper((string) ($entry['recordType'] ?? '')) === strtoupper($type)
            && strtolower((string) ($entry['name'] ?? '')) === strtolower($name);
    }

    /**
     * Build an at.marque.dns entry from the generic Hydrodactyl record data.
     */
    private function buildEntry(string $domain, string $name, string $type, $content, int $ttl): array
    {
        $type = strtoupper($type);

        $entry = [
            'name' => $this->normalizeName($domain, $name),
            'recordType' => $type,
            'ttl' => max(1, $ttl),
        ];

        if ($type === 'SRV') {
            [$entry['priority'], $entry['value']] = $this->extractSrv($content);
        } elseif ($type === 'MX') {
            [$entry['priority'], $entry['value']] = $this->extractMx($content);
        } else {
            $entry['value'] = $this->valueOf($content);
        }

        return $entry;
    }

    /**
     * Shape a zone entry the way the rest of the panel expects: a plain record
     * plus a "content" blob that can be replayed through buildEntry().
     */
    private function normalizeRecord(array $entry): array
    {
        $type = strtoupper((string) ($entry['recordType'] ?? ''));
        $name = strtolower((string) ($entry['name'] ?? ''));
        $value = (string) ($entry['value'] ?? '');
        $ttl = (int) ($entry['ttl'] ?? 300);
        $prio = (int) ($entry['priority'] ?? 0);

        return [
            'name' => $name,
            'type' => $type,
            'value' => $value,
            'ttl' => $ttl,
            'prio' => $prio,
            'content' => $this->toContent($type, $value, $prio),
        ];
    }

    /**
     * Rebuild the Hydrodactyl-style content blob for a zone entry.
     */
    private function toContent(string $type, string $value, int $prio)
    {
        if ($type === 'SRV') {
            $parts = preg_split('/\s+/', trim($value));

            return [
                'service' => null,
                'proto' => null,
                'priority' => $prio,
                'weight' => isset($parts[0]) ? (int) $parts[0] : 0,
                'port' => isset($parts[1]) ? (int) $parts[1] : 0,
                'target' => $parts[2] ?? '',
                'content' => 'SRV ' . $prio . ' ' . $value,
            ];
        }

        if ($type === 'MX') {
            return [
                'priority' => $prio,
                'target' => $value,
                'content' => $prio . ' ' . $value,
            ];
        }

        return $value;
    }

    /**
     * Extract the SRV "prio" plus "weight port target" rdata.
     *
     * @return array{0: int, 1: string}
     */
    private function extractSrv($content): array
    {
        if (is_array($content)) {
            // Structured form: "SRV {prio} {weight} {port} {target}"
            if (!empty($content['content']) && is_string($content['content'])) {
                $parts = preg_split('/\s+/', trim($content['content']));
                if (count($parts) >= 5) {
                    return [
                        (int) $parts[1],
                        trim(implode(' ', array_slice($parts, 2, 3))),
                    ];
                }
            }

            if (isset($content['priority'], $content['weight'], $content['port'], $content['target'])) {
                return [
                    (int) $content['priority'],
                    trim((string) $content['weight'] . ' ' . $content['port'] . ' ' . $content['target']),
                ];
            }
        }

        // Fallback: a plain "prio weight port target" string.
        $parts = preg_split('/\s+/', trim((string) $content));
        if (count($parts) >= 4 && is_numeric($parts[0])) {
            return [
                (int) $parts[0],
                trim(implode(' ', array_slice($parts, 1, 3))),
            ];
        }

        return [0, trim((string) $content)];
    }

    /**
     * Extract the MX "prio" plus the mail host.
     *
     * @return array{0: int, 1: string}
     */
    private function extractMx($content): array
    {
        if (is_array($content)) {
            if (!empty($content['content']) && is_string($content['content'])) {
                $parts = preg_split('/\s+/', trim($content['content']));
                if (count($parts) >= 2 && is_numeric($parts[0])) {
                    return [(int) $parts[0], $parts[1]];
                }
            }

            if (isset($content['priority']) && isset($content['target'])) {
                return [(int) $content['priority'], trim((string) $content['target'])];
            }
        }

        $parts = preg_split('/\s+/', trim((string) $content));
        if (count($parts) >= 2 && is_numeric($parts[0])) {
            return [(int) $parts[0], $parts[1]];
        }

        return [0, trim((string) $content)];
    }

    /**
     * Reduce arbitrary content to a plain record value string.
     */
    private function valueOf($content): string
    {
        if (is_array($content)) {
            $value = $content['value'] ?? $content['content'] ?? $content['target'] ?? null;

            return trim((string) ($value ?? json_encode($content)));
        }

        return trim((string) $content);
    }

    /**
     * Normalize a record name to Marque's zone-relative form, using "@" for the
     * apex (e.g. "example.com" and "" both become "@").
     */
    private function normalizeName(string $domain, string $name): string
    {
        $domain = rtrim(strtolower(trim($domain)), '.');
        $name = rtrim(strtolower(trim($name)), '.');

        if ($name === '' || $name === '@' || ($domain !== '' && $name === $domain)) {
            return '@';
        }

        if ($domain !== '' && str_ends_with($name, '.' . $domain)) {
            $relative = substr($name, 0, -strlen('.' . $domain));

            return $relative === '' ? '@' : $relative;
        }

        return $name;
    }

    /**
     * The record key shared by the at.marque.domain and at.marque.dns records:
     * the fully qualified domain name.
     */
    private function zoneKey(string $domain): string
    {
        return rtrim(strtolower(trim($domain)), '.');
    }

    /**
     * Build the synthetic record ID used to track an entry across calls.
     */
    private function makeRecordId(string $name, string $type): string
    {
        return $name . '/' . strtoupper($type);
    }

    /**
     * Split a synthetic "{name}/{type}" record ID back into its parts.
     *
     * @return array{0: string, 1: string}
     */
    private function parseRecordId(string $recordId): array
    {
        $parts = explode('/', $recordId, 2);

        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            throw DnsProviderException::invalidConfiguration('marque', 'recordId');
        }

        return [$parts[0], strtoupper($parts[1])];
    }
}
