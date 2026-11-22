<?php

namespace Pterodactyl\Tests\Integration\Auth;

use Illuminate\Support\Str;
use Laravel\Passkeys\Passkey;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class PasskeyMetadataTest extends IntegrationTestCase
{
    public function testListReturnsAuthenticatorMetadata(): void
    {
        $user = User::factory()->create();

        Passkey::forceCreate([
            'user_id' => $user->id,
            'name' => 'Pixel',
            'credential_id' => Str::random(40),
            'credential' => [
                'aaguid' => 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
            ],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/user/passkeys')
            ->assertOk()
            ->assertJsonPath('passkeys.0.name', 'Pixel')
            ->assertJsonPath('passkeys.0.authenticator', 'Google Password Manager');

        $this->assertNotEmpty($response->json('passkeys.0.created_at'));
        $this->assertNotEmpty($response->json('passkeys.0.authenticator_icon_light'));
        $this->assertNotEmpty($response->json('passkeys.0.authenticator_icon_dark'));
    }
}
