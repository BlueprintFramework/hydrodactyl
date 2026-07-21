<?php

namespace Pterodactyl\Tests\Unit\Services\Nests;

use Mockery\MockInterface;
use Pterodactyl\Models\Nest;
use Pterodactyl\Tests\TestCase;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Services\Nests\NestCreationService;

class NestCreationServiceTest extends TestCase
{
    private MockInterface $config;
    private MockInterface $repository;
    private NestCreationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->config = $this->mock(ConfigRepository::class);
        $this->repository = $this->mock(NestRepositoryInterface::class);
        $this->service = new NestCreationService($this->config, $this->repository);
    }

    public function testNestIsCreatedWithUuidAndAuthor()
    {
        $data = [
            'name' => 'Test Nest',
            'description' => 'A test nest',
        ];

        $this->config->shouldReceive('get')
            ->with('pterodactyl.service.author')
            ->andReturn('test@example.com');

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return $data['name'] === 'Test Nest'
                    && $data['author'] === 'test@example.com'
                    && !is_null($data['uuid']);
            }), true, true)
            ->andReturn(new Nest());

        $result = $this->service->handle($data);

        $this->assertInstanceOf(Nest::class, $result);
    }

    public function testNestIsCreatedWithCustomAuthor()
    {
        $data = ['name' => 'Custom Nest'];

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return $data['author'] === 'custom@author.com';
            }), true, true)
            ->andReturn(new Nest());

        $this->service->handle($data, 'custom@author.com');
    }

    /**
     * Property 1: Icon path inclusion when icon is supplied
     * Validates: Requirements 2.1
     */
    public function testIconIsIncludedInPayloadWhenProvided()
    {
        $data = [
            'name' => 'Minecraft',
            'description' => 'A Minecraft nest',
            'icon' => 'nests/minecraft.png',
        ];

        $this->config->shouldReceive('get')
            ->with('pterodactyl.service.author')
            ->andReturn('test@example.com');

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($payload) {
                return array_key_exists('icon', $payload)
                    && $payload['icon'] === 'nests/minecraft.png';
            }), true, true)
            ->andReturn(new Nest());

        $this->service->handle($data);
    }

    /**
     * Property 2: Icon key omission when icon is absent
     * Validates: Requirements 2.2
     */
    public function testIconIsOmittedFromPayloadWhenNotProvided()
    {
        $data = [
            'name' => 'Minecraft',
            'description' => 'A Minecraft nest',
        ];

        $this->config->shouldReceive('get')
            ->with('pterodactyl.service.author')
            ->andReturn('test@example.com');

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($payload) {
                return !array_key_exists('icon', $payload);
            }), true, true)
            ->andReturn(new Nest());

        $this->service->handle($data);
    }
}
