<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\Api;

use Mockery\MockInterface;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Location;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Repositories\Daemons\DaemonUpgradeRepository;

class NodeUpgradeControllerTest extends IntegrationTestCase
{
    private function createNode(string $daemonType): Node
    {
        return Node::factory()->create([
            'daemonType' => $daemonType,
            'location_id' => Location::factory()->create()->id,
        ]);
    }

    private function payload(): array
    {
        return [
            'url' => 'https://github.com/calagopus/wings/releases/download/release-1.2.5/wings-rs-x86_64-linux',
            'sha256' => str_repeat('a', 64),
        ];
    }

    public function testBackendsWithoutAnUpgradeEndpointAreRejected()
    {
        $node = $this->createNode('wings');
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->postJson('/admin/api/nodes/' . $node->id . '/upgrade', $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('error', 'This daemon does not support remote upgrades.');
    }

    public function testUpgradeUsesTheBackendsEndpoint()
    {
        $node = $this->createNode('calagopus');

        $this->mock(DaemonUpgradeRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setNode')->andReturnSelf();
            $mock->shouldReceive('upgradeAt')
                ->once()
                ->with(
                    '/api/system/upgrade',
                    $this->payload()['url'],
                    $this->payload()['sha256'],
                    [],
                    'systemctl',
                    ['restart', 'calagopus-wings'],
                )
                ->andReturn(['applied' => true]);
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->postJson('/admin/api/nodes/' . $node->id . '/upgrade', $this->payload())
            ->assertStatus(202)
            ->assertJsonPath('applied', true);
    }

    public function testUpgradeRequiresAValidChecksum()
    {
        $node = $this->createNode('calagopus');
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->postJson('/admin/api/nodes/' . $node->id . '/upgrade', [
                'url' => 'https://example.com/binary',
                'sha256' => 'too-short',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.0.meta.source_field', 'sha256');
    }
}
