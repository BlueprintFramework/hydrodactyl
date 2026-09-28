<?php

namespace Pterodactyl\Tests\Integration\Http;

use Pterodactyl\Tests\Integration\IntegrationTestCase;

class LocaleDictionaryControllerTest extends IntegrationTestCase
{
    /**
     * The panel serves the UI dictionaries from resources/lang so translated
     * folders show up without rebuilding the frontend.
     */
    public function testDictionaryIsServedForAnAvailableLocale()
    {
        $response = $this->get('/locales/en-US/ui.json');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/json');
        $response->assertJsonStructure(['common', 'navigation', 'panel']);
    }

    public function testUnknownLocaleReturnsNotFound()
    {
        $this->get('/locales/zz-ZZ/ui.json')->assertNotFound();
    }
}
