<?php

namespace Pterodactyl\Tests\Integration\Models\Daemons;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Location;
use Pterodactyl\Enums\Daemon\Adapters;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Models\Daemons\Calagopus;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class CalagopusDaemonTest extends IntegrationTestCase
{
    use DatabaseTransactions;

    public function testDaemonTypeIsRegistered()
    {
        $this->assertContains('calagopus', DaemonType::values());
        $this->assertSame(Calagopus::class, DaemonType::allClass()['calagopus']);
        $this->assertArrayHasKey('calagopus', DaemonType::allResources());
    }

    public function testConfigurationIncludesCalagopusOptions()
    {
        $node = $this->createCalagopusNode();

        $config = $node->getConfiguration();

        $this->assertSame('Calagopus', $config['app_name']);
        $this->assertSame($node->daemonBase, $config['system']['data']);
        $this->assertSame($node->daemonSFTP, $config['system']['sftp']['bind_port']);
        $this->assertSame($node->daemonListen, $config['api']['port']);

        // Calagopus' added system.backups block is present with its drivers.
        $this->assertArrayHasKey('backups', $config['system']);
        foreach (['write_limit', 'compression_level', 'mounting', 'wings', 's3', 'ddup_bak', 'restic', 'btrfs', 'zfs', 'pbs'] as $key) {
            $this->assertArrayHasKey($key, $config['system']['backups']);
        }

        // Calagopus-only API options are merged in alongside the standard keys.
        $this->assertArrayHasKey('send_offline_server_logs', $config['api']);
        $this->assertArrayHasKey('file_search_threads', $config['api']);
    }

    public function testAutoDeployUsesCalagopusBinary()
    {
        $node = $this->createCalagopusNode();

        $command = $node->getAutoDeploy('super-secret-token');

        $this->assertStringContainsString('cd /etc/calagopus-wings', $command);
        $this->assertStringContainsString('calagopus-wings configure', $command);
        $this->assertStringContainsString('--panel-url', $command);
        $this->assertStringContainsString('super-secret-token', $command);
        $this->assertStringContainsString("--node '{$node->id}'", $command);
    }

    public function testCalagopusBackupAdaptersAreExposed()
    {
        $this->assertContains('ddup-bak', Adapters::all_calagopus());
        $this->assertContains('btrfs', Adapters::all_calagopus());
        $this->assertContains('zfs', Adapters::all_calagopus());
        $this->assertContains('restic', Adapters::all_calagopus());
        $this->assertContains('proxmox-backup-server', Adapters::all_calagopus());
        $this->assertContains('kopia', Adapters::all_calagopus());

        $this->assertArrayHasKey('calagopus', Adapters::all_sorted());
    }

    private function createCalagopusNode(): Node
    {
        $location = Location::factory()->create();

        return Node::factory()->create([
            'location_id' => $location->id,
            'daemonType' => 'calagopus',
        ]);
    }
}
