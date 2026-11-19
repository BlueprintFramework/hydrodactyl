<?php

namespace Pterodactyl\Tests\Unit\Services\ServerOperations;

use Carbon\Carbon;
use Mockery;
use Pterodactyl\Models\Backup;
use Pterodactyl\Services\Backups\Calagopus\DeleteBackupService as CalagopusDeleteBackupService;
use Pterodactyl\Services\Backups\Wings\DeleteBackupService as WingsDeleteBackupService;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Services\ServerOperations\SoftwareChangeBackupService;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class SoftwareChangeBackupServiceTest extends IntegrationTestCase
{
    public function testMarkByNameTagsOnlyMatchingBackup(): void
    {
        $server = $this->createServerModel();
        $name = 'Software Change: Paper → Purpur (Nov 12)';

        $other = Backup::factory()->create([
            'server_id' => $server->id,
            'name' => 'User manual backup',
            'is_software_change' => false,
            'is_successful' => true,
            'completed_at' => Carbon::now(),
        ]);

        $target = Backup::factory()->create([
            'server_id' => $server->id,
            'name' => $name,
            'is_software_change' => false,
            'is_successful' => true,
            'completed_at' => Carbon::now(),
        ]);

        $service = new SoftwareChangeBackupService(
            Mockery::mock(WingsDeleteBackupService::class),
            Mockery::mock(CalagopusDeleteBackupService::class),
            Mockery::mock(ElytraJobService::class),
        );

        $service->markByName($server, $name);

        $target->refresh();
        $other->refresh();

        $this->assertTrue($target->is_software_change);
        $this->assertNotNull($target->expires_at);
        $this->assertFalse($other->is_software_change);
        $this->assertNull($other->expires_at);
    }

    public function testMarkBackupSetsSeventyTwoHourExpiry(): void
    {
        $server = $this->createServerModel();
        $backup = Backup::factory()->create([
            'server_id' => $server->id,
            'is_software_change' => false,
            'expires_at' => null,
        ]);

        $service = new SoftwareChangeBackupService(
            Mockery::mock(WingsDeleteBackupService::class),
            Mockery::mock(CalagopusDeleteBackupService::class),
            Mockery::mock(ElytraJobService::class),
        );

        Carbon::setTestNow(Carbon::parse('2026-11-12 12:00:00'));
        $service->markBackup($backup);
        $backup->refresh();

        $this->assertTrue($backup->is_software_change);
        $this->assertTrue($backup->expires_at->equalTo(Carbon::parse('2026-11-15 12:00:00')));
        Carbon::setTestNow();
    }
}
