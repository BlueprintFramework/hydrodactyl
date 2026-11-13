<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Models\Permission;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class McjarsControllerTest extends ClientApiIntegrationTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function testVersionsRequiresSoftwarePermission(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_WEBSOCKET_CONNECT]);

        $this->actingAs($user)
            ->getJson("/api/client/servers/{$server->uuid}/mcjars/versions?type=PAPER")
            ->assertForbidden();
    }

    public function testVersionsReturnsNormalizedPayload(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_STARTUP_SOFTWARE]);

        Http::fake([
            '*/api/v2/builds/PAPER' => Http::response([
                'builds' => [
                    '1.21.1' => [
                        'type' => 'RELEASE',
                        'supported' => true,
                        'java' => 21,
                        'builds' => 3,
                        'latest' => [
                            'buildNumber' => 120,
                            'name' => '120',
                            'jarSize' => 48000000,
                            'created' => '2026-01-01T00:00:00Z',
                            'experimental' => false,
                            'java' => 21,
                        ],
                    ],
                    '1.20.4' => [
                        'type' => 'RELEASE',
                        'supported' => true,
                        'java' => 17,
                        'builds' => 1,
                        'latest' => [
                            'buildNumber' => 10,
                            'name' => '10',
                            'jarSize' => 40000000,
                            'created' => '2025-01-01T00:00:00Z',
                            'experimental' => false,
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/client/servers/{$server->uuid}/mcjars/versions?type=paper")
            ->assertOk()
            ->json();

        $this->assertSame('PAPER', $response['type']);
        $this->assertCount(2, $response['versions']);
        $this->assertSame('1.21.1', $response['versions'][0]['id']);
        $this->assertSame(21, $response['versions'][0]['java']);
    }

    public function testUpstreamFailureUsesClientErrorEnvelope(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_STARTUP_SOFTWARE]);

        Http::fake([
            '*/api/v2/builds/PAPER' => Http::response(['error' => 'down'], 503),
        ]);

        $this->actingAs($user)
            ->getJson("/api/client/servers/{$server->uuid}/mcjars/versions?type=PAPER")
            ->assertStatus(502)
            ->assertJsonStructure(['errors' => [['code', 'status', 'detail']]]);
    }
}
