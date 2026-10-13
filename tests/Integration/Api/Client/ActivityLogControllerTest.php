<?php

namespace Pterodactyl\Tests\Integration\Api\Client;

use Carbon\Carbon;
use Pterodactyl\Models\User;
use Pterodactyl\Models\ActivityLog;
use Pterodactyl\Models\ActivityLogSubject;

class ActivityLogControllerTest extends ClientApiIntegrationTestCase
{
    /**
     * Test that the account activity list is returned to the user.
     */
    public function testActivityLogsAreReturned(): void
    {
        $user = User::factory()->create();
        $this->createActivityLogs($user, ['server:power:start', 'server:power:stop']);

        $response = $this->actingAs($user)->getJson('/api/client/account/activity?sort=-timestamp');

        $response->assertOk();
        $events = collect($response->json('data'))->pluck('attributes.event')->all();
        $this->assertSame(['server:power:stop', 'server:power:start'], $events);
        $this->assertSame(2, $response->json('meta.pagination.total'));
    }

    /**
     * Test that the global search filter matches across the event and
     * description columns instead of only filtering the current page.
     */
    public function testGlobalSearchMatchesEventAndDescription(): void
    {
        $user = User::factory()->create();
        $this->createActivityLogs($user, ['server:power:start']);
        $this->createActivityLogs($user, ['server:backup:create'], ['description' => 'Created a backup archive']);

        $this->assertSame(['server:backup:create'], $this->searchEventNames($user, 'backup'));
        $this->assertSame(['server:backup:create'], $this->searchEventNames($user, 'archive'));
    }

    /**
     * Test that the global search filter can match against the actor username.
     */
    public function testGlobalSearchMatchesActorUsername(): void
    {
        $user = User::factory()->create();
        $actor = User::factory()->create(['username' => 'hobbithunter']);

        $this->createActivityLogs($user, ['server:power:start', 'server:power:stop'], ['actor' => $actor]);

        $this->assertSame(['server:power:start', 'server:power:stop'], $this->searchEventNames($user, 'hobbithunter'));
    }

    /**
     * Test that the global search filter can match against the IP address.
     */
    public function testGlobalSearchMatchesIpAddress(): void
    {
        $user = User::factory()->create();
        $this->createActivityLogs($user, ['user:account:email-changed'], ['ip' => '203.0.113.7']);

        $this->assertSame(['user:account:email-changed'], $this->searchEventNames($user, '203.0.113.7'));
    }

    /**
     * Test that the event filter only returns logs matching the given event.
     */
    public function testEventFilterReturnsOnlyMatchingEvent(): void
    {
        $user = User::factory()->create();
        $this->createActivityLogs($user, ['server:power:start', 'server:backup:create']);

        $response = $this->actingAs($user)->getJson('/api/client/account/activity?filter[event]=server:power:start');

        $response->assertOk();
        $events = collect($response->json('data'))->pluck('attributes.event')->all();
        $this->assertSame(['server:power:start'], $events);
    }

    /**
     * Test that the "after" timestamp filter only returns recent activity.
     */
    public function testAfterFilterOnlyReturnsRecentActivity(): void
    {
        $user = User::factory()->create();
        $this->createActivityLogs($user, ['server:power:start'], ['timestamp' => Carbon::now()->subDays(30)]);
        $this->createActivityLogs($user, ['server:backup:create'], ['timestamp' => Carbon::now()->subHour()]);

        $after = urlencode(Carbon::now()->subDays(2)->toIso8601String());

        $response = $this->actingAs($user)->getJson("/api/client/account/activity?filter[after]={$after}");

        $response->assertOk();
        $events = collect($response->json('data'))->pluck('attributes.event')->all();
        $this->assertSame(['server:backup:create'], $events);
    }

    /**
     * Test that the events endpoint returns the distinct, sorted events that
     * exist in the account's activity log and excludes disabled events.
     */
    public function testEventsEndpointReturnsDistinctSortedEvents(): void
    {
        $user = User::factory()->create();
        $this->createActivityLogs($user, [
            'server:power:stop',
            'server:power:start',
            'server:power:start',
            'user:account:email-changed',
            ActivityLog::DISABLED_EVENTS[0],
        ]);

        $response = $this->actingAs($user)->getJson('/api/client/account/activity/events');

        $response->assertOk();
        $this->assertSame(['server:power:start', 'server:power:stop', 'user:account:email-changed'], $response->json());
    }

    /**
     * Test that the events endpoint returns an empty array when there is no
     * activity for the user.
     */
    public function testEventsEndpointIsEmptyWhenNoActivity(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/client/account/activity/events');

        $response->assertOk();
        $this->assertSame([], $response->json());
    }

    /**
     * Runs the global search filter against the account activity endpoint and
     * returns the events present in the response.
     */
    private function searchEventNames(User $user, string $search): array
    {
        $response = $this->actingAs($user)->getJson('/api/client/account/activity?filter[search]=' . urlencode($search));

        $response->assertOk();

        return collect($response->json('data'))->pluck('attributes.event')->all();
    }

    /**
     * Creates activity logs attached (as subjects) to the given user. Logs are
     * created newest-first so a "sort=-timestamp" ordering in tests is stable.
     */
    private function createActivityLogs(User $user, array $events, array $attributes = []): void
    {
        $count = count($events);
        foreach ($events as $index => $event) {
            $actor = $attributes['actor'] ?? $user;

            $log = ActivityLog::query()->create([
                'batch' => null,
                'event' => $event,
                'ip' => $attributes['ip'] ?? '127.0.0.1',
                'description' => $attributes['description'] ?? "A description for {$event}",
                'actor_id' => $actor->id,
                'actor_type' => (new User())->getMorphClass(),
                'properties' => [],
            ]);
            $log->forceFill([
                'timestamp' => $attributes['timestamp'] ?? Carbon::now()->subMinutes($count - $index),
            ])->save();

            ActivityLogSubject::query()->create([
                'activity_log_id' => $log->id,
                'subject_type' => (new User())->getMorphClass(),
                'subject_id' => $user->id,
            ]);
        }
    }
}
