<?php

namespace Pterodactyl\Tests\Unit\Services\Nests;

use Mockery\MockInterface;
use Pterodactyl\Models\Nest;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Nests\NestCreationService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

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
}
