<?php

namespace Pterodactyl\Tests\Integration\Api\Client;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Permission;

class ClientControllerTest extends ClientApiIntegrationTestCase
{
    /**
     * Test that only the servers a logged-in user is assigned to are returned by the
     * API endpoint. Obviously there are cases such as being an administrator or being
     * a subuser, but for this test we just want to test a basic scenario and pretend
     * subusers do not exist at all.
     */
    public function testOnlyLoggedInUsersServersAreReturned()
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(3)->create();

        /** @var \Pterodactyl\Models\Server[] $servers */
        $servers = [
            $this->createServerModel(['user_id' => $users[0]->id]),
            $this->createServerModel(['user_id' => $users[1]->id]),
            $this->createServerModel(['user_id' => $users[2]->id]),
        ];

        $response = $this->actingAs($users[0])->getJson('/api/client');

        $response->assertOk();
        $response->assertJsonPath('object', 'list');
        $response->assertJsonPath('data.0.object', Server::RESOURCE_NAME);
        $response->assertJsonPath('data.0.attributes.identifier', $servers[0]->uuidShort);
        $response->assertJsonPath('data.0.attributes.server_owner', true);
        $response->assertJsonPath('meta.pagination.total', 1);
        $response->assertJsonPath('meta.pagination.per_page', 50);
    }

    /**
     * Test that using ?filter[*]=name|uuid returns any server matching that name or UUID
     * with the search filters.
     */
    public function testServersAreFilteredUsingNameAndUuidInformation()
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(2)->create();
        $users[0]->update(['root_admin' => true]);

        /** @var \Pterodactyl\Models\Server[] $servers */
        $servers = [
            $this->createServerModel(['user_id' => $users[0]->id, 'name' => 'Julia']),
            $this->createServerModel(['user_id' => $users[1]->id, 'uuidShort' => '12121212', 'name' => 'Janice']),
            $this->createServerModel(['user_id' => $users[1]->id, 'uuid' => '88788878-12356789', 'external_id' => 'ext123', 'name' => 'Julia']),
            $this->createServerModel(['user_id' => $users[1]->id, 'uuid' => '88788878-abcdefgh', 'name' => 'Jennifer']),
        ];

        $this->actingAs($users[1])->getJson('/api/client?filter[*]=Julia')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[2]->uuidShort);

        $this->actingAs($users[1])->getJson('/api/client?filter[*]=ext123')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[2]->uuidShort);

        $this->actingAs($users[1])->getJson('/api/client?filter[*]=ext123')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[2]->uuidShort);

        $this->actingAs($users[1])->getJson('/api/client?filter[*]=12121212')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[1]->uuidShort);

        $this->actingAs($users[1])->getJson('/api/client?filter[*]=88788878')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[2]->uuidShort)
            ->assertJsonPath('data.1.attributes.identifier', $servers[3]->uuidShort);

        $this->actingAs($users[1])->getJson('/api/client?filter[*]=88788878-abcd')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[3]->uuidShort);

        $this->actingAs($users[0])->getJson('/api/client?filter[*]=Julia&type=admin-all')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $servers[0]->uuidShort)
            ->assertJsonPath('data.1.attributes.identifier', $servers[2]->uuidShort);
    }

    /**
     * Test that using ?filter[*]=:25565 or ?filter[*]=192.168.1.1:25565 returns only those servers
     * with the same allocation for the given user.
     */
    public function testServersAreFilteredUsingAllocationInformation()
    {
        /** @var User $user */
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount();
        $server2 = $this->createServerModel(['user_id' => $user->id, 'node_id' => $server->node_id]);

        $allocation = Allocation::factory()->create(['node_id' => $server->node_id, 'server_id' => $server->id, 'ip' => '192.168.1.1', 'port' => 25565]);
        $allocation2 = Allocation::factory()->create(['node_id' => $server->node_id, 'server_id' => $server2->id, 'ip' => '192.168.1.1', 'port' => 25570]);

        $server->update(['allocation_id' => $allocation->id]);
        $server2->update(['allocation_id' => $allocation2->id]);

        $server->refresh();
        $server2->refresh();

        $this->actingAs($user)->getJson('/api/client?filter[*]=192.168.1.1')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $server->uuidShort)
            ->assertJsonPath('data.1.attributes.identifier', $server2->uuidShort);

        $this->actingAs($user)->getJson('/api/client?filter[*]=192.168.1.1:25565')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $server->uuidShort);

        $this->actingAs($user)->getJson('/api/client?filter[*]=:25570')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $server2->uuidShort);

        $this->actingAs($user)->getJson('/api/client?filter[*]=:255')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.attributes.identifier', $server->uuidShort)
            ->assertJsonPath('data.1.attributes.identifier', $server2->uuidShort);
    }

    /**
     * Test that servers where the user is a subuser are returned by default in the API call.
     */
    public function testServersUserIsASubuserOfAreReturned()
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(3)->create();
        $servers = [
            $this->createServerModel(['user_id' => $users[0]->id]),
            $this->createServerModel(['user_id' => $users[1]->id]),
            $this->createServerModel(['user_id' => $users[2]->id]),
        ];

        // Set user 0 as a subuser of server 1. Thus, we should get two servers
        // back in the response when making the API call as user 0.
        Subuser::query()->create([
            'user_id' => $users[0]->id,
            'server_id' => $servers[1]->id,
            'permissions' => [Permission::ACTION_WEBSOCKET_CONNECT],
        ]);

        $response = $this->actingAs($users[0])->getJson('/api/client');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonPath('data.0.attributes.server_owner', true);
        $response->assertJsonPath('data.0.attributes.identifier', $servers[0]->uuidShort);
        $response->assertJsonPath('data.1.attributes.server_owner', false);
        $response->assertJsonPath('data.1.attributes.identifier', $servers[1]->uuidShort);
    }

    /**
     * Returns only servers that the user owns, not servers they are a subuser of.
     */
    public function testFilterOnlyOwnerServers()
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(3)->create();
        $servers = [
            $this->createServerModel(['user_id' => $users[0]->id]),
            $this->createServerModel(['user_id' => $users[1]->id]),
            $this->createServerModel(['user_id' => $users[2]->id]),
        ];

        // Set user 0 as a subuser of server 1. Thus, we should get two servers
        // back in the response when making the API call as user 0.
        Subuser::query()->create([
            'user_id' => $users[0]->id,
            'server_id' => $servers[1]->id,
            'permissions' => [Permission::ACTION_WEBSOCKET_CONNECT],
        ]);

        $response = $this->actingAs($users[0])->getJson('/api/client?type=owner');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.attributes.server_owner', true);
        $response->assertJsonPath('data.0.attributes.identifier', $servers[0]->uuidShort);
    }

    /**
     * Tests that the permissions from the Panel are returned correctly.
     */
    public function testPermissionsAreReturned()
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/client/permissions')
            ->assertOk()
            ->assertJson([
                'object' => 'system_permissions',
                'attributes' => [
                    'permissions' => Permission::permissions()->toArray(),
                ],
            ]);
    }

    /**
     * Test that only servers a user can access because they are an administrator are returned. This
     * will always exclude any servers they can see because they're the owner or a subuser of the server.
     */
    public function testOnlyAdminLevelServersAreReturned()
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(4)->create();
        $users[0]->update(['root_admin' => true]);

        $servers = [
            $this->createServerModel(['user_id' => $users[0]->id]),
            $this->createServerModel(['user_id' => $users[1]->id]),
            $this->createServerModel(['user_id' => $users[2]->id]),
            $this->createServerModel(['user_id' => $users[3]->id]),
        ];

        Subuser::query()->create([
            'user_id' => $users[0]->id,
            'server_id' => $servers[1]->id,
            'permissions' => [Permission::ACTION_WEBSOCKET_CONNECT],
        ]);

        // Only servers 2 & 3 (0 indexed) should be returned by the API at this point. The user making
        // the request is the owner of server 0, and a subuser of server 1, so they should be excluded.
        $response = $this->actingAs($users[0])->getJson('/api/client?type=admin');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');

        $response->assertJsonPath('data.0.attributes.server_owner', false);
        $response->assertJsonPath('data.0.attributes.identifier', $servers[2]->uuidShort);
        $response->assertJsonPath('data.1.attributes.server_owner', false);
        $response->assertJsonPath('data.1.attributes.identifier', $servers[3]->uuidShort);
    }

    /**
     * Test that all servers a user can access as an admin are returned if using ?filter=admin-all.
     */
    public function testAllServersAreReturnedToAdmin()
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(4)->create();
        $users[0]->update(['root_admin' => true]);

        $servers = [
            $this->createServerModel(['user_id' => $users[0]->id]),
            $this->createServerModel(['user_id' => $users[1]->id]),
            $this->createServerModel(['user_id' => $users[2]->id]),
            $this->createServerModel(['user_id' => $users[3]->id]),
        ];

        Subuser::query()->create([
            'user_id' => $users[0]->id,
            'server_id' => $servers[1]->id,
            'permissions' => [Permission::ACTION_WEBSOCKET_CONNECT],
        ]);

        // All servers should be returned.
        $response = $this->actingAs($users[0])->getJson('/api/client?type=admin-all');

        $response->assertOk();
        $response->assertJsonCount(4, 'data');
    }

    /**
     * Test that no servers get returned if the user requests all admin level servers by using
     * ?type=admin or ?type=admin-all in the request.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('filterTypeDataProvider')]
    public function testNoServersAreReturnedIfAdminFilterIsPassedByRegularUser(string $type)
    {
        /** @var \Pterodactyl\Models\User[] $users */
        $users = User::factory()->times(3)->create();

        $this->createServerModel(['user_id' => $users[0]->id]);
        $this->createServerModel(['user_id' => $users[1]->id]);
        $this->createServerModel(['user_id' => $users[2]->id]);

        $response = $this->actingAs($users[0])->getJson('/api/client?type=' . $type);

        $response->assertOk();
        $response->assertJsonCount(0, 'data');
    }

    /**
     * Test that a subuser without the allocation.read permission is only able to see the primary
     * allocation for the server.
     */
    public function testOnlyPrimaryAllocationIsReturnedToSubuser()
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_WEBSOCKET_CONNECT]);
        $server->allocation->notes = 'Test notes';
        $server->allocation->save();

        Allocation::factory()->times(2)->create([
            'node_id' => $server->node_id,
            'server_id' => $server->id,
        ]);

        $server->refresh();
        $response = $this->actingAs($user)->getJson('/api/client');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.attributes.server_owner', false);
        $response->assertJsonPath('data.0.attributes.uuid', $server->uuid);
        $response->assertJsonCount(1, 'data.0.attributes.relationships.allocations.data');
        $response->assertJsonPath('data.0.attributes.relationships.allocations.data.0.attributes.id', $server->allocation->id);
        $response->assertJsonPath('data.0.attributes.relationships.allocations.data.0.attributes.notes', null);
    }

    public function testServersAreSortedAscendingByName(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->createServerModel(['user_id' => $user->id, 'name' => 'Charlie']);
        $this->createServerModel(['user_id' => $user->id, 'name' => 'Alpha']);
        $this->createServerModel(['user_id' => $user->id, 'name' => 'Bravo']);

        $response = $this->actingAs($user)->getJson('/api/client?sort=name');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
        $response->assertJsonPath('data.0.attributes.name', 'Alpha');
        $response->assertJsonPath('data.1.attributes.name', 'Bravo');
        $response->assertJsonPath('data.2.attributes.name', 'Charlie');
    }

    public function testServersAreSortedDescendingByName(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->createServerModel(['user_id' => $user->id, 'name' => 'Charlie']);
        $this->createServerModel(['user_id' => $user->id, 'name' => 'Alpha']);
        $this->createServerModel(['user_id' => $user->id, 'name' => 'Bravo']);

        $response = $this->actingAs($user)->getJson('/api/client?sort=-name');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
        $response->assertJsonPath('data.0.attributes.name', 'Charlie');
        $response->assertJsonPath('data.1.attributes.name', 'Bravo');
        $response->assertJsonPath('data.2.attributes.name', 'Alpha');
    }

    public function testServersAreSortedByCreationDate(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        // Insert in this PK order: Alpha, Bravo, Charlie.
        $alpha = $this->createServerModel(['user_id' => $user->id, 'name' => 'Alpha']);
        $bravo = $this->createServerModel(['user_id' => $user->id, 'name' => 'Bravo']);
        $charlie = $this->createServerModel(['user_id' => $user->id, 'name' => 'Charlie']);

        // Assign created_at so ASC order (Charlie, Alpha, Bravo) does NOT match
        // insertion/PK order (Alpha, Bravo, Charlie) — otherwise a no-op sort
        // returning rows in PK order would coincidentally satisfy the assertion.
        $charlie->forceFill(['created_at' => now()->subDays(2)])->save(); // oldest
        $alpha->forceFill(['created_at' => now()->subDay()])->save(); // middle
        $bravo->forceFill(['created_at' => now()])->save(); // newest

        $response = $this->actingAs($user)->getJson('/api/client?sort=created_at');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
        $response->assertJsonPath('data.0.attributes.name', 'Charlie');
        $response->assertJsonPath('data.1.attributes.name', 'Alpha');
        $response->assertJsonPath('data.2.attributes.name', 'Bravo');
    }

    public function testFilteringByOwnerId(): void
    {
        // An admin (type=admin-all) can see servers owned by other users, so the
        // owner_id filter actually has to discriminate — without it the visible set
        // is 2; with it the set must narrow to exactly 1. (A non-admin would only
        // ever see their own server, making the filter a no-op and the test a
        // false-green.)
        /** @var User $admin */
        $admin = User::factory()->create(['root_admin' => true]);
        /** @var User[] $owners */
        $owners = User::factory()->times(2)->create();

        $this->createServerModel(['user_id' => $owners[0]->id, 'name' => 'OwnerZero']);
        $this->createServerModel(['user_id' => $owners[1]->id, 'name' => 'OwnerOne']);

        $unfiltered = $this->actingAs($admin)->getJson('/api/client?type=admin-all');
        $unfiltered->assertOk();
        $unfiltered->assertJsonCount(2, 'data');

        $response = $this->actingAs($admin)->getJson(
            '/api/client?type=admin-all&filter[owner_id]=' . $owners[0]->id
        );

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.attributes.name', 'OwnerZero');
    }

    public function testFilteringByNodeId(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $server1 = $this->createServerModel(['user_id' => $user->id, 'name' => 'OnNodeA']);
        $this->createServerModel(['user_id' => $user->id, 'name' => 'OnNodeB']);

        $response = $this->actingAs($user)->getJson(
            '/api/client?filter[node_id]=' . $server1->node_id
        );

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.attributes.name', 'OnNodeA');
    }

    public function testSortingCombinedWithEntityFiltering(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        // Create node and allocations manually so both servers share the same node
        $location = \Pterodactyl\Models\Location::factory()->create();
        $node = \Pterodactyl\Models\Node::factory()->create(['location_id' => $location->id]);

        $allocation1 = Allocation::factory()->create(['node_id' => $node->id]);
        $allocation2 = Allocation::factory()->create(['node_id' => $node->id]);

        $this->createServerModel([
            'user_id' => $user->id,
            'name' => 'Bravo',
            'node_id' => $node->id,
            'allocation_id' => $allocation1->id,
        ]);

        $this->createServerModel([
            'user_id' => $user->id,
            'name' => 'Alpha',
            'node_id' => $node->id,
            'allocation_id' => $allocation2->id,
        ]);

        $response = $this->actingAs($user)->getJson(
            '/api/client?filter[node_id]=' . $node->id . '&sort=name'
        );

        $response->assertOk();
        $response->assertJsonPath('data.0.attributes.name', 'Alpha');
        $response->assertJsonPath('data.1.attributes.name', 'Bravo');
    }

    public function testFilterOptionsEndpointReturnsStructuredData(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->createServerModel(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/client/filter-options');

        $response->assertOk();
        $response->assertJsonStructure([
            'object',
            'attributes' => [
                'owners',
                'nests',
                'eggs',
                'nodes',
            ],
        ]);
        $response->assertJsonPath('object', 'server_filter_options');
    }

    public function testCustomNameSortCombinedWithAllocationSearchFilter(): void
    {
        // Regression for a Postgres-only bug: the custom name sorts used to ORDER BY
        // a LEFT JOINed column, which conflicts with MultiFieldServerFilter's
        // GROUP BY servers.id (added by the IP/port search branch) on PostgreSQL,
        // raising SQLSTATE 42803 -> HTTP 500. MySQL/MariaDB are lenient
        // (ONLY_FULL_GROUP_BY off), so this only fails on the pgsql CI leg.
        /** @var User $user */
        $user = User::factory()->create();

        $server1 = $this->createServerModel(['user_id' => $user->id, 'name' => 'OnPortA']);
        $this->createServerModel(['user_id' => $user->id, 'name' => 'OnPortB']);

        // sort=owner_name (custom sort) + filter[*]=:PORT (allocation search ->
        // allocations join + GROUP BY servers.id). Must not 500, must narrow to 1.
        $response = $this->actingAs($user)->getJson(
            '/api/client?sort=owner_name&filter[*]=:' . $server1->allocation->port
        );

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.attributes.name', 'OnPortA');
    }

    public static function filterTypeDataProvider(): array
    {
        return [['admin'], ['admin-all']];
    }
}
