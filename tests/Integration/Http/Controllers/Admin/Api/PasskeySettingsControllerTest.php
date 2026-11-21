<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\Api;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class PasskeySettingsControllerTest extends IntegrationTestCase
{
    private const KEYS = [
        'settings::passkeys:enabled',
        'settings::passkeys:relying_party_id',
        'settings::passkeys:allowed_origins',
    ];

    protected function tearDown(): void
    {
        Setting::query()->whereIn('key', self::KEYS)->delete();
        Cache::forget('pterodactyl:settings:all');

        parent::tearDown();
    }

    public function testPasskeySettingsAreExposed(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/settings')
            ->assertOk()
            ->assertJsonPath('passkeys.passkeys:enabled', true)
            ->assertJsonPath('passkeys.passkeys:relying_party_id', 'localhost')
            ->assertJsonPath('passkeys.passkeys:allowed_origins', 'http://localhost');
    }

    public function testPasskeySettingsCanBeUpdated(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->patchJson('/admin/api/settings/passkeys', [
                'passkeys:enabled' => false,
                'passkeys:relying_party_id' => 'panel.example.com',
                'passkeys:allowed_origins' => 'HTTPS://Panel.Example.com/',
            ])
            ->assertOk();

        $this->assertDatabaseHas('settings', [
            'key' => 'settings::passkeys:enabled',
            'value' => 'false',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'settings::passkeys:relying_party_id',
            'value' => 'panel.example.com',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'settings::passkeys:allowed_origins',
            'value' => 'https://panel.example.com',
        ]);
    }

    public function testPasskeySettingsRejectOriginsOutsideTheRelyingParty(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->patchJson('/admin/api/settings/passkeys', [
                'passkeys:enabled' => true,
                'passkeys:relying_party_id' => 'panel.example.com',
                'passkeys:allowed_origins' => 'https://attacker.example.net',
            ])
            ->assertStatus(422);
    }

    public function testPasskeyOriginValidationMessagesAreLocalized(): void
    {
        $user = User::factory()->create(['root_admin' => true, 'language' => 'es-ES']);

        $this->actingAs($user)
            ->patchJson('/admin/api/settings/passkeys', [
                'passkeys:enabled' => true,
                'passkeys:relying_party_id' => 'panel.example.com',
                'passkeys:allowed_origins' => 'https://attacker.example.net',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.0.meta.source_field', 'passkeys:allowed_origins')
            ->assertJsonPath(
                'errors.0.detail',
                'Los orígenes de las claves de acceso deben pertenecer al dominio del Relying Party.',
            );
    }
}
