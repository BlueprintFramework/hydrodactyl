<?php

namespace Pterodactyl\Services\Marketplace;

use Illuminate\Support\Arr;
use ZipArchive;

/**
 * Parses a Modrinth .mrpack (zip) into index metadata, required server files,
 * and override entry paths. Override *contents* are streamed later from the
 * zip during materialization — never fully buffered in memory (large packs
 * like Cobblemon OOMd the 128M queue worker when every override was loaded).
 */
class MrpackParser
{
    /**
     * @return array{
     *     index: array<string, mixed>,
     *     minecraft: string,
     *     loader: string,
     *     loader_version: string,
     *     files: list<array{path: string, url: string, hashes: array<string, string>, size: int|null}>,
     *     overrides: list<array{path: string, zip_entry: string}>,
     * }
     *
     * @throws MarketplaceException
     */
    public function parse(string $mrpackPath): array
    {
        $zip = new ZipArchive();
        $opened = $zip->open($mrpackPath);
        if ($opened !== true) {
            throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_unreadable'));
        }

        try {
            $rawIndex = $zip->getFromName('modrinth.index.json');
            if ($rawIndex === false) {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_missing_index'));
            }

            try {
                /** @var array<string, mixed> $index */
                $index = json_decode($rawIndex, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_invalid_index'));
            }

            $deps = Arr::get($index, 'dependencies', []);
            if (!is_array($deps)) {
                $deps = [];
            }

            $minecraft = (string) ($deps['minecraft'] ?? '');
            if ($minecraft === '') {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_missing_minecraft'));
            }

            [$loader, $loaderVersion] = $this->resolveLoader($deps);
            if ($loader === null) {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_unsupported_loader'));
            }

            $files = $this->requiredServerFiles(Arr::get($index, 'files', []));
            $overrides = [
                ...$this->listOverrideTree($zip, 'overrides/'),
                ...$this->listOverrideTree($zip, 'server-overrides/'),
            ];

            if ($files === [] && $overrides === []) {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_client_only'));
            }

            return [
                'index' => $index,
                'minecraft' => $minecraft,
                'loader' => $loader,
                'loader_version' => $loaderVersion,
                'files' => $files,
                'overrides' => $overrides,
            ];
        } finally {
            $zip->close();
        }
    }

    /**
     * Read one override blob from the pack. Caller should discard the string
     * promptly after uploading to the daemon.
     *
     * @throws MarketplaceException
     */
    public function readOverride(string $mrpackPath, string $zipEntry): string
    {
        $zip = new ZipArchive();
        $opened = $zip->open($mrpackPath);
        if ($opened !== true) {
            throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_unreadable'));
        }

        try {
            $contents = $zip->getFromName($zipEntry);
            if ($contents === false) {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_unreadable'));
            }

            return $contents;
        } finally {
            $zip->close();
        }
    }

    /**
     * @param array<string, mixed> $deps
     *
     * @return array{0: string|null, 1: string}
     */
    private function resolveLoader(array $deps): array
    {
        $map = [
            'fabric-loader' => 'fabric',
            'forge' => 'forge',
            'neoforge' => 'neoforge',
            'quilt-loader' => 'quilt',
        ];

        foreach ($map as $key => $loader) {
            if (!empty($deps[$key]) && is_scalar($deps[$key])) {
                return [$loader, (string) $deps[$key]];
            }
        }

        return [null, ''];
    }

    /**
     * @param mixed $files
     *
     * @return list<array{path: string, url: string, hashes: array<string, string>, size: int|null}>
     */
    private function requiredServerFiles(mixed $files): array
    {
        if (!is_array($files)) {
            return [];
        }

        $out = [];
        foreach ($files as $file) {
            if (!is_array($file)) {
                continue;
            }

            $env = Arr::get($file, 'env', []);
            $serverEnv = is_array($env) ? strtolower((string) ($env['server'] ?? '')) : '';
            // v1: only required server files (skip optional / unsupported).
            if ($serverEnv !== 'required') {
                continue;
            }

            $path = (string) Arr::get($file, 'path', '');
            $downloads = Arr::get($file, 'downloads', []);
            $url = is_array($downloads) ? (string) ($downloads[0] ?? '') : '';
            if ($path === '' || $url === '') {
                continue;
            }

            if (!$this->isSafeRelativePath($path)) {
                throw MarketplaceException::upstream('modrinth', __('exceptions.client.marketplace.modpack_unsafe_path', [
                    'path' => $path,
                ]));
            }

            $hashes = Arr::get($file, 'hashes', []);
            $out[] = [
                'path' => $path,
                'url' => $url,
                'hashes' => is_array($hashes) ? array_map('strval', $hashes) : [],
                'size' => is_numeric(Arr::get($file, 'fileSize')) ? (int) Arr::get($file, 'fileSize') : null,
            ];
        }

        return $out;
    }

    /**
     * List override paths without reading file bodies into memory.
     *
     * @return list<array{path: string, zip_entry: string}>
     */
    private function listOverrideTree(ZipArchive $zip, string $prefix): array
    {
        $out = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (!is_string($name) || !str_starts_with($name, $prefix)) {
                continue;
            }
            if (str_ends_with($name, '/')) {
                continue;
            }

            $relative = substr($name, strlen($prefix));
            if ($relative === '' || !$this->isSafeRelativePath($relative)) {
                continue;
            }

            $out[] = [
                'path' => $relative,
                'zip_entry' => $name,
            ];
        }

        return $out;
    }

    private function isSafeRelativePath(string $path): bool
    {
        $normalized = str_replace('\\', '/', $path);
        if ($normalized === '' || str_starts_with($normalized, '/') || str_contains($normalized, "\0")) {
            return false;
        }

        foreach (explode('/', $normalized) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                return false;
            }
        }

        return true;
    }
}
