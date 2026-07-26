<?php

namespace Pterodactyl\Tests\Unit\Models;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\ServerTransfer;
use Pterodactyl\Exceptions\Http\Server\ServerStateConflictException;

class ServerTest extends TestCase
{
    public function testIsInstalledReturnsTrueWhenNotInstalling()
    {
        $server = Server::factory()->make(['status' => null]);
        $this->assertTrue($server->isInstalled());
    }

    public function testIsInstalledReturnsTrueWhenStatusIsCompleted()
    {
        $server = Server::factory()->make(['status' => Server::STATUS_SUSPENDED]);
        $this->assertTrue($server->isInstalled());
    }

    public function testIsInstalledReturnsFalseWhenInstalling()
    {
        $server = Server::factory()->make(['status' => Server::STATUS_INSTALLING]);
        $this->assertFalse($server->isInstalled());
    }

    public function testIsInstalledReturnsFalseWhenInstallFailed()
    {
        $server = Server::factory()->make(['status' => Server::STATUS_INSTALL_FAILED]);
        $this->assertFalse($server->isInstalled());
    }

    public function testIsSuspendedReturnsTrueWhenSuspended()
    {
        $server = Server::factory()->make(['status' => Server::STATUS_SUSPENDED]);
        $this->assertTrue($server->isSuspended());
    }

    public function testIsSuspendedReturnsFalseWhenNotSuspended()
    {
        $server = Server::factory()->make(['status' => null]);
        $this->assertFalse($server->isSuspended());
    }

    public function testHasCustomDockerImageReturnsFalseWhenNoEgg()
    {
        $server = Server::factory()->make();
        $server->egg = null;

        $this->assertFalse($server->hasCustomDockerImage());
    }

    public function testHasCustomDockerImageReturnsFalseWhenImageIsInEgg()
    {
        $egg = Egg::factory()->make(['docker_images' => ['java' => 'ghcr.io/pterodactyl/java:latest']]);
        $server = Server::factory()->make(['image' => 'ghcr.io/pterodactyl/java:latest']);
        $server->egg = $egg;

        $this->assertFalse($server->hasCustomDockerImage());
    }

    public function testHasCustomDockerImageReturnsTrueWhenImageIsNotInEgg()
    {
        $egg = Egg::factory()->make(['docker_images' => ['java' => 'ghcr.io/pterodactyl/java:latest']]);
        $server = Server::factory()->make(['image' => 'some/custom-image:latest']);
        $server->egg = $egg;

        $this->assertTrue($server->hasCustomDockerImage());
    }

    public function testHasBackupStorageLimitReturnsTrueWhenSet()
    {
        $server = Server::factory()->make(['backup_storage_limit' => 1024]);
        $this->assertTrue($server->hasBackupStorageLimit());
    }

    public function testHasBackupStorageLimitReturnsFalseWhenNull()
    {
        $server = Server::factory()->make(['backup_storage_limit' => null]);
        $this->assertFalse($server->hasBackupStorageLimit());
    }

    public function testHasBackupStorageLimitReturnsFalseWhenZero()
    {
        $server = Server::factory()->make(['backup_storage_limit' => 0]);
        $this->assertFalse($server->hasBackupStorageLimit());
    }

    public function testGetBackupStorageLimitBytesReturnsNullWhenNoLimit()
    {
        $server = Server::factory()->make(['backup_storage_limit' => null]);
        $this->assertNull($server->getBackupStorageLimitBytes());
    }

    public function testGetBackupStorageLimitBytesConvertsToBytes()
    {
        $server = Server::factory()->make(['backup_storage_limit' => 1024]);
        $this->assertSame(1024 * 1024 * 1024, $server->getBackupStorageLimitBytes());
    }

    public function testHasBackupCountLimitReturnsTrueWhenSet()
    {
        $server = Server::factory()->make(['backup_limit' => 5]);
        $this->assertTrue($server->hasBackupCountLimit());
    }

    public function testHasBackupCountLimitReturnsFalseWhenNull()
    {
        $server = Server::factory()->make(['backup_limit' => null]);
        $this->assertFalse($server->hasBackupCountLimit());
    }

    public function testAllowsBackupsReturnsTrueWhenNull()
    {
        $server = Server::factory()->make(['backup_limit' => null]);
        $this->assertTrue($server->allowsBackups());
    }

    public function testAllowsBackupsReturnsTrueWhenGreaterThanZero()
    {
        $server = Server::factory()->make(['backup_limit' => 5]);
        $this->assertTrue($server->allowsBackups());
    }

    public function testAllowsBackupsReturnsFalseWhenZero()
    {
        $server = Server::factory()->make(['backup_limit' => 0]);
        $this->assertFalse($server->allowsBackups());
    }

    public function testHasDatabaseLimitReturnsTrueWhenSet()
    {
        $server = Server::factory()->make(['database_limit' => 3]);
        $this->assertTrue($server->hasDatabaseLimit());
    }

    public function testAllowsDatabasesReturnsFalseWhenZero()
    {
        $server = Server::factory()->make(['database_limit' => 0]);
        $this->assertFalse($server->allowsDatabases());
    }

    public function testHasAllocationLimitReturnsTrueWhenSet()
    {
        $server = Server::factory()->make(['allocation_limit' => 5]);
        $this->assertTrue($server->hasAllocationLimit());
    }

    public function testAllowsAllocationsReturnsFalseWhenZero()
    {
        $server = Server::factory()->make(['allocation_limit' => 0]);
        $this->assertFalse($server->allowsAllocations());
    }

    public function testSupportsSubdomainsReturnsFalseWhenNoEgg()
    {
        $server = Server::factory()->make();
        $server->egg = null;

        $this->assertFalse($server->supportsSubdomains());
    }

    public function testSupportsSubdomainsReturnsTrueWhenEggHasSubdomainFeature()
    {
        $egg = Egg::factory()->make(['features' => ['subdomain_minecraft']]);
        $server = Server::factory()->make();
        $server->egg = $egg;

        $this->assertTrue($server->supportsSubdomains());
    }

    public function testSupportsSubdomainsReturnsTrueWhenEggHasInheritedSubdomainFeature()
    {
        $parent = Egg::factory()->make(['features' => ['subdomain_minecraft']]);
        $egg = Egg::factory()->make([
            'features' => null,
            'config_from' => 1,
        ]);
        $egg->setRelation('configFrom', $parent);

        $server = Server::factory()->make();
        $server->egg = $egg;

        $this->assertTrue($server->supportsSubdomains());
    }

    public function testSupportsSubdomainsReturnsFalseWhenEggHasNoSubdomainFeature()
    {
        $egg = Egg::factory()->make(['features' => ['eula']]);
        $server = Server::factory()->make();
        $server->egg = $egg;

        $this->assertFalse($server->supportsSubdomains());
    }

    public function testGetSubdomainFeatureReturnsFeatureName()
    {
        $egg = Egg::factory()->make(['features' => ['subdomain_rust']]);
        $server = Server::factory()->make();
        $server->egg = $egg;

        $this->assertSame('subdomain_rust', $server->getSubdomainFeature());
    }

    public function testGetSubdomainFeatureReturnsNullWhenNoFeature()
    {
        $egg = Egg::factory()->make(['features' => ['eula']]);
        $server = Server::factory()->make();
        $server->egg = $egg;

        $this->assertNull($server->getSubdomainFeature());
    }

    public function testValidateCurrentStateThrowsWhenSuspended()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);

        $server = Server::factory()->make(['status' => Server::STATUS_SUSPENDED]);
        $server->node = $node;
        $server->transfer = null;

        $this->expectException(ServerStateConflictException::class);

        $server->validateCurrentState();
    }

    public function testValidateCurrentStateThrowsWhenNodeUnderMaintenance()
    {
        $node = Node::factory()->make(['maintenance_mode' => true]);

        $server = Server::factory()->make(['status' => null]);
        $server->node = $node;
        $server->transfer = null;

        $this->expectException(ServerStateConflictException::class);

        $server->validateCurrentState();
    }

    public function testValidateCurrentStateThrowsWhenRestoringBackup()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);

        $server = Server::factory()->make(['status' => Server::STATUS_RESTORING_BACKUP]);
        $server->node = $node;
        $server->transfer = null;

        $this->expectException(ServerStateConflictException::class);

        $server->validateCurrentState();
    }

    public function testValidateCurrentStateThrowsWhenBeingTransferred()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);

        $server = Server::factory()->make(['status' => null]);
        $server->node = $node;
        $server->transfer = \Mockery::mock(ServerTransfer::class);

        $this->expectException(ServerStateConflictException::class);

        $server->validateCurrentState();
    }

    public function testValidateCurrentStatePassesForNormalServer()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);

        $server = Server::factory()->make(['status' => null]);
        $server->node = $node;
        $server->transfer = null;

        $server->validateCurrentState();

        $this->expectNotToPerformAssertions();
    }

    public function testValidateTransferStateThrowsWhenNotInstalled()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);
        $server = Server::factory()->make(['status' => Server::STATUS_INSTALLING]);
        $server->setRelation('node', $node);

        $this->expectException(ServerStateConflictException::class);

        $server->validateTransferState();
    }

    public function testValidateTransferStateThrowsWhenRestoringBackup()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);
        $server = Server::factory()->make(['status' => Server::STATUS_RESTORING_BACKUP]);
        $server->setRelation('node', $node);

        $this->expectException(ServerStateConflictException::class);

        $server->validateTransferState();
    }

    public function testValidateTransferStateThrowsWhenBeingTransferred()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);
        $server = Server::factory()->make(['status' => null]);
        $server->setRelation('node', $node);
        $server->transfer = \Mockery::mock(ServerTransfer::class);

        $this->expectException(ServerStateConflictException::class);

        $server->validateTransferState();
    }

    public function testValidateTransferStatePassesForNormalServer()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);
        $server = Server::factory()->make(['status' => null]);
        $server->setRelation('node', $node);
        $server->transfer = null;

        $server->validateTransferState();

        $this->expectNotToPerformAssertions();
    }
}
