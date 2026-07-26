<?php

namespace Pterodactyl\Tests\Unit\Services\Helpers;

use GuzzleHttp\Client;
use Mockery\MockInterface;
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
        $this->cache->shouldReceive('remember')
            ->once()
            ->andReturn($data);

        $this->service = new SoftwareVersionService($this->cache, $this->client);
    }

    public function testGetPanelReturnsPanelVersion()
    {
        $this->buildServiceWithCacheData(['panel' => '1.8.0']);

        $this->assertSame('1.8.0', $this->service->getPanel());
    }

    public function testGetPanelReturnsErrorWhenMissing()
    {
        $this->buildServiceWithCacheData([]);

        $this->assertSame('error', $this->service->getPanel());
    }

    public function testGetDaemonReturnsWingsVersion()
    {
        $this->buildServiceWithCacheData(['wings' => '1.5.0']);

        $this->assertSame('1.5.0', $this->service->getDaemon());
    }

    public function testGetDaemonReturnsErrorWhenMissing()
    {
        $this->buildServiceWithCacheData([]);

        $this->assertSame('error', $this->service->getDaemon());
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

    public function testIsLatestDaemonReturnsTrueForDevelop()
    {
        $this->buildServiceWithCacheData(['wings' => '1.4.0']);

        $this->assertTrue($this->service->isLatestDaemon('develop'));
    }

    public function testIsLatestDaemonReturnsTrueWhenVersionIsNewer()
    {
        $this->buildServiceWithCacheData(['wings' => '1.4.0']);

        $this->assertTrue($this->service->isLatestDaemon('1.5.0'));
    }

    public function testIsLatestDaemonReturnsFalseWhenVersionIsOlder()
    {
        $this->buildServiceWithCacheData(['wings' => '1.5.0']);

        $this->assertFalse($this->service->isLatestDaemon('1.4.0'));
    }
}
