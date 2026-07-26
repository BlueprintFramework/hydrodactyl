<?php

namespace Pterodactyl\Tests\Unit\Services\Users;

use Mockery\MockInterface;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\TestCase;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Users\TwoFactorSetupService;
use Pterodactyl\Contracts\Repository\UserRepositoryInterface;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

class TwoFactorSetupServiceTest extends TestCase
{
    private MockInterface $config;
    private MockInterface $encrypter;
    private MockInterface $repository;
    private TwoFactorSetupService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->config = $this->mock(ConfigRepository::class);
        $this->encrypter = $this->mock(Encrypter::class);
        $this->repository = $this->mock(UserRepositoryInterface::class);

        $this->service = new TwoFactorSetupService($this->config, $this->encrypter, $this->repository);
    }

    public function testSetupReturnsImageUrlAndSecret()
    {
        $user = User::factory()->make(['id' => 1, 'email' => 'test@example.com']);

        $this->config->shouldReceive('get')
            ->with('pterodactyl.auth.2fa.bytes', 16)
            ->andReturn(16);

        $this->config->shouldReceive('get')
            ->with('app.name')
            ->andReturn('Hydrodactyl');

        $this->encrypter->shouldReceive('encrypt')
            ->once()
            ->andReturn('encrypted-secret');

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, \Mockery::on(function ($data) {
                return isset($data['totp_secret']) && $data['totp_secret'] === 'encrypted-secret';
            }));

        $result = $this->service->handle($user);

        $this->assertArrayHasKey('image_url_data', $result);
        $this->assertArrayHasKey('secret', $result);
        $this->assertStringContainsString('otpauth://totp', $result['image_url_data']);
        $this->assertNotEmpty($result['secret']);
    }
}
