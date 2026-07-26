<?php

namespace Pterodactyl\Tests\Unit\Models;

use Pterodactyl\Models\Backup;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Enums\BackupAdapter;

class BackupTest extends TestCase
{
    public function testIsRusticReturnsFalseForWingsBackup()
    {
        $backup = new Backup(['disk' => BackupAdapter::Wings, 'bytes' => 1024]);
        $this->assertFalse($backup->isRustic());
    }

    public function testIsRusticReturnsTrueForRusticLocal()
    {
        $backup = new Backup(['disk' => BackupAdapter::RusticLocal]);
        $this->assertTrue($backup->isRustic());
    }

    public function testIsRusticReturnsTrueForRusticS3()
    {
        $backup = new Backup(['disk' => BackupAdapter::RusticS3]);
        $this->assertTrue($backup->isRustic());
    }

    public function testIsLocalReturnsTrueForWings()
    {
        $backup = new Backup(['disk' => BackupAdapter::Wings]);
        $this->assertTrue($backup->isLocal());
    }

    public function testIsLocalReturnsFalseForS3()
    {
        $backup = new Backup(['disk' => BackupAdapter::S3]);
        $this->assertFalse($backup->isLocal());
    }

    public function testIsLocalReturnsTrueForRusticLocal()
    {
        $backup = new Backup(['disk' => BackupAdapter::RusticLocal]);
        $this->assertTrue($backup->isLocal());
    }

    public function testGetRepositoryTypeReturnsLocalForRusticLocal()
    {
        $backup = new Backup(['disk' => BackupAdapter::RusticLocal]);
        $this->assertSame('local', $backup->getRepositoryType());
    }

    public function testGetRepositoryTypeReturnsS3ForRusticS3()
    {
        $backup = new Backup(['disk' => BackupAdapter::RusticS3]);
        $this->assertSame('s3', $backup->getRepositoryType());
    }

    public function testGetRepositoryTypeReturnsNullForWings()
    {
        $backup = new Backup(['disk' => BackupAdapter::Wings]);
        $this->assertNull($backup->getRepositoryType());
    }

    public function testHasSnapshotIdReturnsTrueWhenSet()
    {
        $backup = new Backup(['snapshot_id' => 'abc123']);
        $this->assertTrue($backup->hasSnapshotId());
    }

    public function testHasSnapshotIdReturnsFalseWhenEmpty()
    {
        $backup = new Backup(['snapshot_id' => '']);
        $this->assertFalse($backup->hasSnapshotId());
    }

    public function testHasSnapshotIdReturnsFalseWhenNull()
    {
        $backup = new Backup(['snapshot_id' => null]);
        $this->assertFalse($backup->hasSnapshotId());
    }

    public function testGetSizeGbAttribute()
    {
        $backup = new Backup(['bytes' => 1073741824]);
        $this->assertSame(1.0, $backup->getSizeGbAttribute());
    }

    public function testGetSizeGbAttributeForLargeValue()
    {
        $backup = new Backup(['bytes' => 5368709120]);
        $this->assertSame(5.0, $backup->getSizeGbAttribute());
    }
}
