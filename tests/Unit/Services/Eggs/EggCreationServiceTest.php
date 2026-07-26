<?php

namespace Pterodactyl\Tests\Unit\Services\Eggs;

use Mockery\MockInterface;
use Pterodactyl\Models\Egg;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Eggs\EggCreationService;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

class EggCreationServiceTest extends TestCase
{
    private MockInterface $config;
    private MockInterface $repository;
    private EggCreationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->config = $this->mock(ConfigRepository::class);
        $this->repository = $this->mock(EggRepositoryInterface::class);

        $this->service = new EggCreationService($this->config, $this->repository);
    }

    public function testEggIsCreated()
    {
        $data = [
            'name' => 'Test Egg',
            'nest_id' => 1,
        ];

        $this->config->shouldReceive('get')
            ->with('pterodactyl.service.author')
            ->andReturn('test@example.com');

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return $data['name'] === 'Test Egg'
                    && $data['author'] === 'test@example.com'
                    && !is_null($data['uuid']);
            }), true, true)
            ->andReturn(new Egg());

        $result = $this->service->handle($data);

        $this->assertInstanceOf(Egg::class, $result);
    }

    public function testValidatesConfigFromExists()
    {
        $data = [
            'name' => 'Child Egg',
            'nest_id' => 1,
            'config_from' => 5,
        ];

        $this->repository->shouldReceive('findCountWhere')
            ->with([
                ['nest_id', '=', 1],
                ['id', '=', 5],
            ])
            ->andReturn(1);

        $this->config->shouldReceive('get')
            ->with('pterodactyl.service.author')
            ->andReturn('test@example.com');

        $this->repository->shouldReceive('create')
            ->once()
            ->andReturn(new Egg());

        $result = $this->service->handle($data);

        $this->assertInstanceOf(Egg::class, $result);
    }
}
