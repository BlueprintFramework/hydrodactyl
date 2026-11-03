<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\CustomDomain;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ServerCustomDomain;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Pterodactyl\Services\Dns\Providers\CloudflareProvider;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class CustomDomainControllerTest extends ClientApiIntegrationTestCase
{
    private FakeCloudflareProvider $cloudflare;

    public function setUp(): void
    {
        parent::setUp();

        $this->cloudflare = new FakeCloudflareProvider();
        $this->app->bind(CloudflareProvider::class, fn () => $this->cloudflare);
    }

    /**
     * Test that adding a custom domain creates its DNS records immediately,
     * on the port the user picked, and never exposes the API token.
     */
    public function testCustomDomainIsCreatedWithDnsRecords()
    {
        [$user, $server] = $this->generateServerWithCustomDomains();

        $extra = Allocation::factory()->create([
            'server_id' => $server->id,
            'node_id' => $server->node_id,
            'ip' => '203.0.113.9',
            'port' => 25580,
        ]);

        $this->actingAs($user);

        // With no port picked the domain points at the primary allocation.
        $this->postJson($this->endpoint($server), [
            'hostname' => 'Play.Purrfect.test',
            'api_token' => 'secret-token',
        ])
            ->assertCreated()
            ->assertJsonPath('data.hostname', 'play.purrfect.test')
            ->assertJsonPath('data.zone_name', 'purrfect.test')
            ->assertJsonPath('data.ip', '203.0.113.5')
            ->assertJsonPath('data.port', 25565)
            ->assertJsonMissingPath('data.dns_config');

        $this->assertSame([
            ['name' => 'play.purrfect.test', 'type' => 'A', 'content' => '203.0.113.5'],
            ['name' => '_minecraft._tcp.play.purrfect.test', 'type' => 'SRV', 'content' => 'SRV 0 5 25565 play.purrfect.test'],
        ], $this->cloudflare->summary());

        $stored = DB::table('server_custom_domains')->where('hostname', 'play.purrfect.test')->first();
        $this->assertNull($stored->allocation_id);
        $this->assertStringNotContainsString('secret-token', $stored->dns_config);

        // A server is limited to a single custom domain.
        $this->postJson($this->endpoint($server), [
            'hostname' => 'purrfect.test',
            'api_token' => 'secret-token',
            'allocation_id' => $extra->id,
        ])->assertStatus(400);

        $this->getJson($this->endpoint($server))
            ->assertOk()
            ->assertJsonPath('enabled', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonMissingPath('data.0.dns_config');
    }

    /**
     * Test that editing a custom domain moves its DNS records to the new name
     * and allocation without needing the API token again.
     */
    public function testCustomDomainCanBeEdited()
    {
        [$user, $server] = $this->generateServerWithCustomDomains();

        $extra = Allocation::factory()->create([
            'server_id' => $server->id,
            'node_id' => $server->node_id,
            'ip' => '203.0.113.9',
            'port' => 25580,
        ]);

        $id = $this->actingAs($user)
            ->postJson($this->endpoint($server), ['hostname' => 'play.purrfect.test', 'api_token' => 'secret-token'])
            ->assertCreated()
            ->json('data.id');

        // Same name, different allocation: the existing records are updated in place.
        $this->patchJson($this->endpoint($server, $id), ['subdomain' => 'play', 'allocation_id' => $extra->id])
            ->assertOk()
            ->assertJsonPath('data.hostname', 'play.purrfect.test')
            ->assertJsonPath('data.ip', '203.0.113.9')
            ->assertJsonPath('data.port', 25580);

        $this->assertSame([
            ['name' => 'play.purrfect.test', 'type' => 'A', 'content' => '203.0.113.9'],
            ['name' => '_minecraft._tcp.play.purrfect.test', 'type' => 'SRV', 'content' => 'SRV 0 5 25580 play.purrfect.test'],
        ], $this->cloudflare->summary());

        // An empty subdomain moves the records to the root of the domain.
        $this->patchJson($this->endpoint($server, $id), ['subdomain' => '', 'allocation_id' => $extra->id])
            ->assertOk()
            ->assertJsonPath('data.hostname', 'purrfect.test');

        $this->assertSame([
            ['name' => 'purrfect.test', 'type' => 'A', 'content' => '203.0.113.9'],
            ['name' => '_minecraft._tcp.purrfect.test', 'type' => 'SRV', 'content' => 'SRV 0 5 25580 purrfect.test'],
        ], $this->cloudflare->summary());

        // A token that has since been revoked is reported as such, not as an outage.
        $this->cloudflare->rejectToken = true;
        $response = $this->patchJson($this->endpoint($server, $id), ['subdomain' => '', 'allocation_id' => $server->allocation_id])
            ->assertStatus(400);
        $this->assertStringContainsString('rejected the API token', $response->json('errors.0.detail'));
        $this->cloudflare->rejectToken = false;

        // A name that already has an address record is refused and nothing changes.
        $this->cloudflare->createRecord('purrfect.test', 'taken.purrfect.test', 'A', '198.51.100.1');
        $this->patchJson($this->endpoint($server, $id), ['subdomain' => 'taken'])->assertStatus(400);
        $this->patchJson($this->endpoint($server, $id), ['subdomain' => 'not valid!'])->assertUnprocessable();

        $this->assertDatabaseHas('server_custom_domains', ['id' => $id, 'hostname' => 'purrfect.test']);
        $this->assertCount(3, $this->cloudflare->summary());
    }

    /**
     * Test that a custom domain can only be added when the egg, the node, the
     * server and the server's owner all allow it, and only on Minecraft eggs.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('gateDataProvider')]
    public function testCustomDomainsCanBeTurnedOff(string $gate)
    {
        [$user, $server] = $this->generateServerWithCustomDomains();

        match ($gate) {
            'egg' => $server->egg->update(['features' => ['subdomain_minecraft']]),
            'game' => $server->egg->update(['features' => ['subdomain_teamspeak', 'user_domains']]),
            'node' => $server->node->update(['custom_domains_enabled' => false]),
            'server' => $server->update(['custom_domains_enabled' => false]),
            'owner' => $user->update(['custom_domains' => false]),
        };

        $this->actingAs($user);

        $this->getJson($this->endpoint($server))->assertOk()->assertJsonPath('enabled', false);

        $this->postJson($this->endpoint($server), [
            'hostname' => 'play.purrfect.test',
            'api_token' => 'secret-token',
        ])->assertStatus(400);

        $this->assertSame([], $this->cloudflare->summary());
        $this->assertDatabaseMissing('server_custom_domains', ['server_id' => $server->id]);
    }

    public static function gateDataProvider(): array
    {
        return [['egg'], ['game'], ['node'], ['server'], ['owner']];
    }

    /**
     * Test that subusers need the custom domain permissions, and that what
     * counts is the server owner being allowed custom domains, not the subuser.
     */
    public function testSubuserPermissionsAreRespected()
    {
        [, $server] = $this->generateServerWithCustomDomains();

        $reader = $this->createSubuser($server, [Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_READ]);
        $editor = $this->createSubuser($server, [Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_READ, Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_UPDATE]);
        $other = $this->createSubuser($server, [Permission::ACTION_ALLOCATION_READ]);

        $payload = ['hostname' => 'play.purrfect.test', 'api_token' => 'secret-token'];

        $this->actingAs($other)->getJson($this->endpoint($server))->assertForbidden();
        $this->actingAs($reader)->getJson($this->endpoint($server))->assertOk();
        $this->actingAs($reader)->postJson($this->endpoint($server), $payload)->assertForbidden();

        $id = $this->actingAs($editor)
            ->postJson($this->endpoint($server), $payload)
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($reader)->patchJson($this->endpoint($server, $id), ['subdomain' => 'map'])->assertForbidden();
        $this->actingAs($reader)->deleteJson($this->endpoint($server, $id))->assertForbidden();
        $this->actingAs($editor)->deleteJson($this->endpoint($server, $id))->assertNoContent();

        $this->assertSame([], $this->cloudflare->summary());
        $this->assertDatabaseMissing('server_custom_domains', ['id' => $id]);
    }

    /**
     * Test that nothing is created when Cloudflare rejects the token, does not
     * have the domain, or the name already has an address record.
     */
    public function testCustomDomainIsRejectedWhenCloudflareCannotServeIt()
    {
        [$user, $server] = $this->generateServerWithCustomDomains();

        $this->actingAs($user);

        $this->postJson($this->endpoint($server), [
            'hostname' => 'play.unknown.test',
            'api_token' => 'secret-token',
        ])->assertStatus(400);

        $this->cloudflare->rejectToken = true;
        $this->postJson($this->endpoint($server), [
            'hostname' => 'play.purrfect.test',
            'api_token' => 'bad-token',
        ])->assertStatus(400);
        $this->cloudflare->rejectToken = false;

        $this->cloudflare->createRecord('purrfect.test', 'play.purrfect.test', 'A', '198.51.100.1');
        $this->postJson($this->endpoint($server), [
            'hostname' => 'play.purrfect.test',
            'api_token' => 'secret-token',
        ])->assertStatus(400);

        $this->assertSame(
            [['name' => 'play.purrfect.test', 'type' => 'A', 'content' => '198.51.100.1']],
            $this->cloudflare->summary()
        );
        $this->assertDatabaseMissing('server_custom_domains', ['server_id' => $server->id]);
    }

    /**
     * Test that the DNS records follow the server when its address or port
     * changes, or when a different allocation becomes the primary one.
     */
    public function testDnsRecordsFollowAllocationChanges()
    {
        [$user, $server] = $this->generateServerWithCustomDomains();

        $this->actingAs($user)->postJson($this->endpoint($server), [
            'hostname' => 'play.purrfect.test',
            'api_token' => 'secret-token',
        ])->assertCreated();

        $server->allocation->update(['ip' => '1.2.3.4']);

        $this->assertSame([
            ['name' => 'play.purrfect.test', 'type' => 'A', 'content' => '1.2.3.4'],
            ['name' => '_minecraft._tcp.play.purrfect.test', 'type' => 'SRV', 'content' => 'SRV 0 5 25565 play.purrfect.test'],
        ], $this->cloudflare->summary());

        $server->allocation->update(['port' => 25570]);

        $this->assertSame([
            ['name' => 'play.purrfect.test', 'type' => 'A', 'content' => '1.2.3.4'],
            ['name' => '_minecraft._tcp.play.purrfect.test', 'type' => 'SRV', 'content' => 'SRV 0 5 25570 play.purrfect.test'],
        ], $this->cloudflare->summary());

        $replacement = Allocation::factory()->create([
            'server_id' => $server->id,
            'node_id' => $server->node_id,
            'ip' => '5.6.7.8',
            'port' => 25590,
        ]);
        $server->update(['allocation_id' => $replacement->id]);

        $this->assertSame([
            ['name' => 'play.purrfect.test', 'type' => 'A', 'content' => '5.6.7.8'],
            ['name' => '_minecraft._tcp.play.purrfect.test', 'type' => 'SRV', 'content' => 'SRV 0 5 25590 play.purrfect.test'],
        ], $this->cloudflare->summary());
    }

    /**
     * Test that a custom domain on another server cannot be removed, and that
     * deleting a server cleans up the DNS records of its custom domains.
     */
    public function testCustomDomainsAreScopedToTheirServer()
    {
        [$user, $server] = $this->generateServerWithCustomDomains();
        [$user2, $server2] = $this->generateServerWithCustomDomains();

        $id = $this->actingAs($user2)
            ->postJson($this->endpoint($server2), [
                'hostname' => 'play.purrfect.test',
                'api_token' => 'secret-token',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($user)->deleteJson($this->endpoint($server, $id))->assertNotFound();
        $this->actingAs($user)->postJson($this->endpoint($server), [
            'hostname' => 'play.purrfect.test',
            'api_token' => 'secret-token',
        ])->assertUnprocessable();

        $this->assertCount(2, $this->cloudflare->summary());

        $server2->delete();

        $this->assertSame([], $this->cloudflare->summary());
    }

    /**
     * Test that a custom domain and its DNS records are removed when the
     * server is moved to software that isn't Minecraft.
     */
    public function testCustomDomainIsRemovedWhenServerIsNoLongerMinecraft()
    {
        [$user, $server] = $this->generateServerWithCustomDomains();

        $this->actingAs($user)->postJson($this->endpoint($server), [
            'hostname' => 'play.purrfect.test',
            'api_token' => 'secret-token',
        ])->assertCreated();

        $this->assertCount(2, $this->cloudflare->summary());

        $egg = $this->cloneEggAndVariables($server->egg);
        $egg->update(['features' => ['subdomain_teamspeak', 'user_domains']]);
        $server->update(['egg_id' => $egg->id]);

        $this->assertSame([], $this->cloudflare->summary());
        $this->assertDatabaseMissing('server_custom_domains', ['server_id' => $server->id]);
    }

    /**
     * Create a server that satisfies every requirement for custom domains,
     * with a primary allocation on the default Minecraft port.
     *
     * @return array{\Pterodactyl\Models\User, \Pterodactyl\Models\Server}
     */
    private function generateServerWithCustomDomains(): array
    {
        /** @var Server $server */
        [$user, $server] = $this->generateTestAccount();

        $user->update(['custom_domains' => true]);

        // Clone the egg so changing its features can't leak into other tests.
        $egg = $this->cloneEggAndVariables($server->egg);
        $egg->update(['features' => ['subdomain_minecraft', 'user_domains']]);

        $server->update(['egg_id' => $egg->id]);
        $server->allocation->update(['ip' => '203.0.113.5', 'port' => 25565]);

        return [$user, $server->refresh()];
    }

    private function endpoint(Server $server, ?int $id = null): string
    {
        return "/api/client/servers/$server->uuid/custom-domains" . ($id ? "/$id" : '');
    }

    private function createSubuser(Server $server, array $permissions): User
    {
        $user = User::factory()->create();

        Subuser::query()->create([
            'user_id' => $user->id,
            'server_id' => $server->id,
            'permissions' => $permissions,
        ]);

        return $user;
    }
}

/**
 * Stands in for Cloudflare, keeping the records it is asked to manage in memory.
 */
class FakeCloudflareProvider extends CloudflareProvider
{
    public bool $rejectToken = false;

    private array $zones = ['purrfect.test' => 'zone-purrfect'];

    private array $records = [];

    private int $nextId = 1;

    public function __construct()
    {
        parent::__construct([]);
    }

    public function findZone(string $hostname): ?array
    {
        if ($this->rejectToken) {
            throw DnsProviderException::connectionFailed('cloudflare', self::TOKEN_REJECTED);
        }

        foreach ($this->zones as $name => $id) {
            if ($hostname === $name || str_ends_with($hostname, '.' . $name)) {
                return ['id' => $id, 'name' => $name];
            }
        }

        return null;
    }

    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        return array_values(array_filter(
            $this->records,
            fn (array $record) => (!$name || $record['name'] === $name) && (!$type || $record['type'] === $type)
        ));
    }

    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $id = 'record-' . $this->nextId++;
        $this->records[$id] = ['name' => $name, 'type' => $type, 'content' => $this->flatten($content)];

        return $id;
    }

    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        if ($this->rejectToken) {
            throw DnsProviderException::recordUpdateFailed($domain, [$recordId], self::TOKEN_REJECTED);
        }

        $this->records[$recordId]['content'] = $this->flatten($content);

        return true;
    }

    public function deleteRecord(string $domain, string $recordId): void
    {
        unset($this->records[$recordId]);
    }

    /**
     * The records currently held, without their IDs.
     */
    public function summary(): array
    {
        return array_values($this->records);
    }

    private function flatten(mixed $content): string
    {
        return is_array($content) ? $content['content'] : $content;
    }
}
