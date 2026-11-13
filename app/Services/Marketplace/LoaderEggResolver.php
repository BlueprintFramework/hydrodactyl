<?php

namespace Pterodactyl\Services\Marketplace;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;

/**
 * Maps an mrpack loader + Minecraft version onto a nest egg, Docker image,
 * and environment overrides for the install job.
 */
class LoaderEggResolver
{
    /**
     * Preferred egg names (exact match, case-insensitive) per loader.
     *
     * @var array<string, list<string>>
     */
    private const EGG_NAMES = [
        'fabric' => ['Fabric'],
        'forge' => ['Forge Minecraft', 'Forge'],
        'neoforge' => ['Neoforge', 'NeoForge'],
        'quilt' => ['Quilt'],
    ];

    /**
     * Egg feature tags that identify each loader.
     *
     * @var array<string, string>
     */
    private const FEATURES = [
        'fabric' => 'mod/fabric',
        'forge' => 'mod/forge',
        'neoforge' => 'mod/neoforge',
        'quilt' => 'mod/quilt',
    ];

    /**
     * @return array{
     *     egg: Egg,
     *     nest_id: int,
     *     docker_image: string|null,
     *     startup: string|null,
     *     environment: array<string, string>,
     *     java: int,
     * }
     *
     * @throws MarketplaceException
     */
    public function resolve(Server $server, string $loader, string $loaderVersion, string $minecraftVersion): array
    {
        $loader = strtolower(trim($loader));
        if (!isset(self::FEATURES[$loader])) {
            throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_unsupported_loader'));
        }

        $egg = $this->findEgg($server, $loader);
        if ($egg === null) {
            throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_egg_missing', [
                'loader' => $loader,
            ]));
        }

        $egg->loadMissing(['variables', 'nest']);

        $java = $this->recommendedJava($minecraftVersion);
        $dockerImage = $this->pickJavaDockerImage($egg->docker_images ?? [], $java);

        return [
            'egg' => $egg,
            'nest_id' => (int) $egg->nest_id,
            'docker_image' => $dockerImage,
            'startup' => $egg->startup,
            'environment' => $this->buildEnvironment($egg, $loader, $loaderVersion, $minecraftVersion),
            'java' => $java,
        ];
    }

    private function findEgg(Server $server, string $loader): ?Egg
    {
        $feature = self::FEATURES[$loader];
        $names = array_map('strtolower', self::EGG_NAMES[$loader] ?? []);

        $candidates = Egg::query()
            ->where('nest_id', $server->nest_id)
            ->with(['variables', 'nest'])
            ->get();

        // Prefer exact preferred names inside the server's nest.
        foreach ($candidates as $egg) {
            if (in_array(strtolower((string) $egg->name), $names, true)) {
                return $egg;
            }
        }

        foreach ($candidates as $egg) {
            $features = $egg->inherit_features ?? [];
            if (!is_array($features)) {
                continue;
            }
            foreach ($features as $f) {
                if (strtolower((string) $f) === $feature) {
                    return $egg;
                }
            }
        }

        // Fall back to any egg in any nest with the matching feature (rare).
        $global = Egg::query()->with(['variables', 'nest'])->get();
        foreach ($global as $egg) {
            if (in_array(strtolower((string) $egg->name), $names, true)) {
                return $egg;
            }
        }
        foreach ($global as $egg) {
            $features = $egg->inherit_features ?? [];
            if (!is_array($features)) {
                continue;
            }
            foreach ($features as $f) {
                if (strtolower((string) $f) === $feature) {
                    return $egg;
                }
            }
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    private function buildEnvironment(Egg $egg, string $loader, string $loaderVersion, string $minecraftVersion): array
    {
        $env = [];
        $variables = $egg->variables->pluck('env_variable')->all();

        $set = function (string $key, string $value) use (&$env, $variables): void {
            if (in_array($key, $variables, true)) {
                $env[$key] = $value;
            }
        };

        $set('MINECRAFT_VERSION', $minecraftVersion);
        $set('MC_VERSION', $minecraftVersion);
        $set('BUILD_NUMBER', 'latest');
        $set('BUILD_TYPE', 'recommended');

        match ($loader) {
            'fabric' => $set('FABRIC_VERSION', $loaderVersion !== '' ? $loaderVersion : 'latest'),
            'quilt' => $set('QUILT_VERSION', $loaderVersion !== '' ? $loaderVersion : 'latest'),
            // Forge/NeoForge egg rules expect numeric versions; leave unset when unknown
            // so MCJars can resolve from MINECRAFT_VERSION + BUILD_NUMBER.
            'forge' => $loaderVersion !== '' ? $set('FORGE_VERSION', $loaderVersion) : null,
            'neoforge' => $loaderVersion !== '' ? $set('NEOFORGE_VERSION', $loaderVersion) : null,
            default => null,
        };

        return $env;
    }

    /**
     * Mojang / common community Java floors for a Minecraft release.
     */
    public function recommendedJava(string $minecraftVersion): int
    {
        $parts = array_map('intval', explode('.', preg_replace('/[^0-9.]/', '', $minecraftVersion) ?? ''));
        $major = $parts[0] ?? 0;
        $minor = $parts[1] ?? 0;
        $patch = $parts[2] ?? 0;

        if ($major !== 1) {
            return 21;
        }

        // 1.20.5+ and 1.21+ require Java 21.
        if ($minor > 20 || ($minor === 20 && $patch >= 5)) {
            return 21;
        }

        // 1.18 – 1.20.4 → Java 17
        if ($minor >= 18) {
            return 17;
        }

        // 1.17 → Java 16
        if ($minor === 17) {
            return 16;
        }

        return 8;
    }

    /**
     * Pick a docker image URI from an egg's docker_images map given a Java major.
     *
     * @param array<string, string> $dockerImages display name => image URI
     */
    public function pickJavaDockerImage(array $dockerImages, int $java): ?string
    {
        if ($dockerImages === []) {
            return null;
        }

        $keys = array_keys($dockerImages);

        foreach ($keys as $key) {
            if (preg_match('/\bjava\s*' . $java . '\b/i', $key) || str_ends_with($key, '_' . $java)) {
                return $dockerImages[$key];
            }
        }

        $scored = [];
        foreach ($keys as $key) {
            $major = 0;
            if (preg_match('/(\d+)\s*$/', $key, $m) || preg_match('/java[_\s-]?(\d+)/i', $key, $m)) {
                $major = (int) $m[1];
            }
            if ($major >= $java) {
                $scored[] = ['key' => $key, 'major' => $major];
            }
        }

        usort($scored, fn($a, $b) => $a['major'] <=> $b['major']);
        if ($scored !== []) {
            return $dockerImages[$scored[0]['key']];
        }

        return array_values($dockerImages)[0] ?? null;
    }
}
