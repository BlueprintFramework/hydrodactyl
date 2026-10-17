<?php

namespace Pterodactyl\Tests\Integration\Api\Client;

use Pterodactyl\Models\User;

class ApiErrorLanguageTest extends ClientApiIntegrationTestCase
{
    /**
     * The locale for API errors is picked from the authenticated account, so the
     * panel never shows a raw english framework message to a translated user.
     */
    public function testApiErrorsUseTheAccountLanguage()
    {
        $spanish = User::factory()->create(['language' => 'es-ES']);

        $this->actingAs($spanish)
            ->getJson('/api/client/servers/a-missing-server')
            ->assertNotFound()
            ->assertJsonPath('errors.0.detail', 'No se pudo encontrar el recurso solicitado en el servidor.');

        $english = User::factory()->create(['language' => 'en-US']);

        $this->actingAs($english)
            ->getJson('/api/client/servers/a-missing-server')
            ->assertNotFound()
            ->assertJsonPath('errors.0.detail', 'The requested resource could not be found on the server.');
    }
}
