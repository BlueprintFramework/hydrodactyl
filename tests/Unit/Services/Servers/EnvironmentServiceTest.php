<?php

namespace Pterodactyl\Tests\Unit\Services\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Services\Servers\EnvironmentService;

class EnvironmentServiceTest extends TestCase
{
    private EnvironmentService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = new EnvironmentService();
    }

    public function testEnvironmentVariablesFromEgg()
    {
        $server = Server::factory()->make();

        $var1 = EggVariable::factory()->make([
            'env_variable' => 'BUNGEE_VERSION',
            'server_value' => 'latest',
            'default_value' => '1.0',
        ]);

        $var2 = EggVariable::factory()->make([
            'env_variable' => 'SERVER_JARFILE',
            'server_value' => null,
            'default_value' => 'server.jar',
        ]);

        $server->setRelation('variables', collect([$var1, $var2]));

        $server->setRelation('location', Location::factory()->make(['short' => 'us-nyc']));

        $result = $this->service->handle($server);

        $this->assertArrayHasKey('BUNGEE_VERSION', $result);
        $this->assertArrayHasKey('SERVER_JARFILE', $result);
        $this->assertSame('latest', $result['BUNGEE_VERSION']);
        $this->assertSame('server.jar', $result['SERVER_JARFILE']);
    }

    public function testDefaultEnvironmentMappingsAreIncluded()
    {
        $server = Server::factory()->make([
            'startup' => './start.sh',
            'uuid' => 'test-uuid',
        ]);

        $server->setRelation('location', Location::factory()->make(['short' => 'us-nyc']));
        $server->setRelation('variables', collect([]));

        $result = $this->service->handle($server);

        $this->assertArrayHasKey('STARTUP', $result);
        $this->assertArrayHasKey('P_SERVER_LOCATION', $result);
        $this->assertArrayHasKey('P_SERVER_UUID', $result);
        $this->assertSame('./start.sh', $result['STARTUP']);
        $this->assertSame('us-nyc', $result['P_SERVER_LOCATION']);
        $this->assertSame('test-uuid', $result['P_SERVER_UUID']);
    }

    public function testConfigEnvironmentVariablesAreIncluded()
    {
        config()->set('pterodactyl.environment_variables', [
            'CUSTOM_KEY' => 'name',
        ]);

        $server = Server::factory()->make(['name' => 'MyServer', 'startup' => './start.sh', 'uuid' => 'uuid']);
        $server->setRelation('location', Location::factory()->make(['short' => 'eu']));
        $server->setRelation('variables', collect([]));

        $result = $this->service->handle($server);

        $this->assertArrayHasKey('CUSTOM_KEY', $result);
        $this->assertSame('MyServer', $result['CUSTOM_KEY']);
    }

    public function testClosureConfigVariablesAreExecuted()
    {
        config()->set('pterodactyl.environment_variables', [
            'DYNAMIC_KEY' => function (Server $server) {
                return 'computed-' . $server->id;
            },
        ]);

        $server = Server::factory()->make(['id' => 42, 'startup' => './start.sh', 'uuid' => 'uuid']);
        $server->setRelation('location', Location::factory()->make(['short' => 'eu']));
        $server->setRelation('variables', collect([]));

        $result = $this->service->handle($server);

        $this->assertArrayHasKey('DYNAMIC_KEY', $result);
        $this->assertSame('computed-42', $result['DYNAMIC_KEY']);
    }

    public function testRuntimeAdditionalKeysAreIncluded()
    {
        $server = Server::factory()->make(['startup' => './start.sh', 'uuid' => 'uuid']);
        $server->setRelation('location', Location::factory()->make(['short' => 'eu']));
        $server->setRelation('variables', collect([]));

        $this->service->setEnvironmentKey('RUNTIME_VAR', function () {
            return 'runtime-value';
        });

        $result = $this->service->handle($server);

        $this->assertArrayHasKey('RUNTIME_VAR', $result);
        $this->assertSame('runtime-value', $result['RUNTIME_VAR']);
    }

    public function testRuntimeKeyOverridesEggVariable()
    {
        $server = Server::factory()->make(['startup' => './start.sh', 'uuid' => 'uuid']);
        $server->setRelation('location', Location::factory()->make(['short' => 'eu']));

        $var = EggVariable::factory()->make([
            'env_variable' => 'MY_VAR',
            'server_value' => 'egg-value',
            'default_value' => 'default',
        ]);

        $server->setRelation('variables', collect([$var]));

        $this->service->setEnvironmentKey('MY_VAR', function () {
            return 'runtime-override';
        });

        $result = $this->service->handle($server);

        $this->assertSame('runtime-override', $result['MY_VAR']);
    }

    public function testGetEnvironmentKeysReturnsEmptyArrayByDefault()
    {
        $this->assertSame([], $this->service->getEnvironmentKeys());
    }

    public function testGetEnvironmentKeysReturnsSetKeys()
    {
        $this->service->setEnvironmentKey('KEY1', function () {
            return 'val1';
        });
        $this->service->setEnvironmentKey('KEY2', function () {
            return 'val2';
        });

        $keys = $this->service->getEnvironmentKeys();
        $this->assertCount(2, $keys);
        $this->assertArrayHasKey('KEY1', $keys);
        $this->assertArrayHasKey('KEY2', $keys);
    }
}
