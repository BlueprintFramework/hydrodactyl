<?php

namespace Pterodactyl\Tests\Unit\Providers;

use Mockery;
use Psr\Log\LoggerInterface;
use Pterodactyl\Models\Setting;
use Pterodactyl\Tests\TestCase;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Providers\SettingsServiceProvider;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class SettingsServiceProviderTest extends TestCase
{
    public function testScheduleSettingsAreAppliedToTheConfiguration()
    {
        Cache::forget('pterodactyl:settings:all');

        $settings = Mockery::mock(SettingsRepositoryInterface::class);
        $settings->shouldReceive('all')->once()->andReturn(collect([
            new Setting([
                'key' => 'settings::pterodactyl:client_features:schedules:per_schedule_task_limit',
                'value' => '25',
            ]),
            new Setting([
                'key' => 'settings::pterodactyl:client_features:schedules:stuck_timeout',
                'value' => '3600',
            ]),
        ]));

        $provider = new SettingsServiceProvider($this->app);
        $provider->boot(
            $this->app->make(ConfigRepository::class),
            $this->app->make(Encrypter::class),
            $this->app->make(LoggerInterface::class),
            $settings,
        );

        $this->assertSame('25', config('pterodactyl.client_features.schedules.per_schedule_task_limit'));
        $this->assertSame('3600', config('pterodactyl.client_features.schedules.stuck_timeout'));
    }
}
