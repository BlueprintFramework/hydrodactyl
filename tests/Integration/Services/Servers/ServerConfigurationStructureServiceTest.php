<?php

namespace Pterodactyl\Tests\Integration\Services\Servers;

use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Pterodactyl\Services\Servers\ServerConfigurationStructureService;

class ServerConfigurationStructureServiceTest extends IntegrationTestCase
{
    use DatabaseTransactions;

    public function testCalagopusNodesOmitTheBlockIoWeight()
    {
        config(['calagopus.omit_io_weight' => true]);

        $server = $this->createServerModel(['io' => 500]);
        $server->node->update(['daemonType' => 'calagopus']);

        $config = app(ServerConfigurationStructureService::class)->handle($server);

        $this->assertNull($config['build']['io_weight']);
    }

    public function testWingsNodesKeepTheBlockIoWeight()
    {
        config(['calagopus.omit_io_weight' => true]);

        $server = $this->createServerModel(['io' => 500]);
        $server->node->update(['daemonType' => 'wings']);

        $config = app(ServerConfigurationStructureService::class)->handle($server);

        $this->assertSame(500, $config['build']['io_weight']);
    }

    public function testBlockIoWeightCanBeOptedIntoForCalagopus()
    {
        config(['calagopus.omit_io_weight' => false]);

        $server = $this->createServerModel(['io' => 500]);
        $server->node->update(['daemonType' => 'calagopus']);

        $config = app(ServerConfigurationStructureService::class)->handle($server);

        $this->assertSame(500, $config['build']['io_weight']);
    }
}
