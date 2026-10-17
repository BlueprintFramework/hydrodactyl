<?php

namespace Pterodactyl\Services\Atproto;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Exceptions\Atproto\AtprotoOAuthException;

/**
 * Authenticates against an AT Protocol PDS with an account handle/DID and an
 * app password, then reads and writes repository records.
 *
 * This is the "legacy" password session flow (com.atproto.server.createSession)
 * and is offered as an alternative to the OAuth flow for operators who prefer
 * to paste credentials directly. It talks to the owner's PDS with a Bearer
 * access token rather than DPoP.
 */
class AtprotoPasswordService
{
    private const RESOLVE_HANDLE_URL = 'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle';

    /**
     * Resolved PDS endpoints, keyed by the configured identifier, so identity
     * discovery is only done once per process.
     *
     * @var array<string, string>
     */
    private static array $pdsCache = [];

    private ?Client $client = null;
    private ?Client $publicClient = null;

    private ?string $did = null;
    private ?string $accessJwt = null;
    private ?string $refreshJwt = null;

    public function __construct(private readonly array $config)
    {
    }

    /**
     * Confirm the credentials work by loading the authenticated session.
     */
    public function describe(): array
    {
        $result = $this->request('GET', 'com.atproto.server.getSession');
        $this->assertOk($result, __('exceptions.atproto.action_get_session'));

        return $result['data'];
    }

    /**
     * Read a repository record, returning null when it does not exist.
     */
    public function getRecord(string $collection, string $rkey): ?array
    {
        $result = $this->request('GET', 'com.atproto.repo.getRecord', [
            'query' => [
                'repo' => $this->did(),
                'collection' => $collection,
                'rkey' => $rkey,
            ],
        ]);

        if ($result['status'] === 400 && ($result['data']['error'] ?? null) === 'RecordNotFound') {
            return null;
        }

        $this->assertOk($result, __('exceptions.atproto.action_fetch_record', ['target' => "{$collection}/{$rkey}"]));

        return $result['data'];
    }

    /**
     * Write a repository record.
     */
    public function putRecord(string $collection, string $rkey, array $record, ?string $swapRecord = null): array
    {
        $body = [
            'repo' => $this->did(),
            'collection' => $collection,
            'rkey' => $rkey,
            'record' => $record,
        ];

        if (!empty($swapRecord)) {
            $body['swapRecord'] = $swapRecord;
        }

        $result = $this->request('POST', 'com.atproto.repo.putRecord', ['json' => $body]);
        $this->assertOk($result, __('exceptions.atproto.action_write_record', ['target' => "{$collection}/{$rkey}"]));

        return $result['data'];
    }

    /**
     * Validate the credentials needed for password authentication.
     */
    public function validateConfiguration(): void
    {
        if (empty($this->config['identifier'])) {
            throw AtprotoOAuthException::misconfigured(__('exceptions.atproto.reason_missing_handle'));
        }

        if (empty($this->config['app_password'])) {
            throw AtprotoOAuthException::misconfigured(__('exceptions.atproto.reason_missing_app_password'));
        }
    }

    /**
     * Create (or reuse) an authenticated session on the PDS.
     *
     * @throws AtprotoOAuthException
     */
    private function session(): string
    {
        if ($this->accessJwt !== null && $this->did !== null) {
            return $this->accessJwt;
        }

        $this->validateConfiguration();

        $result = $this->send('POST', 'xrpc/com.atproto.server.createSession', [
            'json' => [
                'identifier' => (string) $this->config['identifier'],
                'password' => (string) $this->config['app_password'],
            ],
        ]);

        if ($result['status'] === 401 || ($result['data']['error'] ?? null) === 'Unauthorized') {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_password_rejected'));
        }

        if ($result['status'] < 200 || $result['status'] >= 300 || empty($result['data']['accessJwt']) || empty($result['data']['did'])) {
            throw AtprotoOAuthException::authorizationFailed($this->errorDetail($result, __('exceptions.atproto.reason_session_create_failed')));
        }

        $this->accessJwt = (string) $result['data']['accessJwt'];
        $this->refreshJwt = (string) ($result['data']['refreshJwt'] ?? '');
        $this->did = (string) $result['data']['did'];

        return $this->accessJwt;
    }

    /**
     * Rotate the session using the refresh token.
     */
    private function refreshSession(): void
    {
        if (empty($this->refreshJwt)) {
            $this->accessJwt = null;
            $this->session();

            return;
        }

        $result = $this->send('POST', 'xrpc/com.atproto.server.refreshSession', [
            'headers' => ['Authorization' => 'Bearer ' . $this->refreshJwt],
        ]);

        if ($result['status'] < 200 || $result['status'] >= 300 || empty($result['data']['accessJwt'])) {
            $this->accessJwt = null;
            $this->session();

            return;
        }

        $this->accessJwt = (string) $result['data']['accessJwt'];
        $this->refreshJwt = (string) ($result['data']['refreshJwt'] ?? $this->refreshJwt);
    }

    private function did(): string
    {
        $this->session();

        return (string) $this->did;
    }

    /**
     * Perform an authenticated XRPC request, renewing the session once if the
     * access token has expired.
     *
     * @throws AtprotoOAuthException
     */
    private function request(string $method, string $nsid, array $options = [], bool $retry = true): array
    {
        $this->session();

        $options['headers'] = array_merge($options['headers'] ?? [], [
            'Authorization' => 'Bearer ' . $this->accessJwt,
        ]);

        $result = $this->send($method, 'xrpc/' . $nsid, $options);

        if ($retry && $this->isExpiredToken($result)) {
            $this->refreshSession();

            return $this->request($method, $nsid, $options, false);
        }

        return $result;
    }

    /**
     * @throws AtprotoOAuthException on transport level failures
     */
    private function send(string $method, string $url, array $options = []): array
    {
        $options['http_errors'] = false;

        try {
            $response = $this->client()->request($method, $url, $options);
        } catch (GuzzleException $e) {
            throw AtprotoOAuthException::requestFailed(trim($e->getMessage()));
        }

        $body = (string) $response->getBody();
        $data = $body === '' ? [] : json_decode($body, true);

        return [
            'status' => $response->getStatusCode(),
            'data' => is_array($data) ? $data : [],
        ];
    }

    private function isExpiredToken(array $result): bool
    {
        if ($result['status'] < 400) {
            return false;
        }

        return in_array((string) ($result['data']['error'] ?? ''), ['ExpiredToken', 'InvalidToken'], true);
    }

    private function assertOk(array $result, string $what): void
    {
        if ($result['status'] < 200 || $result['status'] >= 300) {
            throw AtprotoOAuthException::requestFailed(__('exceptions.atproto.reason_action_failed', [
                'action' => $what,
                'detail' => $this->errorDetail($result, __('exceptions.atproto.reason_pds_rejected')),
            ]));
        }
    }

    private function errorDetail(array $result, string $fallback): string
    {
        $data = $result['data'] ?? [];

        return (string) ($data['message'] ?? $data['error'] ?? $fallback);
    }

    private function client(): Client
    {
        return $this->client ??= $this->makeClient([
            'base_uri' => rtrim($this->pdsUrl(), '/') . '/',
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'timeout' => 30,
            'connect_timeout' => 10,
            'http_errors' => false,
            'allow_redirects' => ['max' => 3],
        ]);
    }

    /**
     * Build the HTTP client. Extracted so tests can inject a mocked client.
     */
    protected function makeClient(array $config): Client
    {
        return new Client($config);
    }

    /**
     * Resolve the PDS base URL, discovering it from the handle or DID when not
     * provided explicitly.
     */
    private function pdsUrl(): string
    {
        if (!empty($this->config['pds_url'])) {
            return rtrim((string) $this->config['pds_url'], '/');
        }

        $identifier = trim((string) ($this->config['identifier'] ?? ''));

        if (isset(self::$pdsCache[$identifier])) {
            return self::$pdsCache[$identifier];
        }

        $did = str_starts_with($identifier, 'did:') ? $identifier : $this->resolveHandle($identifier);

        return self::$pdsCache[$identifier] = $this->resolvePdsEndpoint($did);
    }

    private function resolveHandle(string $handle): string
    {
        $result = $this->sendPublic(self::RESOLVE_HANDLE_URL . '?handle=' . rawurlencode($handle));

        if ($result['status'] !== 200 || empty($result['data']['did'])) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_handle_unresolved', ['handle' => $handle]));
        }

        return (string) $result['data']['did'];
    }

    private function resolvePdsEndpoint(string $did): string
    {
        $result = $this->sendPublic($this->didDocumentUrl($did));

        foreach ($result['data']['service'] ?? [] as $service) {
            $id = (string) ($service['id'] ?? '');
            if (($service['type'] ?? null) === 'AtprotoPersonalDataServer' || str_ends_with($id, '#atproto_pds')) {
                if (!empty($service['serviceEndpoint'])) {
                    return rtrim((string) $service['serviceEndpoint'], '/');
                }
            }
        }

        throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_no_pds'));
    }

    private function didDocumentUrl(string $did): string
    {
        if (str_starts_with($did, 'did:plc:')) {
            return 'https://plc.directory/' . rawurlencode($did);
        }

        if (str_starts_with($did, 'did:web:')) {
            $parts = explode(':', substr($did, strlen('did:web:')));
            $host = str_replace('%3A', ':', array_shift($parts));
            $path = empty($parts) ? '/.well-known/did.json' : '/' . implode('/', $parts) . '/did.json';

            return 'https://' . $host . $path;
        }

        throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_unsupported_did', ['did' => $did]));
    }

    /**
     * Unauthenticated request used only during identity discovery.
     */
    private function sendPublic(string $url): array
    {
        try {
            $response = $this->publicClient()->request('GET', $url, ['http_errors' => false]);
        } catch (GuzzleException $e) {
            throw AtprotoOAuthException::requestFailed(trim($e->getMessage()));
        }

        $body = (string) $response->getBody();
        $data = $body === '' ? [] : json_decode($body, true);

        return [
            'status' => $response->getStatusCode(),
            'data' => is_array($data) ? $data : [],
        ];
    }

    private function publicClient(): Client
    {
        return $this->publicClient ??= $this->makeClient([
            'headers' => ['Accept' => 'application/json'],
            'timeout' => 15,
            'connect_timeout' => 10,
            'http_errors' => false,
            'allow_redirects' => ['max' => 3],
        ]);
    }
}
