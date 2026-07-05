<?php

namespace Pterodactyl\Services\Marketplace;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Shared HTTP + caching plumbing for marketplace adapters. Concrete sources
 * only need to parse responses into the normalized DTOs.
 */
abstract class AbstractMarketplaceSource implements MarketplaceSource
{
    protected int $cacheTtl;

    public function __construct()
    {
        $this->cacheTtl = (int) config('hydrodactyl.marketplace.cache_ttl', 120);
    }

    /**
     * Build the User-Agent sent to upstream providers. Browsers cannot set the
     * User-Agent header (it is forbidden), so proxying through the panel is what
     * keeps us compliant with provider terms of service.
     */
    protected function userAgent(): string
    {
        $version = config('app.version', 'unknown');

        return "hydrodactyl/{$version} (hydrodactyl.dev)";
    }

    protected function timeout(): int
    {
        return (int) config('hydrodactyl.marketplace.timeout', 15);
    }

    /**
     * Perform a GET request with caching, returning the decoded JSON payload.
     *
     * @param array<string, mixed> $query
     *
     * @return array<string|int, mixed>
     *
     * @throws MarketplaceException
     */
    protected function get(string $url, array $query = [], array $headers = []): array
    {
        $cacheKey = $this->cacheKey($url, $query, $headers);

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($url, $query, $headers): array {
            try {
                $response = Http::withHeaders(array_merge(
                    ['User-Agent' => $this->userAgent(), 'Accept' => 'application/json'],
                    $headers,
                ))
                    ->timeout($this->timeout())
                    ->get($url, $query);
            } catch (ConnectionException $e) {
                throw MarketplaceException::upstream($this->key(), 'Could not reach the marketplace provider.', $e);
            }

            if ($response->failed()) {
                throw MarketplaceException::upstream(
                    $this->key(),
                    sprintf('Provider responded with HTTP %d.', $response->status()),
                );
            }

            return $response->json() ?? [];
        });
    }

    /**
     * Same as get() but cached for only a short window. Used when resolving a
     * download URL: fresh enough to remain valid for the imminent pull, but the
     * short TTL caps how often an authenticated user can amplify requests onto
     * the upstream provider (and get the panel IP rate-limited/banned).
     *
     * @param array<string, mixed> $query
     *
     * @return array<string|int, mixed>
     *
     * @throws MarketplaceException
     */
    protected function getShortLived(string $url, array $query = [], array $headers = []): array
    {
        $cacheKey = $this->cacheKey('resolve:' . $url, $query, $headers);

        return Cache::remember($cacheKey, 30, function () use ($url, $query, $headers): array {
            try {
                $response = Http::withHeaders(array_merge(
                    ['User-Agent' => $this->userAgent(), 'Accept' => 'application/json'],
                    $headers,
                ))
                    ->timeout($this->timeout())
                    ->get($url, $query);
            } catch (ConnectionException $e) {
                throw MarketplaceException::upstream($this->key(), 'Could not reach the marketplace provider.', $e);
            }

            if ($response->failed()) {
                throw MarketplaceException::upstream(
                    $this->key(),
                    sprintf('Provider responded with HTTP %d.', $response->status()),
                );
            }

            return $response->json() ?? [];
        });
    }

    /**
     * Validate a resolved download URL before it is handed back to the client
     * (and ultimately pulled by the daemon). Upstream marketplace APIs return
     * URLs controlled by project authors, so the panel cannot trust them
     * blindly — this is the SSRF defense-in-depth boundary.
     *
     *  - scheme must be https
     *  - host must be on the per-source allowlist
     *  - if the host resolves, none of its IPs may be private/loopback/link-local
     *
     * @param string[] $allowedHosts
     *
     * @throws MarketplaceException
     */
    protected function assertSafeDownloadUrl(string $url, array $allowedHosts, bool $enforceHostAllowlist = true): void
    {
        $parts = parse_url($url);
        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            throw MarketplaceException::upstream($this->key(), 'The download URL is invalid.');
        }

        if (strtolower((string) $parts['scheme']) !== 'https') {
            throw MarketplaceException::upstream($this->key(), 'The download URL must use https.');
        }

        $host = strtolower((string) $parts['host']);

        if ($enforceHostAllowlist) {
            $allowed = array_map('strtolower', $allowedHosts);
            if (!in_array($host, $allowed, true)) {
                throw MarketplaceException::upstream($this->key(), 'The download URL host is not allowed.');
            }
        }

        // Always defend against hosts that resolve to internal/link-local
        // addresses, even when the host allowlist is relaxed (e.g. for a
        // redirect-resolved URL whose target we cannot predict). Resolve both A
        // (IPv4) and AAAA (IPv6) records — gethostbynamel only returns IPv4, so
        // an AAAA-only host would otherwise skip this check. Either call may
        // return false on a transient DNS failure; in that case we do not block.
        $ips = @gethostbynamel($host);
        $ips = is_array($ips) ? $ips : [];
        $aaaas = @dns_get_record($host, DNS_AAAA);
        if (is_array($aaaas)) {
            foreach ($aaaas as $rec) {
                if (isset($rec['ipv6']) && is_string($rec['ipv6']) && $rec['ipv6'] !== '') {
                    $ips[] = $rec['ipv6'];
                }
            }
        }
        foreach ($ips as $ip) {
            $validated = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
            if ($validated === false) {
                throw MarketplaceException::upstream($this->key(), 'The download host resolves to a blocked address.');
            }
        }
    }

    /**
     * Resolve a redirecting download endpoint to its final URL without
     * downloading the file body (uses HEAD; falls back to a non-following GET
     * for servers that reject HEAD). Used by sources whose download links
     * redirect (Hangar, Spiget), because the daemon does not follow redirects.
     *
     * @throws MarketplaceException
     */
    protected function followRedirect(string $url, int $maxHops = 5): string
    {
        $headers = ['User-Agent' => $this->userAgent(), 'Accept' => '*/*'];
        $current = $url;

        for ($i = 0; $i < $maxHops; $i++) {
            try {
                $response = Http::withHeaders($headers)
                    ->timeout($this->timeout())
                    ->withOptions(['allow_redirects' => false])
                    ->head($current);

                // Some hosts reject HEAD — fall back to a non-following GET, which
                // for a redirect response still returns only the redirect (no body).
                if (in_array($response->status(), [403, 405, 501], true)) {
                    $response = Http::withHeaders($headers)
                        ->timeout($this->timeout())
                        ->withOptions(['allow_redirects' => false])
                        ->get($current);
                }
            } catch (ConnectionException $e) {
                throw MarketplaceException::upstream($this->key(), 'Could not resolve the download redirect.', $e);
            }

            $status = $response->status();
            if ($status >= 300 && $status < 400) {
                $location = $response->header('Location');
                if ($location === '' || $location === null) {
                    break;
                }
                // Resolve relative redirects against the current URL's origin.
                if (!preg_match('#^https?://#i', $location)) {
                    $parts = parse_url($current);
                    $origin = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
                    $location = $origin . '/' . ltrim($location, '/');
                }
                $current = $location;
                continue;
            }

            break; // final, non-redirect response
        }

        return $current;
    }

    /**
     * Resolve a redirecting download endpoint to the final jar URL and validate
     * it. Used by sources whose download links redirect (Hangar, Spiget): the
     * daemon does not follow redirects, so we resolve them here and hand back a
     * direct URL. Resources that redirect to a non-jar (e.g. an external HTML
     * release page) cannot be auto-installed and are rejected with a clear error.
     *
     * @return array{url: string, filename: string}
     *
     * @throws MarketplaceException
     */
    protected function resolveRedirectingJar(string $endpoint, string $fallbackFilename): array
    {
        $final = $this->followRedirect($endpoint);

        $path = (string) (parse_url($final, PHP_URL_PATH) ?? '');
        $basename = basename(urldecode($path));
        if ($basename === '' || !str_ends_with(strtolower($basename), '.jar')) {
            throw MarketplaceException::upstream(
                $this->key(),
                'This resource is externally hosted and cannot be auto-installed. Please download it manually from the provider.',
            );
        }

        // The redirect target host is not predictable, so we relax the host
        // allowlist but still require https + a public (non-private) IP.
        $this->assertSafeDownloadUrl($final, [], false);

        return ['url' => $final, 'filename' => $basename, 'size' => null];
    }

    /**
     * Build a deterministic cache key for the request.
     *
     * @param array<string, mixed> $query
     * @param array<string, string> $headers
     */
    protected function cacheKey(string $url, array $query, array $headers): string
    {
        // Headers are intentionally excluded from cache identity for the sources
        // we control (API keys are constant per install), keeping keys short.
        return 'marketplace:' . $this->key() . ':' . hash('sha256', $url . '?' . json_encode($query) . serialize($headers));
    }

    /**
     * Format a number for compact display (e.g. 1234 -> "1.2K"). Kept here so
     * both PHP-side logs and any future transformer share one implementation.
     */
    public static function compactNumber(int $n): string
    {
        if ($n >= 1_000_000) {
            return round($n / 1_000_000, 1) . 'M';
        }
        if ($n >= 1_000) {
            return round($n / 1_000, 1) . 'K';
        }

        return (string) $n;
    }

    /**
     * Normalize a loader identifier against the canonical marketplace names.
     */
    protected function normalizeLoader(?string $loader): ?string
    {
        if ($loader === null) {
            return null;
        }

        $normalized = Str::lower(trim($loader));

        return match ($normalized) {
            'neo-forge', 'neo_forge', 'neo forge' => 'neoforge',
            default => $normalized,
        };
    }
}
