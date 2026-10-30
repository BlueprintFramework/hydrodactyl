<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server;

use Illuminate\Http\Response;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class SettingsControllerTest extends ClientApiIntegrationTestCase
{
    private array $createdNestIds = [];

    private array $createdEggIds = [];

    private function createTestNest(): Nest
    {
        $nest = Nest::factory()->create();
        $this->createdNestIds[] = $nest->id;

        return $nest;
    }

    private function createTestEgg(Nest $nest, array $attributes = []): Egg
    {
        $this->createdNestIds[] = $nest->id;

        $egg = Egg::factory()->for($nest)->create(array_merge([
            'author' => 'admin@example.com',
            'config_stop' => 'stop',
            'config_startup' => '{}',
            'config_logs' => '{}',
            'config_files' => '{}',
        ], $attributes));

        $this->createdEggIds[] = $egg->id;

        return $egg;
    }

    protected function tearDown(): void
    {
        Database::query()->forceDelete();
        DatabaseHost::query()->forceDelete();
        Backup::query()->forceDelete();
        Server::query()->forceDelete();

        EggVariable::query()->whereIn('egg_id', $this->createdEggIds)->forceDelete();
        Egg::query()->whereIn('id', $this->createdEggIds)->forceDelete();
        Nest::query()->whereIn('id', $this->createdNestIds)->forceDelete();

        parent::tearDown();
    }

    /**
     * Test that the server's name can be changed.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('renamePermissionsDataProvider')]
    public function testServerNameCanBeChanged(array $permissions)
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount($permissions);
        $originalName = $server->name;
        $originalDescription = $server->description;

        $response = $this->actingAs($user)->postJson("/api/client/servers/wings/$server->uuid/settings/rename", [
            'name' => '',
            'description' => '',
        ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        $response->assertJsonPath('errors.0.meta.rule', 'required');

        $server = $server->refresh();
        $this->assertSame($originalName, $server->name);
        $this->assertSame($originalDescription, $server->description);

        $this->actingAs($user)
            ->postJson("/api/client/servers/wings/$server->uuid/settings/rename", [
                'name' => 'Test Server Name',
                'description' => 'This is a test server.',
            ])
            ->assertStatus(Response::HTTP_NO_CONTENT);

        $server = $server->refresh();
        $this->assertSame('Test Server Name', $server->name);
        $this->assertSame('This is a test server.', $server->description);
    }

    /**
     * Test that a subuser receives a permissions error if they do not have the required permission
     * and attempt to change the name.
     */
    public function testSubuserCannotChangeServerNameWithoutPermission()
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_WEBSOCKET_CONNECT]);
        $originalName = $server->name;

        $this->actingAs($user)
            ->postJson("/api/client/servers/wings/$server->uuid/settings/rename", [
                'name' => 'Test Server Name',
            ])
            ->assertStatus(Response::HTTP_FORBIDDEN);

        $server = $server->refresh();
        $this->assertSame($originalName, $server->name);
    }

    /**
     * Test that a server can be reinstalled. Honestly this test doesn't do much of anything other
     * than make sure the endpoint works since.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('reinstallPermissionsDataProvider')]
    public function testServerCanBeReinstalled(array $permissions)
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount($permissions);
        $this->assertTrue($server->isInstalled());

        $service = \Mockery::mock(DaemonServerRepository::class);
        $this->app->instance(DaemonServerRepository::class, $service);

        $service->expects('setServer')
            ->with(\Mockery::on(function ($value) use ($server) {
                return $value->uuid === $server->uuid;
            }))
            ->andReturnSelf()
            ->getMock()
            ->expects('reinstall')
            ->andReturnUndefined();

        $this->actingAs($user)->postJson("/api/client/servers/wings/$server->uuid/settings/reinstall")
            ->assertStatus(Response::HTTP_ACCEPTED);

        $server = $server->refresh();
        $this->assertSame(Server::STATUS_INSTALLING, $server->status);
    }

    /**
     * Test that a subuser receives a permissions error if they do not have the required permission
     * and attempt to reinstall a server.
     */
    public function testSubuserCannotReinstallServerWithoutPermission()
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_WEBSOCKET_CONNECT]);

        $this->actingAs($user)
            ->postJson("/api/client/servers/wings/$server->uuid/settings/reinstall")
            ->assertStatus(Response::HTTP_FORBIDDEN);

        $server = $server->refresh();
        $this->assertTrue($server->isInstalled());
    }

    /**
     * Test that changing the egg synchronizes the startup command, the docker
     * image and the server variables with the new egg.
     */
    public function testServerEggCanBeChangedAndVariablesAreSynchronized()
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_STARTUP_SOFTWARE]);

        $nest = $this->createTestNest();
        $egg = $this->createTestEgg($nest, [
            'startup' => 'java -jar new.jar',
            'docker_images' => ['Java 21' => 'ghcr.io/pterodactyl/test:java21'],
        ]);
        $variable = EggVariable::factory()->create([
            'egg_id' => $egg->id,
            'env_variable' => 'NEW_VARIABLE',
            'default_value' => 'default-value',
            'user_viewable' => true,
            'user_editable' => true,
            'rules' => 'required|string',
        ]);

        $this->actingAs($user)
            ->putJson("/api/client/servers/wings/{$server->uuid}/settings/egg", [
                'egg_id' => $egg->id,
                'nest_id' => $nest->id,
            ])
            ->assertStatus(Response::HTTP_NO_CONTENT);

        $server = $server->refresh();

        $this->assertSame($egg->id, $server->egg_id);
        $this->assertSame($nest->id, $server->nest_id);
        $this->assertSame('java -jar new.jar', $server->startup);
        $this->assertSame('ghcr.io/pterodactyl/test:java21', $server->image);

        $this->assertDatabaseHas('server_variables', [
            'server_id' => $server->id,
            'variable_id' => $variable->id,
            'variable_value' => 'default-value',
        ]);
    }

    /**
     * Test that an egg from a different nest cannot be assigned.
     */
    public function testServerEggCannotBeChangedToAnEggOutsideTheNest()
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_STARTUP_SOFTWARE]);

        $nest = $this->createTestNest();
        $egg = $this->createTestEgg($nest, [
            'docker_images' => ['Java 21' => 'ghcr.io/pterodactyl/test:java21'],
        ]);
        $otherNest = $this->createTestNest();

        $this->actingAs($user)
            ->putJson("/api/client/servers/wings/{$server->uuid}/settings/egg", [
                'egg_id' => $egg->id,
                'nest_id' => $otherNest->id,
            ])
            ->assertStatus(Response::HTTP_BAD_REQUEST);
    }

    public function testServerEggCanBeChangedAsynchronouslyWithEmptyVariableDefault()
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount([
            Permission::ACTION_STARTUP_SOFTWARE,
            Permission::ACTION_SETTINGS_REINSTALL,
        ]);

        $nest = $this->createTestNest();
        $egg = $this->createTestEgg($nest, [
            'startup' => 'java -jar new.jar',
            'docker_images' => ['Java 21' => 'ghcr.io/pterodactyl/test:java21'],
        ]);
        $variable = EggVariable::factory()->create([
            'egg_id' => $egg->id,
            'env_variable' => 'REQUIRED_EMPTY',
            'default_value' => '',
            'user_viewable' => true,
            'user_editable' => true,
            'rules' => 'nullable|integer',
        ]);

        $service = \Mockery::mock(DaemonServerRepository::class);
        $this->app->instance(DaemonServerRepository::class, $service);
        $service->expects('setServer')->andReturnSelf()->getMock()->expects('reinstall')->andReturnUndefined();

        $this->actingAs($user)
            ->postJson("/api/client/servers/wings/{$server->uuid}/settings/egg/apply", [
                'egg_id' => $egg->id,
                'nest_id' => $nest->id,
            ])
            ->assertStatus(Response::HTTP_ACCEPTED);

        $server = $server->refresh();
        $this->assertSame($egg->id, $server->egg_id);

        $this->assertDatabaseHas('server_variables', [
            'server_id' => $server->id,
            'variable_id' => $variable->id,
        ]);
    }

    public function testAsyncEggChangeRequiresReinstallPermission()
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_STARTUP_SOFTWARE]);

        $this->actingAs($user)
            ->postJson("/api/client/servers/wings/{$server->uuid}/settings/egg/apply", [
                'egg_id' => $server->egg_id,
                'nest_id' => $server->nest_id,
            ])
            ->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function testWingsOperationEndpointsAreAvailable()
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_STARTUP_SOFTWARE]);

        $this->actingAs($user)
            ->getJson("/api/client/servers/wings/{$server->uuid}/operations")
            ->assertOk()
            ->assertJsonPath('operations', []);
    }

    public static function renamePermissionsDataProvider(): array
    {
        return [[[]], [[Permission::ACTION_SETTINGS_RENAME]]];
    }

    public static function reinstallPermissionsDataProvider(): array
    {
        return [[[]], [[Permission::ACTION_SETTINGS_REINSTALL]]];
    }
}
