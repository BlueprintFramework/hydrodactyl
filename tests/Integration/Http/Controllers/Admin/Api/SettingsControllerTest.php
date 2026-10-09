<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\Api;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class SettingsControllerTest extends IntegrationTestCase
{
    /**
     * The advanced settings keys that this test writes to the database.
     */
    private const KEYS = [
        'settings::pterodactyl:client_features:schedules:per_schedule_task_limit',
        'settings::pterodactyl:client_features:schedules:stuck_timeout',
    ];

    protected function tearDown(): void
    {
        Setting::query()->whereIn('key', self::KEYS)->delete();
        Cache::forget('pterodactyl:settings:all');

        parent::tearDown();
    }

    /**
     * Test that the schedule settings are exposed with their configured defaults.
     */
    public function testScheduleSettingsAreExposedWithDefaults()
    {
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/settings')
            ->assertOk()
            ->assertJsonPath('advanced.pterodactyl:client_features:schedules:per_schedule_task_limit', 10)
            ->assertJsonPath('advanced.pterodactyl:client_features:schedules:stuck_timeout', 1800);
    }

    /**
     * Test that the schedule settings are validated and persisted.
     */
    public function testScheduleSettingsCanBeUpdated()
    {
        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->patchJson('/admin/api/settings/advanced', [
                'pterodactyl:guzzle:timeout' => 30,
                'pterodactyl:guzzle:connect_timeout' => 10,
                'pterodactyl:client_features:allocations:enabled' => 'false',
                'pterodactyl:client_features:allocations:range_start' => null,
                'pterodactyl:client_features:allocations:range_end' => null,
                'pterodactyl:client_features:groups:enabled' => 'true',
                'pterodactyl:client_features:schedules:per_schedule_task_limit' => 25,
                'pterodactyl:client_features:schedules:stuck_timeout' => 3600,
            ])
            ->assertOk();

        $this->assertDatabaseHas('settings', [
            'key' => self::KEYS[0],
            'value' => '25',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => self::KEYS[1],
            'value' => '3600',
        ]);
    }

    /**
     * Test that the schedule settings reject out of range values.
     */
    public function testScheduleSettingsAreValidated()
    {
        $user = User::factory()->create(['root_admin' => true]);

        $response = $this->actingAs($user)
            ->patchJson('/admin/api/settings/advanced', [
                'pterodactyl:guzzle:timeout' => 30,
                'pterodactyl:guzzle:connect_timeout' => 10,
                'pterodactyl:client_features:allocations:enabled' => 'false',
                'pterodactyl:client_features:allocations:range_start' => null,
                'pterodactyl:client_features:allocations:range_end' => null,
                'pterodactyl:client_features:groups:enabled' => 'true',
                'pterodactyl:client_features:schedules:per_schedule_task_limit' => 0,
                'pterodactyl:client_features:schedules:stuck_timeout' => 900,
            ]);

        $response->assertStatus(422);

        $fields = collect($response->json('errors'))->pluck('meta.source_field')->all();

        $this->assertContains('pterodactyl:client_features:schedules:per_schedule_task_limit', $fields);
        $this->assertContains('pterodactyl:client_features:schedules:stuck_timeout', $fields);
    }
}
