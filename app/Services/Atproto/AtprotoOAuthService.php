<?php

namespace Pterodactyl\Services\Atproto;

use GuzzleHttp\Client;
use Pterodactyl\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Models\AtprotoOauthSession;
use Pterodactyl\Exceptions\Atproto\AtprotoOAuthException;

/**
 * A confidential AT Protocol OAuth client (RFC-profile as defined by atproto).
 *
 * Implements the pieces the panel needs to obtain and use a DPoP bound access
 * token scoped to `repo:at.marque.dns`:
 *
 *   - public client metadata (including the panel's ES256 client auth JWKS)
 *   - identity resolution (handle/DID -> PDS -> authorization server)
 *   - pushed authorization requests (PAR) with PKCE and client assertions
 *   - authorization code token exchange
 *   - refresh token rotation
 *   - DPoP signed repository calls with mandatory server nonces
 */
class AtprotoOAuthService
{
    private const RESOLVE_HANDLE_URL = 'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle';
    private const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

    private const MAX_ATTEMPTS = 3;

    private ?Client $client = null;

    // ---------------------------------------------------------------------
    // Client metadata
    // ---------------------------------------------------------------------

    public function clientId(): string
    {
        return $this->baseUrl() . '/' . ltrim((string) config('atproto.metadata_path'), '/');
    }

    public function redirectUri(): string
    {
        return $this->baseUrl() . '/' . ltrim((string) config('atproto.redirect_path'), '/');
    }

    /**
     * The panel's confidential client authentication key, generated on first use
     * and persisted (encrypted) in the settings table.
     */
    public function clientKeyPair(): KeyPair
    {
        $key = (string) config('atproto.client_key_setting');
        $setting = Setting::query()->where('key', $key)->first();

        if ($setting && !empty($setting->value)) {
            try {
                $stored = json_decode(Crypt::decryptString($setting->value), true);
                if (!empty($stored['private_key'])) {
                    return KeyPair::fromPrivatePem($stored['private_key']);
                }
            } catch (\Throwable) {
                // Corrupt or undecryptable; fall through and regenerate.
            }
        }

        $keyPair = KeyPair::generate();

        Setting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => Crypt::encryptString(json_encode(['private_key' => $keyPair->privatePem()]))],
        );

        return $keyPair;
    }

    /**
     * The public client metadata document served at the client_id URL.
     */
    public function clientMetadata(): array
    {
        $keyPair = $this->clientKeyPair();

        return [
            'client_id' => $this->clientId(),
            'client_name' => (string) config('atproto.client_name'),
            'client_uri' => $this->baseUrl(),
            'application_type' => 'web',
            'grant_types' => ['authorization_code', 'refresh_token'],
            'scope' => (string) config('atproto.scope'),
            'response_types' => ['code'],
            'redirect_uris' => [$this->redirectUri()],
            'token_endpoint_auth_method' => 'private_key_jwt',
            'token_endpoint_auth_signing_alg' => 'ES256',
            'dpop_bound_access_tokens' => true,
            'jwks' => ['keys' => [$keyPair->publicJwkWithMetadata()]],
        ];
    }

    // ---------------------------------------------------------------------
    // Authorization flow
    // ---------------------------------------------------------------------

    /**
     * Resolve the account, register the request with the authorization server
     * via PAR, and return the URL the browser should be sent to.
     */
    public function begin(string $identifier, string $returnUrl): string
    {
        $this->assertUsableClientId();

        $identity = $this->resolveIdentity(trim($identifier));
        $serverMetadata = $this->authorizationServerMetadata(
            $this->discoverAuthorizationServer($identity['pds'])
        );

        $keyPair = KeyPair::generate();
        $pkce = KeyPair::pkce();
        $state = KeyPair::nonce();

        $requestUri = $this->pushAuthorizationRequest(
            $serverMetadata,
            $keyPair,
            $pkce['challenge'],
            $state,
            $identity['handle'] ?: $identity['did'],
        );

        AtprotoOauthSession::create([
            'status' => AtprotoOauthSession::STATUS_PENDING,
            'account_did' => $identity['did'],
            'handle' => $identity['handle'],
            'pds_url' => $identity['pds'],
            'authorization_server' => $serverMetadata['issuer'],
            'scope' => (string) config('atproto.scope'),
            'dpop_private_key' => $keyPair->privatePem(),
            'state' => $state,
            'code_verifier' => $pkce['verifier'],
            'return_url' => $returnUrl,
        ]);

        $separator = str_contains($serverMetadata['authorization_endpoint'], '?') ? '&' : '?';

        return $serverMetadata['authorization_endpoint'] . $separator . http_build_query([
            'client_id' => $this->clientId(),
            'request_uri' => $requestUri,
        ]);
    }

    /**
     * Complete the authorization flow from the callback parameters.
     *
     * @throws AtprotoOAuthException
     */
    public function complete(?string $state, ?string $code, ?string $issuer, ?string $error): AtprotoOauthSession
    {
        if (empty($state)) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_state_missing'));
        }

        $session = AtprotoOauthSession::query()
            ->where('state', $state)
            ->where('status', AtprotoOauthSession::STATUS_PENDING)
            ->first();

        if (!$session) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_request_not_matched'));
        }

        if ($error !== null && $error !== '') {
            $session->delete();

            throw AtprotoOAuthException::authorizationFailed($error);
        }

        if (empty($code)) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_code_missing'));
        }

        if ($issuer !== null && $issuer !== '' && $issuer !== $session->authorization_server) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_issuer_mismatch'));
        }

        $serverMetadata = $this->authorizationServerMetadata($session->authorization_server);
        $keyPair = KeyPair::fromPrivatePem($session->dpop_private_key);
        $clientKeyPair = $this->clientKeyPair();

        $form = [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri(),
            'client_id' => $this->clientId(),
            'code_verifier' => $session->code_verifier,
            'client_assertion_type' => self::CLIENT_ASSERTION_TYPE,
            'client_assertion' => $clientKeyPair->clientAssertion($this->clientId(), $serverMetadata['issuer']),
        ];

        $nonce = $session->dpop_nonce_as;
        $result = $this->signedRequest($keyPair, 'POST', $serverMetadata['token_endpoint'], ['form_params' => $form], null, $nonce);

        if (!empty($result['nonce'])) {
            $session->dpop_nonce_as = $result['nonce'];
        }

        $this->assertTokenResponse($result, __('exceptions.atproto.context_token_exchange'));

        $data = $result['data'];

        if (empty($data['sub']) || $data['sub'] !== $session->account_did) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_account_mismatch'));
        }

        if (empty($data['refresh_token'])) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_no_refresh_token'));
        }

        $session->fill([
            'status' => AtprotoOauthSession::STATUS_AUTHORIZED,
            'scope' => $data['scope'] ?? $session->scope,
            'access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'],
            'access_token_expires_at' => now()->addSeconds((int) ($data['expires_in'] ?? 300)),
            'authorized_at' => now(),
            'state' => null,
            'code_verifier' => null,
        ])->save();

        return $session;
    }

    // ---------------------------------------------------------------------
    // Authorized repository calls
    // ---------------------------------------------------------------------

    /**
     * Probe the PDS with the session's access token.
     */
    public function describeSession(AtprotoOauthSession $session): array
    {
        $result = $this->pdsRequest($session, 'GET', 'com.atproto.server.getSession');
        $this->assertOk($result, __('exceptions.atproto.action_get_session'));

        return $result['data'];
    }

    /**
     * Read a repository record, returning null when it does not exist.
     */
    public function repoGetRecord(AtprotoOauthSession $session, string $collection, string $rkey): ?array
    {
        $result = $this->pdsRequest($session, 'GET', 'com.atproto.repo.getRecord', [
            'query' => [
                'repo' => $session->account_did,
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
    public function repoPutRecord(AtprotoOauthSession $session, string $collection, string $rkey, array $record, ?string $swapRecord = null): array
    {
        $body = [
            'repo' => $session->account_did,
            'collection' => $collection,
            'rkey' => $rkey,
            'record' => $record,
        ];

        if (!empty($swapRecord)) {
            $body['swapRecord'] = $swapRecord;
        }

        $result = $this->pdsRequest($session, 'POST', 'com.atproto.repo.putRecord', ['json' => $body]);
        $this->assertOk($result, __('exceptions.atproto.action_write_record', ['target' => "{$collection}/{$rkey}"]));

        return $result['data'];
    }

    // ---------------------------------------------------------------------
    // Internals: identity + discovery
    // ---------------------------------------------------------------------

    /**
     * Resolve a handle or DID to its DID, PDS, and (when known) handle.
     *
     * @return array{did: string, handle: ?string, pds: string}
     */
    private function resolveIdentity(string $identifier): array
    {
        if (str_starts_with($identifier, 'did:')) {
            $did = $identifier;
            $handle = null;
        } else {
            $handle = ltrim(strtolower($identifier), '@');
            $did = $this->resolveHandle($handle);
        }

        $document = $this->fetchDidDocument($did);

        if ($handle !== null && !$this->didClaimsHandle($document, $handle)) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_handle_not_claimed', ['did' => $did, 'handle' => $handle]));
        }

        return [
            'did' => $did,
            'handle' => $handle ?? $this->handleFromDocument($document),
            'pds' => $this->pdsFromDocument($document),
        ];
    }

    private function resolveHandle(string $handle): string
    {
        $result = $this->send('GET', self::RESOLVE_HANDLE_URL, ['query' => ['handle' => $handle]]);

        if ($result['status'] !== 200 || empty($result['data']['did'])) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_handle_unresolved', ['handle' => $handle]));
        }

        return (string) $result['data']['did'];
    }

    private function fetchDidDocument(string $did): array
    {
        $result = $this->send('GET', $this->didDocumentUrl($did));

        if ($result['status'] !== 200 || empty($result['data'])) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_did_document_unavailable', ['did' => $did]));
        }

        return $result['data'];
    }

    private function didClaimsHandle(array $document, string $handle): bool
    {
        $expected = 'at://' . strtolower($handle);

        foreach ($document['alsoKnownAs'] ?? [] as $alias) {
            if (strtolower((string) $alias) === $expected) {
                return true;
            }
        }

        return false;
    }

    private function handleFromDocument(array $document): ?string
    {
        foreach ($document['alsoKnownAs'] ?? [] as $alias) {
            if (str_starts_with((string) $alias, 'at://')) {
                return strtolower(substr((string) $alias, strlen('at://')));
            }
        }

        return null;
    }

    private function pdsFromDocument(array $document): string
    {
        foreach ($document['service'] ?? [] as $service) {
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

    private function discoverAuthorizationServer(string $pdsUrl): string
    {
        $result = $this->send('GET', rtrim($pdsUrl, '/') . '/.well-known/oauth-protected-resource');

        $servers = $result['data']['authorization_servers'] ?? null;
        if ($result['status'] === 200 && is_array($servers) && !empty($servers[0])) {
            return rtrim((string) $servers[0], '/');
        }

        // Fall back to the PDS acting as its own authorization server.
        return rtrim($pdsUrl, '/');
    }

    private function authorizationServerMetadata(string $issuer): array
    {
        $result = $this->send('GET', rtrim($issuer, '/') . '/.well-known/oauth-authorization-server');

        if ($result['status'] !== 200 || empty($result['data'])) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_metadata_unavailable', ['issuer' => $issuer]));
        }

        $data = $result['data'];

        foreach (['issuer', 'authorization_endpoint', 'token_endpoint', 'pushed_authorization_request_endpoint'] as $field) {
            if (empty($data[$field])) {
                throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_metadata_field_missing', ['field' => $field]));
            }
        }

        if (($data['issuer'] ?? null) !== rtrim($issuer, '/')) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_issuer_origin_mismatch'));
        }

        if (empty($data['require_pushed_authorization_requests'])) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_par_unsupported'));
        }

        if (empty($data['code_challenge_methods_supported']) || !in_array('S256', $data['code_challenge_methods_supported'], true)) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_pkce_unsupported'));
        }

        if (empty($data['dpop_signing_alg_values_supported']) || !in_array('ES256', $data['dpop_signing_alg_values_supported'], true)) {
            throw AtprotoOAuthException::discoveryFailed(__('exceptions.atproto.reason_dpop_unsupported'));
        }

        return $data;
    }

    // ---------------------------------------------------------------------
    // Internals: PAR + tokens
    // ---------------------------------------------------------------------

    private function pushAuthorizationRequest(array $serverMetadata, KeyPair $keyPair, string $challenge, string $state, string $loginHint): string
    {
        $form = [
            'client_id' => $this->clientId(),
            'response_type' => 'code',
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
            'state' => $state,
            'redirect_uri' => $this->redirectUri(),
            'scope' => (string) config('atproto.scope'),
            'login_hint' => $loginHint,
            'client_assertion_type' => self::CLIENT_ASSERTION_TYPE,
            'client_assertion' => $this->clientKeyPair()->clientAssertion($this->clientId(), $serverMetadata['issuer']),
        ];

        $result = $this->signedRequest(
            $keyPair,
            'POST',
            $serverMetadata['pushed_authorization_request_endpoint'],
            ['form_params' => $form],
            null,
            null,
        );

        if ($result['status'] < 200 || $result['status'] >= 300 || empty($result['data']['request_uri'])) {
            throw AtprotoOAuthException::authorizationFailed($this->errorDetail($result, __('exceptions.atproto.reason_par_rejected')));
        }

        return (string) $result['data']['request_uri'];
    }

    /**
     * Refresh the session's access token. Tokens are rotated on every refresh.
     */
    public function refresh(AtprotoOauthSession $session): void
    {
        if (empty($session->refresh_token)) {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_no_refresh_token_session'));
        }

        $serverMetadata = $this->authorizationServerMetadata($session->authorization_server);
        $keyPair = KeyPair::fromPrivatePem($session->dpop_private_key);

        $form = [
            'grant_type' => 'refresh_token',
            'refresh_token' => $session->refresh_token,
            'client_id' => $this->clientId(),
            'client_assertion_type' => self::CLIENT_ASSERTION_TYPE,
            'client_assertion' => $this->clientKeyPair()->clientAssertion($this->clientId(), $serverMetadata['issuer']),
        ];

        $result = $this->signedRequest($keyPair, 'POST', $serverMetadata['token_endpoint'], ['form_params' => $form], null, $session->dpop_nonce_as);

        if (!empty($result['nonce'])) {
            $session->dpop_nonce_as = $result['nonce'];
        }

        $this->assertTokenResponse($result, __('exceptions.atproto.context_token_refresh'));

        $session->fill([
            'access_token' => $result['data']['access_token'],
            'access_token_expires_at' => now()->addSeconds((int) ($result['data']['expires_in'] ?? 300)),
            'refresh_token' => $result['data']['refresh_token'] ?? $session->refresh_token,
        ])->save();
    }

    // ---------------------------------------------------------------------
    // Internals: DPoP requests
    // ---------------------------------------------------------------------

    private function pdsRequest(AtprotoOauthSession $session, string $method, string $nsid, array $options = []): array
    {
        if ($session->accessTokenExpired()) {
            $this->refresh($session);
        }

        $url = rtrim((string) $session->pds_url, '/') . '/xrpc/' . $nsid;
        $keyPair = KeyPair::fromPrivatePem($session->dpop_private_key);

        $result = $this->signedRequest($keyPair, $method, $url, $options, $session->access_token, $session->dpop_nonce_pds);

        if (!empty($result['nonce'])) {
            $session->dpop_nonce_pds = $result['nonce'];
            $session->save();
        }

        // The access token may have expired between our check and the request.
        if ($this->isExpiredToken($result)) {
            $this->refresh($session);

            $result = $this->signedRequest($keyPair, $method, $url, $options, $session->access_token, $session->dpop_nonce_pds);

            if (!empty($result['nonce'])) {
                $session->dpop_nonce_pds = $result['nonce'];
                $session->save();
            }
        }

        return $result;
    }

    /**
     * Send a request with a DPoP proof, retrying once with a server supplied
     * nonce when required.
     */
    private function signedRequest(KeyPair $keyPair, string $method, string $url, array $options, ?string $accessToken, ?string $nonce, int $attempt = 1): array
    {
        $headers = $options['headers'] ?? [];
        $headers['DPoP'] = $keyPair->dpopProof($method, $this->stripQuery($url), $nonce, $accessToken);
        if (!empty($accessToken)) {
            $headers['Authorization'] = 'DPoP ' . $accessToken;
        }
        $options['headers'] = $headers;

        $result = $this->send($method, $url, $options);

        if ($attempt < self::MAX_ATTEMPTS && $this->isNonceError($result) && !empty($result['nonce'])) {
            return $this->signedRequest($keyPair, $method, $url, $options, $accessToken, $result['nonce'], $attempt + 1);
        }

        return $result;
    }

    private function isNonceError(array $result): bool
    {
        if ($result['status'] < 400) {
            return false;
        }

        if (str_contains(strtolower((string) ($result['www_authenticate'] ?? '')), 'use_dpop_nonce')) {
            return true;
        }

        return strtolower((string) ($result['data']['error'] ?? '')) === 'use_dpop_nonce';
    }

    private function isExpiredToken(array $result): bool
    {
        if ($result['status'] < 400) {
            return false;
        }

        return in_array((string) ($result['data']['error'] ?? ''), ['ExpiredToken', 'InvalidToken'], true);
    }

    /**
     * Perform an HTTP request and normalise the response.
     *
     * @throws AtprotoOAuthException on transport level failures
     */
    private function send(string $method, string $url, array $options = []): array
    {
        // Always read error responses as data rather than exceptions; the caller
        // inspects the status and body (nonce hints, RecordNotFound, ...).
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
            'nonce' => $response->getHeaderLine('DPoP-Nonce'),
            'www_authenticate' => $response->getHeaderLine('WWW-Authenticate'),
            'data' => is_array($data) ? $data : [],
        ];
    }

    private function client(): Client
    {
        return $this->client ??= $this->makeClient([
            'headers' => ['Accept' => 'application/json'],
            'timeout' => (int) config('atproto.timeout', 30),
            'connect_timeout' => (int) config('atproto.connect_timeout', 10),
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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function assertTokenResponse(array $result, string $context): void
    {
        if ($result['status'] < 200 || $result['status'] >= 300 || empty($result['data']['access_token'])) {
            throw AtprotoOAuthException::authorizationFailed($this->errorDetail($result, __('exceptions.atproto.reason_context_failed', ['context' => $context])));
        }

        if (isset($result['data']['token_type']) && strtolower((string) $result['data']['token_type']) !== 'dpop') {
            throw AtprotoOAuthException::authorizationFailed(__('exceptions.atproto.reason_not_dpop'));
        }
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

        return (string) ($data['error_description'] ?? $data['message'] ?? $data['error'] ?? $fallback);
    }

    private function stripQuery(string $url): string
    {
        $parts = parse_url($url);
        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'] ?? '';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $path = $parts['path'] ?? '/';

        return $scheme . '://' . $host . $port . $path;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('app.url'), '/');
    }

    private function assertUsableClientId(): void
    {
        $parts = parse_url($this->clientId());
        $scheme = $parts['scheme'] ?? '';
        $host = $parts['host'] ?? '';

        if ($scheme !== 'https') {
            throw AtprotoOAuthException::misconfigured(__('exceptions.atproto.reason_https_required'));
        }

        if (isset($parts['port']) && (int) $parts['port'] !== 443) {
            throw AtprotoOAuthException::misconfigured(__('exceptions.atproto.reason_no_port'));
        }

        if ($host === '') {
            throw AtprotoOAuthException::misconfigured(__('exceptions.atproto.reason_invalid_app_url'));
        }
    }
}
