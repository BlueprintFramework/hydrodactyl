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
        'settings::passkeys:max_per_user',
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
            ->assertJsonPath('passkeys.passkeys:max_per_user', 10)
            ->assertJsonPath('passkeys.passkeys:relying_party_id', 'localhost')
            ->assertJsonPath('passkeys.passkeys:allowed_origins', 'http://localhost');
    }

    public function testPasskeySettingsCanBeUpdated(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->patchJson('/admin/api/settings/passkeys', [
                'passkeys:enabled' => false,
                'passkeys:max_per_user' => 5,
                'passkeys:relying_party_id' => 'panel.example.com',
                'passkeys:allowed_origins' => 'HTTPS://Panel.Example.com/',
            ])
            ->assertOk();

        $this->assertDatabaseHas('settings', [
            'key' => 'settings::passkeys:enabled',
            'value' => 'false',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'settings::passkeys:max_per_user',
            'value' => '5',
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
                'passkeys:max_per_user' => 10,
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
                'passkeys:max_per_user' => 10,
                'passkeys:relying_party_id' => 'panel.example.com',
                'passkeys:allowed_origins' => 'https://attacker.example.net',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.0.meta.source_field', 'passkeys:allowed_origins')
            ->assertJsonPath(
                'errors.0.detail',
                'Los orígenes de las llaves de acceso deben pertenecer al dominio de la parte de confianza.',
            );
    }

    public function testPasskeySettingsRejectInvalidRelyingPartyIds(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        $invalidIds = [
            '-panel.example.com',
            'panel-.example.com',
            'panel..example.com',
            '.panel.example.com',
            'panel.example.com.',
            'panel_example.com',
            '127.0.0.1',
            'https://panel.example.com',
            'panel.example.com/path',
            str_repeat('a', 64) . '.example.com',
        ];

        foreach ($invalidIds as $relyingPartyId) {
            $this->actingAs($user)
                ->patchJson('/admin/api/settings/passkeys', [
                    'passkeys:enabled' => true,
                    'passkeys:max_per_user' => 10,
                    'passkeys:relying_party_id' => $relyingPartyId,
                    'passkeys:allowed_origins' => 'https://panel.example.com',
                ])
                ->assertStatus(422);
        }
    }

    public function testPasskeySettingsAcceptValidRelyingPartyIds(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        foreach ([
            ['localhost', 'http://localhost'],
            ['panel.example.com', 'https://panel.example.com'],
            ['sub.panel.example.com', 'https://sub.panel.example.com'],
        ] as [$relyingPartyId, $origin]) {
            $this->actingAs($user)
                ->patchJson('/admin/api/settings/passkeys', [
                    'passkeys:enabled' => true,
                    'passkeys:max_per_user' => 10,
                    'passkeys:relying_party_id' => $relyingPartyId,
                    'passkeys:allowed_origins' => $origin,
                ])
                ->assertOk();
        }
    }

    public function testPasskeySettingsRejectInvalidMaximums(): void
    {
        $user = User::factory()->create(['root_admin' => true]);

        foreach ([-1, 101, 'ten'] as $maxPerUser) {
            $this->actingAs($user)
                ->patchJson('/admin/api/settings/passkeys', [
                    'passkeys:enabled' => true,
                    'passkeys:max_per_user' => $maxPerUser,
                    'passkeys:relying_party_id' => 'panel.example.com',
                    'passkeys:allowed_origins' => 'https://panel.example.com',
                ])
                ->assertStatus(422);
        }
    }

    public function testPasskeyRelyingPartyValidationMessageIsLocalized(): void
    {
        $user = User::factory()->create(['root_admin' => true, 'language' => 'es-ES']);

        $this->actingAs($user)
            ->patchJson('/admin/api/settings/passkeys', [
                'passkeys:enabled' => true,
                'passkeys:max_per_user' => 10,
                'passkeys:relying_party_id' => 'panel..example.com',
                'passkeys:allowed_origins' => 'https://panel.example.com',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.0.meta.source_field', 'passkeys:relying_party_id')
            ->assertJsonPath(
                'errors.0.detail',
                'El ID de la parte de confianza debe ser un nombre de dominio válido, sin esquema, ruta, puerto ni dirección IP.',
            );
    }
}
