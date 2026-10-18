<?php

namespace Pterodactyl\Tests\Unit\I18n;

use Pterodactyl\Tests\TestCase;

class LocaleParityTest extends TestCase
{
    /**
     * Every locale must mirror the canonical keys: same PHP files with the
     * same keys, the same ui.json keys and the same framework json file. This
     * keeps a locale folder a drop-in template for a new language.
     */
    public function testEveryLocaleMirrorsTheCanonicalKeys()
    {
        $canonical = 'en-US';

        $directories = array_filter(
            glob(resource_path('lang/*'), GLOB_ONLYDIR),
            fn ($directory) => basename($directory) !== $canonical
        );

        foreach ($directories as $directory) {
            $locale = basename($directory);

            $expectedFiles = $this->phpFiles(resource_path("lang/{$canonical}"));
            $actualFiles = $this->phpFiles($directory);

            $this->assertSame($expectedFiles, $actualFiles, "The {$locale} locale has a different set of php files than {$canonical}.");

            foreach ($expectedFiles as $file) {
                $expected = $this->flatten(require resource_path("lang/{$canonical}/{$file}"));
                $actual = $this->flatten(require "{$directory}/{$file}");

                $this->assertSame($expected, $actual, "The {$locale}/{$file} keys do not match {$canonical}.");
            }

            $expected = $this->flatten(json_decode(file_get_contents(resource_path("lang/{$canonical}/ui.json")), true));
            $actual = $this->flatten(json_decode(file_get_contents("{$directory}/ui.json"), true));

            $this->assertSame(
                array_keys($expected),
                array_keys($actual),
                "The {$locale}/ui.json keys do not match {$canonical}."
            );

            $canonicalJson = resource_path("lang/{$canonical}.json");
            $localeJson = resource_path("lang/{$locale}.json");

            $this->assertSame(
                file_exists($canonicalJson),
                file_exists($localeJson),
                "The {$locale}.json framework translation file does not mirror {$canonical}.json."
            );

            if (file_exists($canonicalJson)) {
                $expected = array_keys($this->flatten(json_decode(file_get_contents($canonicalJson), true)));
                $actual = array_keys($this->flatten(json_decode(file_get_contents($localeJson), true)));

                $this->assertSame($expected, $actual, "The {$locale}.json keys do not match {$canonical}.json.");
            }
        }
    }

    /**
     * @return string[]
     */
    private function phpFiles(string $directory): array
    {
        $files = [];

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory));

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = str_replace('\\', '/', substr($file->getPathname(), strlen($directory) + 1));
            }
        }

        sort($files);

        return $files;
    }

    /**
     * @return string[]
     */
    private function flatten(mixed $values, string $prefix = ''): array
    {
        $keys = [];

        foreach ((array) $values as $key => $value) {
            $path = $prefix === '' ? (string) $key : "{$prefix}.{$key}";

            if (is_array($value)) {
                $keys = array_merge($keys, $this->flatten($value, $path));
            } else {
                $keys[] = $path;
            }
        }

        sort($keys);

        return $keys;
    }
}
