<?php

namespace Pterodactyl\Tests\Unit\Services\Backups;

use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Backups\BackupDriverManager;
use Pterodactyl\Services\Backups\Drivers\WingsBackupDriver;

class BackupDriverManagerTest extends TestCase
{
    public function testDefaultDriverComesFromConfig(): void
    {
        config(['backups.default' => BackupAdapter::Wings->value]);

        $manager = $this->app->make(BackupDriverManager::class);

        $this->assertSame(BackupAdapter::Wings->value, $manager->getDefaultDriver());
        $this->assertInstanceOf(WingsBackupDriver::class, $manager->driver());
    }

    public function testS3AdapterResolvesToWingsDriver(): void
    {
        $manager = $this->app->make(BackupDriverManager::class);

        $this->assertInstanceOf(WingsBackupDriver::class, $manager->driver(BackupAdapter::S3->value));
    }

    public function testRusticAdaptersResolveToWingsDriver(): void
    {
        $manager = $this->app->make(BackupDriverManager::class);

        $this->assertInstanceOf(WingsBackupDriver::class, $manager->driver(BackupAdapter::RusticLocal->value));
        $this->assertInstanceOf(WingsBackupDriver::class, $manager->driver(BackupAdapter::RusticS3->value));
    }

    public function testLegacyElytraAdapterNormalizesToWings(): void
    {
        $manager = $this->app->make(BackupDriverManager::class);

        $this->assertSame(BackupAdapter::Wings->value, $manager->normalizeAdapter('elytra'));
        $this->assertSame(BackupAdapter::Wings->value, $manager->normalizeAdapter('local'));
        $this->assertInstanceOf(WingsBackupDriver::class, $manager->driver('elytra'));
    }

    public function testUnsupportedDriverThrows(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->app->make(BackupDriverManager::class)->driver('not-a-real-driver');
    }
}
