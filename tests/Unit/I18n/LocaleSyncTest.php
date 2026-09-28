<?php

namespace Pterodactyl\Tests\Unit\I18n;

use Pterodactyl\Tests\TestCase;

class LocaleSyncTest extends TestCase
{
    /**
     * Every locale folder under resources/lang must ship a valid ui.json
     * dictionary next to its PHP files. The panel UI keys (and their compile
     * time types) are built from it, so copying a language folder without the
     * dictionary, or vice versa, fails loudly here.
     */
    public function testEveryLocaleHasAValidUiDictionary()
    {
        $locales = glob(resource_path('lang/*'), GLOB_ONLYDIR);

        $this->assertNotEmpty($locales, 'No locale folders were found in resources/lang.');

        foreach ($locales as $directory) {
            $code = basename($directory);
            $path = $directory . '/ui.json';

            $this->assertFileExists($path, sprintf('The locale "%s" is missing its ui.json dictionary.', $code));

            $decoded = json_decode(file_get_contents($path), true);

            $this->assertIsArray($decoded, sprintf('The dictionary "%s/ui.json" is not valid JSON.', $code));
        }
    }

    /**
     * Framework strings (mail templates) are translated with a JSON file next
     * to the locale folders; a malformed file would silently fall back to the
     * original English key.
     */
    public function testLocaleJsonFilesAreValid()
    {
        foreach (glob(resource_path('lang/*.json')) as $path) {
            $decoded = json_decode(file_get_contents($path), true);

            $this->assertIsArray($decoded, sprintf('The translation file "%s" is not valid JSON.', basename($path)));
        }
    }
}
