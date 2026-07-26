<?php

namespace Pterodactyl\Tests\Unit\Services\Backups;

use Mockery\MockInterface;
use Carbon\CarbonImmutable;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Lcobucci\JWT\Token\Plain;
use Pterodactyl\Models\Backup;
use Lcobucci\JWT\Token\DataSet;
use Pterodactyl\Tests\TestCase;
use Lcobucci\JWT\Token\Signature;
use Pterodactyl\Enums\BackupAdapter;
use Pterodactyl\Services\Nodes\NodeJWTService;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Services\Backups\DownloadLinkService;

class DownloadLinkServiceTest extends TestCase
{
    private MockInterface $backupManager;
    private MockInterface $jwtService;
    private DownloadLinkService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->backupManager = $this->mock(BackupManager::class);
        $this->jwtService = $this->mock(NodeJWTService::class);

        $this->service = new DownloadLinkService($this->backupManager, $this->jwtService);
    }

    private function makeToken(string $value = 'token'): Plain
    {
        return new Plain(
            new DataSet([], base64_encode('{}')),
            new DataSet([], base64_encode('{}')),
            new Signature('hash', $value),
        );
    }

    public function testFailedBackupThrowsException()
    {
        $user = User::factory()->make();
        $backup = Backup::factory()->make([
            'is_successful' => false,
            'completed_at' => CarbonImmutable::now(),
            'disk' => BackupAdapter::Wings,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot download a failed backup.');

        $this->service->handle($backup, $user);
    }

    public function testInProgressBackupThrowsException()
    {
        $user = User::factory()->make();
        $backup = Backup::factory()->make([
            'is_successful' => true,
            'completed_at' => null,
            'disk' => BackupAdapter::Wings,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot download backup that is still in progress.');

        $this->service->handle($backup, $user);
    }

    public function testRusticBackupWithoutSnapshotIdThrowsException()
    {
        $user = User::factory()->make();
        $backup = Backup::factory()->make([
            'is_successful' => true,
            'completed_at' => CarbonImmutable::now(),
            'disk' => BackupAdapter::RusticLocal,
            'snapshot_id' => null,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Rustic backup cannot be downloaded: missing snapshot ID.');

        $this->service->handle($backup, $user);
    }

    public function testRusticBackupWithInvalidSnapshotIdLengthThrowsException()
    {
        $user = User::factory()->make();
        $backup = Backup::factory()->make([
            'is_successful' => true,
            'completed_at' => CarbonImmutable::now(),
            'disk' => BackupAdapter::RusticLocal,
            'snapshot_id' => 'too-short',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Rustic backup has invalid snapshot ID format.');

        $this->service->handle($backup, $user);
    }

    public function testS3BackupWithInvalidSizeThrowsException()
    {
        $user = User::factory()->make();
        $backup = Backup::factory()->make([
            'is_successful' => true,
            'completed_at' => CarbonImmutable::now(),
            'disk' => BackupAdapter::S3,
            'bytes' => 0,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('S3 backup has invalid size.');

        $this->service->handle($backup, $user);
    }

    public function testWingsBackupReturnsJwtUrl()
    {
        $user = User::factory()->make(['id' => 1]);

        $node = \Mockery::mock(Node::class)->makePartial();
        $node->shouldReceive('getConnectionAddress')->andReturn('https://node1.example.com:8080');

        $backup = Backup::factory()->make([
            'is_successful' => true,
            'completed_at' => CarbonImmutable::now(),
            'disk' => BackupAdapter::Wings,
            'uuid' => 'backup-uuid-123',
            'snapshot_id' => null,
            'bytes' => 1024,
        ]);

        $server = \Mockery::mock(\stdClass::class);
        $server->uuid = 'server-uuid-456';
        $server->node = $node;
        $backup->server = $server;

        $token = $this->makeToken('jwt-token-string');

        $this->jwtService->shouldReceive('setExpiresAt')
            ->once()
            ->with(\Mockery::type(CarbonImmutable::class))
            ->andReturnSelf();
        $this->jwtService->shouldReceive('setUser')
            ->once()
            ->with($user)
            ->andReturnSelf();
        $this->jwtService->shouldReceive('setClaims')
            ->once()
            ->with(\Mockery::on(function ($claims) use ($backup) {
                return $claims['backup_uuid'] === $backup->uuid;
            }))
            ->andReturnSelf();
        $this->jwtService->shouldReceive('setScopes')
            ->once()
            ->andReturnSelf();
        $this->jwtService->shouldReceive('handle')
            ->once()
            ->with($node, '1server-uuid-456')
            ->andReturn($token);

        $result = $this->service->handle($backup, $user);

        $this->assertStringContainsString('https://node1.example.com:8080/download/backup', $result);
        $this->assertStringContainsString($token->toString(), $result);
    }

    public function testRusticBackupWithValidSnapshotIdReturnsJwtUrl()
    {
        $user = User::factory()->make(['id' => 2]);

        $node = \Mockery::mock(Node::class)->makePartial();
        $node->shouldReceive('getConnectionAddress')->andReturn('https://node2.example.com');

        $backup = Backup::factory()->make([
            'is_successful' => true,
            'completed_at' => CarbonImmutable::now(),
            'disk' => BackupAdapter::RusticS3,
            'uuid' => 'rustic-backup-uuid',
            'snapshot_id' => 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            'bytes' => 2048,
        ]);

        $server = \Mockery::mock(\stdClass::class);
        $server->uuid = 'server-uuid-789';
        $server->node = $node;
        $backup->server = $server;

        $token = $this->makeToken('rustic-jwt-token');

        $this->jwtService->shouldReceive('setExpiresAt')
            ->once()
            ->andReturnSelf();
        $this->jwtService->shouldReceive('setUser')
            ->once()
            ->andReturnSelf();
        $this->jwtService->shouldReceive('setClaims')
            ->once()
            ->andReturnSelf();
        $this->jwtService->shouldReceive('setScopes')
            ->once()
            ->andReturnSelf();
        $this->jwtService->shouldReceive('handle')
            ->once()
            ->andReturn($token);

        $result = $this->service->handle($backup, $user);

        $this->assertStringContainsString('/download/backup', $result);
        $this->assertStringContainsString($token->toString(), $result);
    }
}
