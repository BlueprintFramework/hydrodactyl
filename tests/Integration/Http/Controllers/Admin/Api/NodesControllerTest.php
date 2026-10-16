<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\Api;

use Mockery\MockInterface;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Location;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Services\Daemons\DaemonVersionService;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class NodesControllerTest extends IntegrationTestCase
{
    private function createNode(string $daemonType = 'wings'): Node
    {
        return Node::factory()->create([
            'daemonType' => $daemonType,
            'location_id' => Location::factory()->create()->id,
        ]);
    }

    private function mockDaemonStatus(string $version = '1.13.3'): void
    {
        $this->mock(DaemonConfigurationRepository::class, function (MockInterface $mock) use ($version) {
            $mock->shouldReceive('setNode')->andReturnSelf();
            $mock->shouldReceive('getSystemInformation')->andReturn(['version' => $version]);
        });
    }

    /**
     * The daemon status endpoint should report the version reported by the
     * node alongside whether it is up to date with the backend's latest release.
     */
    public function testStatusReportsDaemonVersionAndUpToDateCheck()
    {
        $node = $this->createNode();

        $this->mockDaemonStatus('1.13.3');

        $this->mock(DaemonVersionService::class, function (MockInterface $mock) {
            $mock->shouldReceive('latest')->with(\Mockery::type(DaemonType::class))->andReturn('v1.13.4');
            $mock->shouldReceive('isLatest')->with(\Mockery::type(DaemonType::class), '1.13.3')->andReturn(true);
            $mock->shouldReceive('upgradeEndpoint')->andReturnNull();
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/nodes/' . $node->id . '/status')
            ->assertOk()
            ->assertJsonPath('data.up', true)
            ->assertJsonPath('data.version', '1.13.3')
            ->assertJsonPath('data.latest', 'v1.13.4')
            ->assertJsonPath('data.up_to_date', true)
            ->assertJsonPath('data.upgrade_supported', false);
    }

    /**
     * A backend that exposes a self-upgrade endpoint should say so.
     */
    public function testStatusReflectsUpgradeSupportPerBackend()
    {
        $node = $this->createNode('calagopus');

        $this->mockDaemonStatus('1.2.5');

        $this->mock(DaemonVersionService::class, function (MockInterface $mock) {
            $mock->shouldReceive('latest')->andReturn('release-1.2.5');
            $mock->shouldReceive('isLatest')->andReturn(false);
            $mock->shouldReceive('upgradeEndpoint')->with(\Mockery::type(DaemonType::class))->andReturn('/api/system/upgrade');
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/nodes/' . $node->id . '/status')
            ->assertOk()
            ->assertJsonPath('data.up_to_date', false)
            ->assertJsonPath('data.upgrade_supported', true);
    }

    /**
     * An unreachable node should not claim a version check.
     */
    public function testStatusReportsUnreachableDaemon()
    {
        $node = $this->createNode();

        $this->mock(DaemonConfigurationRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setNode')->andReturnSelf();
            $mock->shouldReceive('getSystemInformation')->andThrow(new \RuntimeException('connection refused'));
        });

        $this->mock(DaemonVersionService::class, function (MockInterface $mock) {
            $mock->shouldReceive('latest')->andReturn('v1.13.4');
            $mock->shouldReceive('upgradeEndpoint')->andReturnNull();
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/nodes/' . $node->id . '/status')
            ->assertOk()
            ->assertJsonPath('data.up', false)
            ->assertJsonPath('data.version', null)
            ->assertJsonPath('data.latest', 'v1.13.4')
            ->assertJsonPath('data.up_to_date', null);
    }

    /**
     * When the release lookup fails there is nothing to compare against.
     */
    public function testStatusOmitsCheckWhenLatestReleaseIsUnavailable()
    {
        $node = $this->createNode();

        $this->mockDaemonStatus('1.13.3');

        $this->mock(DaemonVersionService::class, function (MockInterface $mock) {
            $mock->shouldReceive('latest')->andReturnNull();
            $mock->shouldReceive('upgradeEndpoint')->andReturnNull();
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/nodes/' . $node->id . '/status')
            ->assertOk()
            ->assertJsonPath('data.latest', null)
            ->assertJsonPath('data.up_to_date', null);
    }
}
