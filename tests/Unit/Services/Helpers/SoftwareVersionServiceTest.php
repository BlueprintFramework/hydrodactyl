<?php

namespace Pterodactyl\Tests\Unit\Services\Helpers;

use GuzzleHttp\Client;
use Mockery\MockInterface;
use GuzzleHttp\Psr7\Response;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Helpers\SoftwareVersionService;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

class SoftwareVersionServiceTest extends TestCase
{
    private MockInterface $cache;
    private MockInterface $client;
    private SoftwareVersionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->cache = $this->mock(CacheRepository::class);
        $this->client = $this->mock(Client::class);
    }

    private function buildServiceWithCacheData(array $data): void
    {
        $this->cache->shouldReceive('get')
            ->once()
            ->andReturn($data);

        if ($data === []) {
            $this->client->shouldReceive('request')
                ->andThrow(new \Exception('CDN unavailable'));
        }

        $this->service = new SoftwareVersionService($this->cache, $this->client);
    }

    public function testEmptyCachedResultTriggersARefetchAndIsCached()
    {
        $this->cache->shouldReceive('get')->once()->andReturn([]);
        $this->cache->shouldReceive('put')->once();

        $this->client->shouldReceive('request')
            ->once()
            ->andReturn(new Response(200, [], json_encode(['version' => 'v6.4.1'])));

        $this->service = new SoftwareVersionService($this->cache, $this->client);

        $this->assertSame('v6.4.1', $this->service->getPanel());
    }

    public function testFailedFetchIsNotCached()
    {
        $this->cache->shouldReceive('get')->once()->andReturn([]);
        $this->cache->shouldNotReceive('put');

        $this->client->shouldReceive('request')
            ->once()
            ->andThrow(new \Exception('CDN unavailable'));

        $this->service = new SoftwareVersionService($this->cache, $this->client);

        $this->assertSame('error', $this->service->getPanel());
    }

    public function testGetPanelReturnsPanelVersion()
    {
        $this->buildServiceWithCacheData(['panel' => '1.8.0']);

        $this->assertSame('1.8.0', $this->service->getPanel());
    }

    public function testGetPanelFallsBackToHydrodactylVersionKey()
    {
        $this->buildServiceWithCacheData(['version' => 'v6.4.1']);

        $this->assertSame('v6.4.1', $this->service->getPanel());
    }

    public function testGetPanelReturnsErrorWhenMissing()
    {
        $this->buildServiceWithCacheData([]);

        $this->assertSame('error', $this->service->getPanel());
    }

    public function testGetDiscordReturnsUrl()
    {
        $this->buildServiceWithCacheData(['discord' => 'https://discord.gg/test']);

        $this->assertSame('https://discord.gg/test', $this->service->getDiscord());
    }

    public function testGetDiscordReturnsDefaultWhenMissing()
    {
        $this->buildServiceWithCacheData([]);

        $this->assertSame('https://discord.gg/mnTJVSSaKp', $this->service->getDiscord());
    }

    public function testGetDonationsReturnsUrl()
    {
        $this->buildServiceWithCacheData(['donations' => 'https://ko-fi.com/test']);

        $this->assertSame('https://ko-fi.com/test', $this->service->getDonations());
    }

    public function testGetDonationsReturnsDefaultWhenMissing()
    {
        $this->buildServiceWithCacheData([]);

        $this->assertSame('https://ko-fi.com/naterfute', $this->service->getDonations());
    }

    public function testIsLatestPanelReturnsTrueForCanary()
    {
        config()->set('app.version', 'canary');

        $this->buildServiceWithCacheData(['panel' => '1.7.0']);

        $this->assertTrue($this->service->isLatestPanel());
    }

    public function testIsLatestPanelReturnsTrueWhenCurrentIsNewer()
    {
        config()->set('app.version', '1.9.0');

        $this->buildServiceWithCacheData(['panel' => '1.8.0']);

        $this->assertTrue($this->service->isLatestPanel());
    }

    public function testIsLatestPanelReturnsTrueWhenVersionsMatch()
    {
        config()->set('app.version', '1.8.0');

        $this->buildServiceWithCacheData(['panel' => '1.8.0']);

        $this->assertTrue($this->service->isLatestPanel());
    }

    public function testIsLatestPanelReturnsFalseWhenCurrentIsOlder()
    {
        config()->set('app.version', '1.7.0');

        $this->buildServiceWithCacheData(['panel' => '1.8.0']);

        $this->assertFalse($this->service->isLatestPanel());
    }

    public function testIsLatestPanelStripsLeadingVFromLatest()
    {
        config()->set('app.version', '6.4.1');

        $this->buildServiceWithCacheData(['version' => 'v6.4.1']);

        $this->assertTrue($this->service->isLatestPanel());
    }

    public function testIsLatestPanelReturnsFalseWhenLatestIsUnavailable()
    {
        config()->set('app.version', '6.4.0');

        $this->buildServiceWithCacheData([]);

        $this->assertFalse($this->service->isLatestPanel());
    }
}
