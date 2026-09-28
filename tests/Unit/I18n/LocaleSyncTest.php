<?php

namespace Pterodactyl\Tests\Unit\I18n;

use Pterodactyl\Tests\TestCase;

class LocaleSyncTest extends TestCase
{
    /**
     * Every language must exist on both sides: the PHP dictionaries Laravel
     * reads from resources/lang, and the JSON dictionaries Vite bundles from
     * resources/scripts/i18n/locales. Adding a language is a copy/paste in
     * both places, so this fails loudly whenever one of them is forgotten.
     */
    public function testEveryLocaleExistsOnBothSides()
    {
        $backend = collect(glob(resource_path('lang/*'), GLOB_ONLYDIR))
            ->map(function ($path) {
                return basename($path);
            })
            ->sort()
            ->values()
            ->all();

        $frontend = collect(glob(resource_path('scripts/i18n/locales/*.json')))
            ->map(function ($path) {
                return basename($path, '.json');
            })
            ->sort()
            ->values()
            ->all();

        $this->assertSame(
            $backend,
            $frontend,
            'Locales in resources/lang and resources/scripts/i18n/locales are out of sync.'
        );
    }

    /**
     * A malformed dictionary would only surface at runtime in the browser, so
     * catch broken JSON here instead.
     */
    public function testEveryFrontendDictionaryIsValidJson()
    {
        foreach (glob(resource_path('scripts/i18n/locales/*.json')) as $path) {
            $decoded = json_decode(file_get_contents($path), true);

            $this->assertIsArray($decoded, sprintf('The dictionary %s is not valid JSON.', basename($path)));
        }
    }
}
