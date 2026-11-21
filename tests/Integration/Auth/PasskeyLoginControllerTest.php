<?php

namespace Pterodactyl\Tests\Integration\Auth;

use Pterodactyl\Models\User;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class PasskeyLoginControllerTest extends IntegrationTestCase
{
    public function testLoginOptionsAreAvailable(): void
    {
        $this->getJson('/auth/passkeys/login/options')
            ->assertOk()
            ->assertJsonStructure([
                'options' => [
                    'challenge',
                    'rpId',
                    'allowCredentials',
                    'userVerification',
                    'timeout',
                ],
            ]);
    }

    public function testPasskeyManagementRequiresAuthentication(): void
    {
        $this->getJson('/user/passkeys')->assertUnauthorized();
    }

    public function testAuthenticatedUserCanListPasskeys(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/user/passkeys')
            ->assertOk()
            ->assertExactJson(['passkeys' => []]);
    }
}
