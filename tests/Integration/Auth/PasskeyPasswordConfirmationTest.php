<?php

namespace Pterodactyl\Tests\Integration\Auth;

use Illuminate\Support\Str;
use Pterodactyl\Models\User;
use Laravel\Passkeys\Passkey;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class PasskeyPasswordConfirmationTest extends IntegrationTestCase
{
    public function testStatusRequiresAuthentication(): void
    {
        $this->getJson('/user/passkeys/confirmation')->assertUnauthorized();
    }

    public function testStatusIsFalseWithoutConfirmation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/user/passkeys/confirmation')
            ->assertOk()
            ->assertExactJson(['confirmed' => false]);
    }

    public function testPasskeyManagementIsLockedUntilPasswordIsConfirmed(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskey($user);

        $this->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertStatus(423)
            ->assertJsonPath('requires_password_confirmation', true);

        $this->actingAs($user)
            ->postJson('/user/passkeys', [
                'name' => 'Test passkey',
                'credential' => [],
            ])
            ->assertStatus(423);

        $this->actingAs($user)
            ->deleteJson("/user/passkeys/{$passkey->id}")
            ->assertStatus(423);

        $this->actingAs($user)
            ->getJson('/user/passkeys')
            ->assertOk();
    }

    public function testInvalidPasswordIsRejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/user/passkeys/confirm-password', ['password' => 'wrong-password'])
            ->assertStatus(400)
            ->assertJsonPath('errors.0.code', 'InvalidPasswordProvidedException')
            ->assertJsonPath('errors.0.detail', 'The password provided was invalid for this account.');
    }

    public function testPasswordConfirmationUnlocksPasskeyManagement(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/user/passkeys/confirm-password', ['password' => 'password'])
            ->assertOk()
            ->assertExactJson(['confirmed' => true]);

        $this->assertNotNull(session('auth.password_confirmed_at'));

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertOk()
            ->assertJsonStructure([
                'options' => ['challenge', 'rp', 'user', 'pubKeyCredParams', 'timeout'],
            ]);
    }

    public function testExpiredConfirmationLocksPasskeyManagement(): void
    {
        $user = User::factory()->create();

        $this->withSession([
            'auth.password_confirmed_at' => time() - (int) config('auth.password_timeout') - 1,
        ])->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertStatus(423);
    }

    public function testConfirmedSessionCanDeletePasskey(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskey($user);

        $this->withSession(['auth.password_confirmed_at' => time()])
            ->actingAs($user)
            ->deleteJson("/user/passkeys/{$passkey->id}")
            ->assertOk()
            ->assertExactJson(['status' => 'passkey-deleted']);

        $this->assertDatabaseMissing('passkeys', ['id' => $passkey->id]);
    }

    private function createPasskey(User $user): Passkey
    {
        return Passkey::forceCreate([
            'user_id' => $user->id,
            'name' => 'Test passkey',
            'credential_id' => Str::random(40),
            'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
        ]);
    }
}
