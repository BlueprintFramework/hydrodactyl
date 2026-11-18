<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\File;

use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ServerFileBlock;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Models\User;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class FileBlockControllerTest extends ClientApiIntegrationTestCase
{
    public function testOwnerCanCreateListAndDeleteFileBlocks(): void
    {
        [$owner, $server] = $this->generateTestAccount();
        $subuser = User::factory()->create();
        Subuser::factory()->create([
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'permissions' => [Permission::ACTION_FILE_READ, Permission::ACTION_FILE_READ_CONTENT],
        ]);

        $update = $this->actingAs($owner)->putJson($this->link($server, '/file-blocks'), [
            'path' => '/plugins/premium.jar',
            'user_uuids' => [$subuser->uuid],
        ]);

        $update->assertOk();
        $update->assertJsonPath('data.0.attributes.path', '/plugins/premium.jar');
        $update->assertJsonPath('data.0.attributes.user_uuid', $subuser->uuid);

        $this->assertDatabaseHas('server_file_blocks', [
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'path' => '/plugins/premium.jar',
        ]);

        $list = $this->actingAs($owner)->getJson($this->link($server, '/file-blocks'));
        $list->assertOk();
        $list->assertJsonCount(1, 'data');

        $delete = $this->actingAs($owner)->deleteJson($this->link($server, '/file-blocks'), [
            'path' => '/plugins/premium.jar',
            'user_uuid' => $subuser->uuid,
        ]);
        $delete->assertNoContent();

        $this->assertDatabaseMissing('server_file_blocks', [
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'path' => '/plugins/premium.jar',
        ]);
    }

    public function testSubuserCannotManageFileBlocks(): void
    {
        [$owner, $server] = $this->generateTestAccount();
        $subuser = User::factory()->create();
        Subuser::factory()->create([
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'permissions' => [
                Permission::ACTION_FILE_READ,
                Permission::ACTION_USER_READ,
                Permission::ACTION_USER_UPDATE,
            ],
        ]);

        $this->actingAs($subuser)->getJson($this->link($server, '/file-blocks'))->assertForbidden();
        $this->actingAs($subuser)->putJson($this->link($server, '/file-blocks'), [
            'path' => '/plugins/premium.jar',
            'user_uuids' => [$subuser->uuid],
        ])->assertForbidden();
    }

    public function testCannotBlockUserWhoIsNotASubuser(): void
    {
        [$owner, $server] = $this->generateTestAccount();
        $stranger = User::factory()->create();

        $this->actingAs($owner)->putJson($this->link($server, '/file-blocks'), [
            'path' => '/plugins/premium.jar',
            'user_uuids' => [$stranger->uuid],
        ])->assertUnprocessable();
    }

    public function testBlockedSubuserCannotListOrDownloadFile(): void
    {
        [$owner, $server] = $this->generateTestAccount();
        $subuser = User::factory()->create();
        Subuser::factory()->create([
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'permissions' => [Permission::ACTION_FILE_READ, Permission::ACTION_FILE_READ_CONTENT],
        ]);

        ServerFileBlock::query()->create([
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'path' => '/plugins/premium.jar',
        ]);

        $this->instance(DaemonFileRepository::class, $mock = \Mockery::mock(DaemonFileRepository::class));
        $mock->expects('setServer')->with(\Mockery::on(fn ($s) => $s->id === $server->id))->andReturnSelf();
        $mock->expects('getDirectory')->with('/plugins')->andReturn([
            [
                'name' => 'premium.jar',
                'mode' => '-rw-r--r--',
                'mode_bits' => '644',
                'size' => 10,
                'file' => true,
                'symlink' => false,
                'mime' => 'application/java-archive',
                'created' => now()->toIso8601String(),
                'modified' => now()->toIso8601String(),
            ],
            [
                'name' => 'config.yml',
                'mode' => '-rw-r--r--',
                'mode_bits' => '644',
                'size' => 2,
                'file' => true,
                'symlink' => false,
                'mime' => 'text/yaml',
                'created' => now()->toIso8601String(),
                'modified' => now()->toIso8601String(),
            ],
        ]);

        $listing = $this->actingAs($subuser)->getJson($this->link($server, '/files/list') . '?directory=/plugins');
        $listing->assertOk();
        $names = collect($listing->json('data'))->pluck('attributes.name')->all();
        $this->assertSame(['config.yml'], $names);

        $this->actingAs($subuser)
            ->getJson($this->link($server, '/files/download') . '?file=/plugins/premium.jar')
            ->assertForbidden();

        $this->actingAs($owner)
            ->getJson($this->link($server, '/files/download') . '?file=/plugins/premium.jar')
            ->assertOk();
    }

    public function testDirectoryBlockDeniesDescendants(): void
    {
        [$owner, $server] = $this->generateTestAccount();
        $subuser = User::factory()->create();
        Subuser::factory()->create([
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'permissions' => [Permission::ACTION_FILE_READ, Permission::ACTION_FILE_READ_CONTENT],
        ]);

        ServerFileBlock::query()->create([
            'server_id' => $server->id,
            'user_id' => $subuser->id,
            'path' => '/plugins/premium',
        ]);

        $this->actingAs($subuser)
            ->getJson($this->link($server, '/files/contents') . '?file=/plugins/premium/secret.txt')
            ->assertForbidden();
    }
}
