<?php

namespace Pterodactyl\Tests\Unit\Services\Users;

use Carbon\Carbon;
use Mockery\MockInterface;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\TestCase;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Users\ToggleTwoFactorService;
use Pterodactyl\Contracts\Repository\UserRepositoryInterface;
use Pterodactyl\Repositories\Eloquent\RecoveryTokenRepository;
use Pterodactyl\Exceptions\Service\User\TwoFactorAuthenticationTokenInvalid;

class ToggleTwoFactorServiceTest extends TestCase
{
    private MockInterface $connection;
    private MockInterface $encrypter;
    private MockInterface $google2FA;
    private MockInterface $recoveryTokenRepository;
    private MockInterface $repository;
    private ToggleTwoFactorService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->connection = $this->mock(ConnectionInterface::class);
        $this->encrypter = $this->mock(Encrypter::class);
        $this->google2FA = $this->mock(Google2FA::class);
        $this->recoveryTokenRepository = $this->mock(RecoveryTokenRepository::class);
        $this->repository = $this->mock(UserRepositoryInterface::class);

        $this->service = new ToggleTwoFactorService(
            $this->connection,
            $this->encrypter,
            $this->google2FA,
            $this->recoveryTokenRepository,
            $this->repository,
        );
    }

    public function testExceptionIsThrownForInvalidToken()
    {
        $user = User::factory()->make(['totp_secret' => 'encrypted-secret']);

        $this->encrypter->shouldReceive('decrypt')
            ->with('encrypted-secret')
            ->andReturn('decrypted-secret');

        $this->google2FA->shouldReceive('verifyKey')
            ->with('decrypted-secret', 'invalid-token', \Mockery::any())
            ->andReturn(false);

        $this->expectException(TwoFactorAuthenticationTokenInvalid::class);

        $this->service->handle($user, 'invalid-token');
    }

    public function testTwoFactorCanBeEnabled()
    {
        Carbon::setTestNow(Carbon::now());

        $user = User::factory()->make([
            'id' => 1,
            'totp_secret' => 'encrypted-secret',
            'use_totp' => false,
        ]);

        $this->encrypter->shouldReceive('decrypt')
            ->with('encrypted-secret')
            ->andReturn('decrypted-secret');

        $this->google2FA->shouldReceive('verifyKey')
            ->with('decrypted-secret', 'valid-token', \Mockery::any())
            ->andReturn(true);

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->recoveryTokenRepository->shouldReceive('deleteWhere')
            ->once()
            ->with(['user_id' => 1]);

        $this->recoveryTokenRepository->shouldReceive('insert')
            ->once()
            ->with(\Mockery::on(function ($inserts) {
                return count($inserts) === 10;
            }));

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, \Mockery::on(function ($data) {
                return $data['use_totp'] === true && isset($data['totp_authenticated_at']);
            }));

        $result = $this->service->handle($user, 'valid-token', true);

        $this->assertCount(10, $result);
        foreach ($result as $token) {
            $this->assertIsString($token);
            $this->assertSame(10, strlen($token));
        }
    }

    public function testTwoFactorCanBeDisabled()
    {
        $user = User::factory()->make([
            'id' => 1,
            'totp_secret' => 'encrypted-secret',
            'use_totp' => true,
        ]);

        $this->encrypter->shouldReceive('decrypt')
            ->with('encrypted-secret')
            ->andReturn('decrypted-secret');

        $this->google2FA->shouldReceive('verifyKey')
            ->with('decrypted-secret', 'valid-token', \Mockery::any())
            ->andReturn(true);

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->recoveryTokenRepository->shouldNotReceive('deleteWhere');
        $this->recoveryTokenRepository->shouldNotReceive('insert');

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, \Mockery::on(function ($data) {
                return $data['use_totp'] === false;
            }));

        $result = $this->service->handle($user, 'valid-token', false);

        $this->assertSame([], $result);
    }

    public function testTwoFactorCanBeToggledWithoutExplicitState()
    {
        $user = User::factory()->make([
            'id' => 1,
            'totp_secret' => 'encrypted-secret',
            'use_totp' => false,
        ]);

        $this->encrypter->shouldReceive('decrypt')
            ->with('encrypted-secret')
            ->andReturn('decrypted-secret');

        $this->google2FA->shouldReceive('verifyKey')
            ->with('decrypted-secret', 'valid-token', \Mockery::any())
            ->andReturn(true);

        $this->connection->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->recoveryTokenRepository->shouldReceive('deleteWhere')
            ->once()
            ->with(['user_id' => 1]);
        $this->recoveryTokenRepository->shouldReceive('insert')
            ->once();

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, \Mockery::on(function ($data) {
                return $data['use_totp'] === true;
            }));

        $result = $this->service->handle($user, 'valid-token');

        $this->assertCount(10, $result);
    }
}
