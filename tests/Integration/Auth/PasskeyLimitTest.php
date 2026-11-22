<?php

namespace Pterodactyl\Tests\Integration\Auth;

use Illuminate\Support\Str;
use Pterodactyl\Models\User;
use Laravel\Passkeys\Passkey;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class PasskeyLimitTest extends IntegrationTestCase
{
    protected function tearDown(): void
    {
        config(['passkeys.max_per_user' => 10]);

        parent::tearDown();
    }

    public function testListIncludesTheConfiguredLimit(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/user/passkeys')
            ->assertOk()
            ->assertJsonPath('max', 10)
            ->assertJsonCount(0, 'passkeys');
    }

    public function testRegistrationIsRejectedAtTheLimit(): void
    {
        config(['passkeys.max_per_user' => 2]);
        $user = User::factory()->create();
        $this->createPasskey($user, 'One');
        $this->createPasskey($user, 'Two');

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertStatus(422)
            ->assertJsonPath('max_passkeys', 2)
            ->assertJsonPath('message', 'You have reached the passkey limit (2). Remove one before adding another.');

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->postJson('/user/passkeys', [
                'name' => 'Three',
                'credential' => [],
            ])
            ->assertStatus(422);

        $this->assertSame(2, $user->passkeys()->count());
    }

    public function testDeletingOnePasskeyReopensRegistration(): void
    {
        config(['passkeys.max_per_user' => 1]);
        $user = User::factory()->create();
        $passkey = $this->createPasskey($user, 'Only one');

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->deleteJson("/user/passkeys/{$passkey->id}")
            ->assertOk();

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertOk();
    }

    public function testDuplicateNamesAreRejectedCaseInsensitively(): void
    {
        $user = User::factory()->create();
        $this->createPasskey($user, 'Pixel');

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->postJson('/user/passkeys', [
                'name' => 'pixel',
                'credential' => [],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'You already have a passkey with this name.');

        $this->assertSame(1, $user->passkeys()->count());
    }

    public function testLimitMessageIsLocalized(): void
    {
        config(['passkeys.max_per_user' => 2]);
        $user = User::factory()->create(['language' => 'es-ES']);
        $this->createPasskey($user, 'One');
        $this->createPasskey($user, 'Two');

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Has alcanzado el límite de llaves de acceso (2). Elimina una antes de añadir otra.');
    }

    private function createPasskey(User $user, string $name): Passkey
    {
        return Passkey::forceCreate([
            'user_id' => $user->id,
            'name' => $name,
            'credential_id' => Str::random(40),
            'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
        ]);
    }
}
