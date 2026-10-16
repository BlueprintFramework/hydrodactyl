<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\Activity;

use Carbon\Carbon;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ActivityLog;
use Pterodactyl\Models\ActivityLogSubject;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class GetServerActivityLogsTest extends ClientApiIntegrationTestCase
{
    /**
     * Test that the server activity list supports the global search filter.
     */
    public function testServerActivityGlobalSearch(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_ACTIVITY_READ]);
        $this->createActivityLogs($server, ['server:power:start', 'server:backup:create']);

        $response = $this->actingAs($user)->getJson($this->link($server, '/activity?filter[search]=' . urlencode('backup')));

        $response->assertOk();
        $events = collect($response->json('data'))->pluck('attributes.event')->all();
        $this->assertSame(['server:backup:create'], $events);
    }

    /**
     * Test that the server activity events endpoint returns the distinct events
     * for the server.
     */
    public function testServerActivityEventsEndpoint(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_ACTIVITY_READ]);
        $this->createActivityLogs($server, ['server:power:stop', 'server:power:start', 'server:power:start']);

        $response = $this->actingAs($user)->getJson($this->link($server, '/activity/events'));

        $response->assertOk();
        $this->assertSame(['server:power:start', 'server:power:stop'], $response->json());
    }

    /**
     * Test that the events endpoint still works correctly when admin activity is
     * hidden, since that code path adds a join onto the users table.
     */
    public function testServerActivityEventsEndpointWithHiddenAdminActivity(): void
    {
        config()->set('activity.hide_admin_activity', true);

        [$user, $server] = $this->generateTestAccount([Permission::ACTION_ACTIVITY_READ]);
        $this->createActivityLogs($server, ['server:power:start', 'server:backup:create']);

        $response = $this->actingAs($user)->getJson($this->link($server, '/activity/events'));

        $response->assertOk();
        $this->assertSame(['server:backup:create', 'server:power:start'], $response->json());
    }

    /**
     * Creates activity logs attached (as subjects) to the given server.
     */
    private function createActivityLogs(Server $server, array $events): void
    {
        foreach ($events as $index => $event) {
            $log = ActivityLog::query()->create([
                'batch' => null,
                'event' => $event,
                'ip' => '127.0.0.1',
                'description' => null,
                'actor_id' => null,
                'actor_type' => null,
                'properties' => [],
            ]);
            $log->forceFill(['timestamp' => Carbon::now()->subMinutes(count($events) - $index)])->save();

            ActivityLogSubject::query()->create([
                'activity_log_id' => $log->id,
                'subject_type' => (new Server())->getMorphClass(),
                'subject_id' => $server->id,
            ]);
        }
    }
}
