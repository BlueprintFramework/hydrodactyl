<?php

namespace Pterodactyl\Tests\Unit\Services\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Services\Servers\StartupCommandService;

class StartupCommandServiceTest extends TestCase
{
    private StartupCommandService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = new StartupCommandService();
    }

    public function testBasicPlaceholdersAreReplaced()
    {
        $server = Server::factory()->make([
            'memory' => 1024,
            'uuid' => 'test-uuid-1234',
            'name' => 'Test Server',
            'cpu' => 100,
            'startup' => 'java -Xmx{{SERVER_MEMORY}}M -jar server.jar',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '192.168.1.1',
            'port' => 25565,
        ]));

        $server->setRelation('variables', collect([]));

        $result = $this->service->handle($server);

        $this->assertSame('java -Xmx1024M -jar server.jar', $result);
    }

    public function testAllBasicPlaceholdersAreReplaced()
    {
        $server = Server::factory()->make([
            'memory' => 2048,
            'uuid' => 'abc-def-ghi',
            'name' => 'My Server',
            'cpu' => 200,
            'startup' => '{{SERVER_MEMORY}} {{SERVER_IP}} {{SERVER_PORT}} {{SERVER_UUID}} {{SERVER_NAME}} {{SERVER_CPU}}',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '10.0.0.1',
            'port' => 19132,
        ]));

        $server->setRelation('variables', collect([]));

        $result = $this->service->handle($server);

        $this->assertSame('2048 10.0.0.1 19132 abc-def-ghi My Server 200', $result);
    }

    public function testVariablePlaceholdersAreReplaced()
    {
        $server = Server::factory()->make([
            'memory' => 512,
            'uuid' => 'uuid-1',
            'name' => 'Test',
            'cpu' => 50,
            'startup' => './start.sh {{BUNGEE_VERSION}} {{SERVER_JARFILE}}',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '127.0.0.1',
            'port' => 25565,
        ]));

        $var1 = EggVariable::factory()->make([
            'env_variable' => 'BUNGEE_VERSION',
            'user_viewable' => true,
            'server_value' => 'latest',
            'default_value' => '1.0',
        ]);

        $var2 = EggVariable::factory()->make([
            'env_variable' => 'SERVER_JARFILE',
            'user_viewable' => true,
            'server_value' => null,
            'default_value' => 'server.jar',
        ]);

        $server->setRelation('variables', collect([$var1, $var2]));

        $result = $this->service->handle($server);
        $this->assertSame('./start.sh latest server.jar', $result);
    }

    public function testNonViewableVariablesAreHiddenWhenHideFlagIsTrue()
    {
        $server = Server::factory()->make([
            'memory' => 512,
            'uuid' => 'uuid-2',
            'name' => 'Hidden Test',
            'cpu' => 50,
            'startup' => './app {{SECRET_KEY}}',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '127.0.0.1',
            'port' => 25565,
        ]));

        $var = EggVariable::factory()->make([
            'env_variable' => 'SECRET_KEY',
            'user_viewable' => false,
            'server_value' => 'super-secret',
            'default_value' => 'default-secret',
        ]);

        $server->setRelation('variables', collect([$var]));

        $result = $this->service->handle($server, true);
        $this->assertSame('./app [hidden]', $result);
    }

    public function testNonViewableVariablesAreShownWithoutHideFlag()
    {
        $server = Server::factory()->make([
            'memory' => 512,
            'uuid' => 'uuid-3',
            'name' => 'Show Test',
            'cpu' => 50,
            'startup' => './app {{SECRET_KEY}}',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '127.0.0.1',
            'port' => 25565,
        ]));

        $var = EggVariable::factory()->make([
            'env_variable' => 'SECRET_KEY',
            'user_viewable' => false,
            'server_value' => 'super-secret',
            'default_value' => 'default-secret',
        ]);

        $server->setRelation('variables', collect([$var]));

        $result = $this->service->handle($server, false);
        $this->assertSame('./app [hidden]', $result);
    }

    public function testNoStartupReturnsEmptyString()
    {
        $server = Server::factory()->make([
            'memory' => 512,
            'uuid' => 'uuid-4',
            'name' => 'Empty',
            'cpu' => 50,
            'startup' => '',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '127.0.0.1',
            'port' => 25565,
        ]));

        $server->setRelation('variables', collect([]));

        $result = $this->service->handle($server);
        $this->assertSame('', $result);
    }

    public function testVariableWithServerValueUsesServerValue()
    {
        $server = Server::factory()->make([
            'memory' => 512,
            'uuid' => 'uuid-5',
            'name' => 'ServerVal',
            'cpu' => 50,
            'startup' => '{{CUSTOM_VAR}}',
        ]);

        $server->setRelation('allocation', Allocation::factory()->make([
            'ip' => '127.0.0.1',
            'port' => 25565,
        ]));

        $var = EggVariable::factory()->make([
            'env_variable' => 'CUSTOM_VAR',
            'user_viewable' => true,
            'server_value' => 'custom-value',
            'default_value' => 'default-value',
        ]);

        $server->setRelation('variables', collect([$var]));

        $result = $this->service->handle($server);
        $this->assertSame('custom-value', $result);
    }
}
