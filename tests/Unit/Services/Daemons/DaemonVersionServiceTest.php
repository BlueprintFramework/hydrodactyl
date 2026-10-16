<?php

namespace Pterodactyl\Tests\Unit\Services\Daemons;

use GuzzleHttp\Client;
use Mockery\MockInterface;
use GuzzleHttp\Psr7\Response;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Services\Daemons\DaemonVersionService;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

class DaemonVersionServiceTest extends TestCase
{
    private MockInterface $cache;
    private MockInterface $client;
    private DaemonVersionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->cache = $this->mock(CacheRepository::class);
        $this->client = $this->mock(Client::class);
        $this->service = new DaemonVersionService($this->cache, $this->client);
    }

    public function testRepositoryAndUpgradeEndpointAreDefinedPerBackend()
    {
        $this->assertSame('pterodactyl/wings', $this->service->repository(DaemonType::WINGS));
        $this->assertSame('pyrohost/elytra', $this->service->repository(DaemonType::ELYTRA));
        $this->assertSame('calagopus/wings', $this->service->repository(DaemonType::CALAGOPUS));

        $this->assertNull($this->service->upgradeEndpoint(DaemonType::WINGS));
        $this->assertNull($this->service->upgradeEndpoint(DaemonType::ELYTRA));
        $this->assertSame('/api/system/upgrade', $this->service->upgradeEndpoint(DaemonType::CALAGOPUS));

        $this->assertSame('calagopus-wings', $this->service->restartService(DaemonType::CALAGOPUS));
    }

    public function testLatestReadsTheCachedRelease()
    {
        $this->cache->shouldReceive('get')->once()->andReturn(['tag_name' => 'v1.13.4']);

        $this->assertSame('v1.13.4', $this->service->latest(DaemonType::WINGS));
    }

    public function testLatestFetchesAndCachesTheRelease()
    {
        $this->cache->shouldReceive('get')->once()->andReturn([]);
        $this->cache->shouldReceive('put')->once();

        $this->client->shouldReceive('request')
            ->once()
            ->andReturn(new Response(200, [], json_encode(['tag_name' => 'v1.13.4'])));

        $this->assertSame('v1.13.4', $this->service->latest(DaemonType::WINGS));
    }

    public function testLatestReturnsNullWhenTheLookupFails()
    {
        $this->cache->shouldReceive('get')->once()->andReturn([]);
        $this->cache->shouldNotReceive('put');

        $this->client->shouldReceive('request')->once()->andThrow(new \Exception('GitHub unavailable'));

        $this->assertNull($this->service->latest(DaemonType::WINGS));
    }

    public function testIsLatestComparesAgainstTheReleaseTag()
    {
        $this->cache->shouldReceive('get')->andReturn(['tag_name' => 'v1.13.4']);

        $this->assertFalse($this->service->isLatest(DaemonType::WINGS, '1.13.3'));
        $this->assertTrue($this->service->isLatest(DaemonType::WINGS, '1.13.4'));
        $this->assertTrue($this->service->isLatest(DaemonType::WINGS, '1.14.0'));
    }

    public function testIsLatestHandlesTagPrefixesLikeReleaseDashes()
    {
        $this->cache->shouldReceive('get')->andReturn(['tag_name' => 'release-1.2.5']);

        $this->assertTrue($this->service->isLatest(DaemonType::CALAGOPUS, '1.2.5'));
        $this->assertFalse($this->service->isLatest(DaemonType::CALAGOPUS, '1.2.4'));
    }

    public function testIsLatestReturnsNullWhenThereIsNothingToCompare()
    {
        $this->cache->shouldReceive('get')->andReturn([]);
        $this->client->shouldReceive('request')->andThrow(new \Exception('GitHub unavailable'));

        $this->assertNull($this->service->isLatest(DaemonType::WINGS, '1.13.3'));
    }
}
