<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Exceptions\Handler;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Mcjars\ListMcjarsBuildsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Mcjars\ListMcjarsVersionsRequest;
use Pterodactyl\Services\Mcjars\McjarsClient;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Proxies MCJars version/build lookups for the Software change UI.
 */
class McjarsController extends ClientApiController
{
    public function __construct(private McjarsClient $client)
    {
        parent::__construct();
    }

    public function versions(ListMcjarsVersionsRequest $request): JsonResponse
    {
        $type = strtoupper((string) $request->input('type'));

        try {
            $payload = $this->client->typeBuildsIndex($type);
        } catch (RuntimeException $e) {
            return response()->json(
                Handler::toArray(new HttpException(502, $e->getMessage())),
                502,
            );
        }

        $builds = is_array($payload['builds'] ?? null) ? $payload['builds'] : [];
        $versions = [];

        foreach ($builds as $versionId => $meta) {
            if (!is_array($meta)) {
                continue;
            }

            $latest = is_array($meta['latest'] ?? null) ? $meta['latest'] : [];
            $versions[] = [
                'id' => (string) $versionId,
                'type' => (string) ($meta['type'] ?? 'RELEASE'),
                'supported' => (bool) ($meta['supported'] ?? false),
                'java' => isset($meta['java']) ? (int) $meta['java'] : (isset($latest['java']) ? (int) $latest['java'] : null),
                'builds' => (int) ($meta['builds'] ?? 0),
                'created' => $meta['created'] ?? ($latest['created'] ?? null),
                'latest_build' => isset($latest['buildNumber']) ? (int) $latest['buildNumber'] : null,
                'latest_name' => isset($latest['name']) ? (string) $latest['name'] : null,
                'jar_size' => isset($latest['jarSize']) ? (int) $latest['jarSize'] : null,
                'experimental' => (bool) ($latest['experimental'] ?? false),
            ];
        }

        // Newest Minecraft versions first (semantic-ish: split by dots).
        usort($versions, static function (array $a, array $b): int {
            return version_compare($b['id'], $a['id']);
        });

        return response()->json([
            'type' => $type,
            'versions' => $versions,
        ]);
    }

    public function builds(ListMcjarsBuildsRequest $request): JsonResponse
    {
        $type = strtoupper((string) $request->input('type'));
        $version = (string) $request->input('version');

        try {
            $payload = $this->client->builds($type, $version);
        } catch (RuntimeException $e) {
            return response()->json(
                Handler::toArray(new HttpException(502, $e->getMessage())),
                502,
            );
        }

        $raw = $payload['builds'] ?? [];
        $builds = [];

        if (is_array($raw)) {
            // /builds/{TYPE}/{version} → list; /latest → single object under builds or nested.
            $list = array_is_list($raw) ? $raw : (isset($raw[0]) ? $raw : [$raw]);
            foreach ($list as $item) {
                if (!is_array($item)) {
                    continue;
                }
                // Index shape { "1.21": { latest: {...} } } — skip.
                if (isset($item['latest']) && is_array($item['latest'])) {
                    $item = $item['latest'];
                }
                if (!isset($item['buildNumber']) && !isset($item['name'])) {
                    continue;
                }
                $builds[] = [
                    'id' => $item['id'] ?? null,
                    'name' => (string) ($item['name'] ?? ''),
                    'build_number' => isset($item['buildNumber']) ? (int) $item['buildNumber'] : null,
                    'version_id' => (string) ($item['versionId'] ?? $version),
                    'java' => isset($item['java']) ? (int) $item['java'] : null,
                    'jar_size' => isset($item['jarSize']) ? (int) $item['jarSize'] : null,
                    'created' => $item['created'] ?? null,
                    'experimental' => (bool) ($item['experimental'] ?? false),
                    'changes' => is_array($item['changes'] ?? null) ? array_values($item['changes']) : [],
                ];
            }
        }

        return response()->json([
            'type' => $type,
            'version' => $version,
            'builds' => $builds,
        ]);
    }
}
