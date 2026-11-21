<?php

namespace Pterodactyl\Tests\Unit\Services\Files;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Files\FileBlockService;
use Pterodactyl\Tests\TestCase;

class FileBlockServiceTest extends TestCase
{
    private FileBlockService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = new FileBlockService();
    }

    public function testNormalizeCollapsesPathSegments(): void
    {
        $this->assertSame('/plugins/premium.jar', $this->service->normalize('plugins/./premium.jar'));
        $this->assertSame('/plugins/premium.jar', $this->service->normalize('/plugins/foo/../premium.jar'));
        $this->assertSame('/', $this->service->normalize('/'));
        $this->assertSame('/server.properties', $this->service->normalize('\\server.properties'));
    }

    public function testJoinBuildsNormalizedPaths(): void
    {
        $this->assertSame('/plugins/premium.jar', $this->service->join('/plugins', 'premium.jar'));
        $this->assertSame('/premium.jar', $this->service->join('/', 'premium.jar'));
        $this->assertSame('/plugins/nested/file.txt', $this->service->join('/plugins/', '/nested/file.txt'));
    }

    public function testOwnersAndRootAdminsAreExempt(): void
    {
        $owner = User::factory()->make(['id' => 10, 'root_admin' => false]);
        $admin = User::factory()->make(['id' => 11, 'root_admin' => true]);
        $server = Server::factory()->make(['owner_id' => 10]);

        $this->assertTrue($this->service->isExempt($server, $owner));
        $this->assertTrue($this->service->isExempt($server, $admin));
        $this->assertFalse($this->service->isExempt($server, User::factory()->make(['id' => 12, 'root_admin' => false])));
    }

    public function testFilterListingLeavesExemptUsersUntouched(): void
    {
        $owner = User::factory()->make(['id' => 10, 'root_admin' => false]);
        $server = Server::factory()->make(['owner_id' => 10]);
        $items = [
            ['name' => 'premium.jar', 'file' => true],
            ['name' => 'config.yml', 'file' => true],
        ];

        $this->assertSame($items, $this->service->filterListing($server, $owner, '/plugins', $items));
    }
}
