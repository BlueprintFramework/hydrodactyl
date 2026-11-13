<?php

namespace Pterodactyl\Tests\Unit\Services\Mcjars;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Services\Mcjars\McjarsClient;
use Pterodactyl\Tests\TestCase;
use RuntimeException;

class McjarsClientTest extends TestCase
{
    private McjarsClient $client;

    public function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->client = new McjarsClient();
    }

    public function testTypeBuildsIndexCachesSuccessfulResponse(): void
    {
        Http::fake([
            '*/api/v2/builds/PAPER' => Http::response([
                'builds' => [
                    '1.21.1' => ['type' => 'RELEASE', 'supported' => true, 'java' => 21],
                ],
            ], 200),
        ]);

        $first = $this->client->typeBuildsIndex('paper');
        $second = $this->client->typeBuildsIndex('PAPER');

        $this->assertSame($first, $second);
        Http::assertSentCount(1);
        $this->assertArrayHasKey('builds', $first);
    }

    public function testBuildsThrowsOnUpstreamFailure(): void
    {
        Http::fake([
            '*/api/v2/builds/PAPER/1.21.1' => Http::response(['error' => 'nope'], 503),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/MCJars HTTP 503/');
        $this->client->builds('PAPER', '1.21.1');
    }
}
