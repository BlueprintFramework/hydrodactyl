<?php

namespace Pterodactyl\Services\Admin;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class LogoService
{
    private const HISTORY_MAX = 10;
    private const WEBP_QUALITY = 85;
    private const LOGO_DIR = 'logo';

    /**
     * Cache of file-existence checks for the current request lifetime.
     *
     * @var array<string, bool>
     */
    private array $existsCache = [];

    public function __construct(
        private SettingsRepositoryInterface $settings,
    ) {}

    public function handle(array $data): void
    {
        if (!empty($data['remove'])) {
            $this->remove();
            return;
        }

        if (isset($data['rewind']) && $data['rewind'] !== '') {
            $this->rewind((int) $data['rewind']);
            return;
        }

        if (!empty($data['logo_url'])) {
            $this->storeLink($data['logo_url']);
            return;
        }

        if (!empty($data['logo_file'])) {
            $this->storeUpload($data['logo_file']);
        }
    }

    /**
     * Whether the server can decode raster images and convert them to WebP.
     */
    public function canProcessImages(): bool
    {
        return function_exists('imagewebp')
            && (function_exists('imagecreatefrompng')
                || function_exists('imagecreatefromjpeg')
                || function_exists('imagecreatefromgif')
                || function_exists('imagecreatefromwebp'));
    }

    private function storeUpload(UploadedFile $file): void
    {
        $mime = $file->getMimeType();

        if ($mime === 'image/svg+xml') {
            $sanitized = $this->sanitizeSvg($file);
            $filename = Str::uuid() . '.svg';
            Storage::disk('public')->put(self::LOGO_DIR . '/' . $filename, $sanitized);
            $value = self::LOGO_DIR . '/' . $filename;
        } else {
            $value = $this->storeRaster($file, $mime);
        }

        $this->addToHistory('upload', $value);
        $this->settings->set('settings::app:logo:type', 'upload');
        $this->settings->set('settings::app:logo:value', $value);
    }

    private function storeRaster(UploadedFile $file, string $mime): string
    {
        $converted = $this->convertToWebp($file, $mime);

        if ($converted !== null) {
            return $converted;
        }

        // Conversion unavailable or failed — store the original file unchanged.
        return $file->store(self::LOGO_DIR, 'public');
    }

    private function sanitizeSvg(UploadedFile $file): string
    {
        $content = $file->get();

        // Use a regex-based approach to strip dangerous elements and attributes
        // without requiring DOMDocument's XML strictness or external dependencies.

        // Remove <script>, <iframe>, <object>, <embed>, <applet>, <foreignObject>, <use> tags and their contents.
        $content = preg_replace(
            '/<\s*(script|iframe|object|embed|applet|foreignObject|use)\b[^>]*>.*?<\s*\/\s*\1\s*>/is',
            '',
            $content,
        );
        $content = preg_replace('/<\s*(script|iframe|object|embed|applet|foreignObject|use)\b[^>]*\/?\s*>/is', '', $content);

        // Remove event handler attributes (on*="...").
        $content = preg_replace('/\s+on[a-z]+\s*=\s*["\'][^"\']*["\']/is', '', $content);
        $content = preg_replace('/\s+on[a-z]+\s*=\s*[^\s>]*/is', '', $content);

        // Remove javascript: and data: URIs inside href/xlink:href attributes.
        $content = preg_replace(
            '/((?:xlink:)?href)\s*=\s*["\']?\s*javascript\s*:/is',
            '$1="about:blank"',
            $content,
        );
        $content = preg_replace(
            '/((?:xlink:)?href)\s*=\s*["\']?\s*data\s*:/is',
            '$1="about:blank"',
            $content,
        );

        return $content;
    }

    private function convertToWebp(UploadedFile $file, string $mime): ?string
    {
        if (!function_exists('imagewebp')) {
            return null;
        }

        $decoder = match ($mime) {
            'image/png' => 'imagecreatefrompng',
            'image/jpeg' => 'imagecreatefromjpeg',
            'image/gif' => 'imagecreatefromgif',
            'image/webp' => 'imagecreatefromwebp',
            default => null,
        };

        if ($decoder === null || !function_exists($decoder)) {
            return null;
        }

        try {
            $image = @$decoder($file->getRealPath());
            if ($image === false) {
                return null;
            }

            $storage = Storage::disk('public');
            $storage->makeDirectory(self::LOGO_DIR);
            $filename = Str::uuid() . '.webp';
            $relativePath = self::LOGO_DIR . '/' . $filename;

            $saved = imagewebp($image, $storage->path($relativePath), self::WEBP_QUALITY);

            if (!$saved) {
                $storage->delete($relativePath);
                return null;
            }

            return $relativePath;
        } catch (\Throwable $exception) {
            Log::warning('Logo conversion to WebP failed; storing the original file.', [
                'mime' => $mime,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function storeLink(string $url): void
    {
        $url = filter_var($url, FILTER_VALIDATE_URL);
        if ($url === false) {
            return;
        }

        // Only allow http(s) URLs — blocks javascript:, data:, vbscript:, etc.
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true)) {
            return;
        }

        $this->addToHistory('link', $url);
        $this->settings->set('settings::app:logo:type', 'link');
        $this->settings->set('settings::app:logo:value', $url);
    }

    private function remove(): void
    {
        $current = $this->settings->get('settings::app:logo:type');
        if ($current === 'upload') {
            $value = $this->settings->get('settings::app:logo:value');
            if ($value) {
                Storage::disk('public')->delete($value);
            }
        }

        $this->settings->set('settings::app:logo:type', null);
        $this->settings->set('settings::app:logo:value', null);
    }

    private function rewind(int $index): void
    {
        $history = $this->getHistory();
        if (!isset($history[$index])) {
            return;
        }

        $entry = $history[$index];

        if ($entry['type'] === 'upload' && !$this->fileExists(Storage::disk('public'), $entry['value'])) {
            return;
        }

        $currentType = $this->settings->get('settings::app:logo:type');
        $currentValue = $this->settings->get('settings::app:logo:value');

        if ($currentType && $currentValue) {
            $history = $this->dedupPrepend($history, $currentType, $currentValue);
        }

        // Remove the target entry by value (the array may have shifted after dedupPrepend)
        // and prepend it so it becomes the current logo.
        $history = array_values(array_filter(
            $history,
            fn($h) => !($h['type'] === $entry['type'] && $h['value'] === $entry['value'])
        ));
        array_unshift($history, $entry);

        $this->settings->set('settings::app:logo:type', $entry['type']);
        $this->settings->set('settings::app:logo:value', $entry['value']);
        $this->settings->set('settings::app:logo:history', json_encode(array_slice($history, 0, self::HISTORY_MAX)));
    }

    private function dedupPrepend(array $history, string $type, string $value): array
    {
        $history = array_filter($history, fn($h) => !($h['type'] === $type && $h['value'] === $value));
        array_unshift($history, ['type' => $type, 'value' => $value]);
        return array_values($history);
    }

    private function addToHistory(string $type, string $value): void
    {
        $history = $this->getHistory();

        $history = $this->dedupPrepend($history, $type, $value);

        $history = array_slice($history, 0, self::HISTORY_MAX);
        $this->settings->set('settings::app:logo:history', json_encode($history));
    }

    public function getHistory(): array
    {
        $raw = $this->settings->get('settings::app:logo:history');
        if (empty($raw)) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        $disk = Storage::disk('public');

        return array_values(array_filter($decoded, function ($entry) use ($disk) {
            if ($entry['type'] === 'upload') {
                return $this->fileExists($disk, $entry['value']);
            }
            return true;
        }));
    }

    /**
     * Check whether a file exists, caching the result for the request lifetime.
     */
    private function fileExists($disk, string $path): bool
    {
        if (!array_key_exists($path, $this->existsCache)) {
            $this->existsCache[$path] = $disk->exists($path);
        }

        return $this->existsCache[$path];
    }

    public function getCurrentType(): ?string
    {
        return $this->settings->get('settings::app:logo:type');
    }

    public function getCurrentValue(): ?string
    {
        return $this->settings->get('settings::app:logo:value');
    }

    public function getCurrentUrl(): ?string
    {
        $type = $this->getCurrentType();
        $value = $this->getCurrentValue();

        if (empty($value)) {
            return null;
        }

        if ($type === 'upload') {
            $url = url('storage/' . $value);
            $path = Storage::disk('public')->path($value);
            if (file_exists($path)) {
                $url .= '?v=' . filemtime($path);
            }
            return $url;
        }

        return $value;
    }
}
