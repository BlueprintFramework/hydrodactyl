<?php

namespace Pterodactyl\Services\Mcjars;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin cached client for https://versions.mcjars.app (MCJars).
 */
class McjarsClient
{
    public function baseUrl(): string
    {
        return rtrim((string) config('hydrodactyl.mcjars.base_url', 'https://versions.mcjars.app'), '/');
    }

    public function userAgent(): string
    {
        $version = config('app.version', 'unknown');

        return "hydrodactyl/{$version} (https://hydrodactyl.dev)";
    }

    /**
     * @return array<string, mixed>
     */
    public function types(): array
    {
        return $this->getCached('/api/v2/types', 3600);
    }

    /**
     * @return array<string, mixed>
     */
    public function builds(string $type, ?string $version = null): array
    {
        $type = strtoupper($type);
        $path = $version === null || $version === '' || $version === 'latest'
            ? "/api/v2/builds/{$type}/latest"
            : '/api/v2/builds/' . rawurlencode($type) . '/' . rawurlencode($version);

        return $this->getCached($path, 300);
    }

    /**
     * List Minecraft version ids available for a type (from /api/v2/builds/{TYPE}).
     *
     * @return array<string, mixed>
     */
    public function typeBuildsIndex(string $type): array
    {
        $type = strtoupper($type);

        return $this->getCached('/api/v2/builds/' . rawurlencode($type), 600);
    }

    /**
     * @return array<string, mixed>
     */
    private function getCached(string $path, int $ttl): array
    {
        $url = $this->baseUrl() . $path;
        $cacheKey = 'mcjars:' . md5($url);

        return Cache::remember($cacheKey, $ttl, function () use ($url): array {
            try {
                $response = Http::withHeaders([
                    'User-Agent' => $this->userAgent(),
                    'Accept' => 'application/json',
                ])
                    ->timeout((int) config('hydrodactyl.mcjars.timeout', 20))
                    ->get($url);
            } catch (ConnectionException $e) {
                throw new RuntimeException('MCJars unreachable: ' . $e->getMessage(), 0, $e);
            }

            if ($response->failed()) {
                throw new RuntimeException('MCJars HTTP ' . $response->status());
            }

            return $response->json() ?? [];
        });
    }
}
