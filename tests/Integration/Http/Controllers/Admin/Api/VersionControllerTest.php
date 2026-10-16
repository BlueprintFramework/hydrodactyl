<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\Api;

use Mockery\MockInterface;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Helpers\SoftwareVersionService;

class VersionControllerTest extends IntegrationTestCase
{
    public function testVersionCheckReportsUpToDate()
    {
        $this->mock(SoftwareVersionService::class, function (MockInterface $mock) {
            $mock->shouldReceive('getPanel')->andReturn('v6.4.1');
            $mock->shouldReceive('isLatestPanel')->andReturn(true);
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/version-check')
            ->assertOk()
            ->assertJsonPath('data.latest', 'v6.4.1')
            ->assertJsonPath('data.up_to_date', true);
    }

    public function testVersionCheckReportsUnknownWhenCdnUnavailable()
    {
        $this->mock(SoftwareVersionService::class, function (MockInterface $mock) {
            $mock->shouldReceive('getPanel')->andReturn('error');
        });

        $user = User::factory()->create(['root_admin' => true]);

        $this->actingAs($user)
            ->getJson('/admin/api/version-check')
            ->assertOk()
            ->assertJsonPath('data.latest', null)
            ->assertJsonPath('data.up_to_date', null);
    }
}
