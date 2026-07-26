<?php

namespace Pterodactyl\Tests\Unit\Services\Users;

use Mockery\MockInterface;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Services\Users\UserDeletionService;
use Pterodactyl\Contracts\Repository\UserRepositoryInterface;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class UserDeletionServiceTest extends TestCase
{
    private MockInterface $userRepository;
    private MockInterface $serverRepository;
    private MockInterface $translator;
    private UserDeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->userRepository = $this->mock(UserRepositoryInterface::class);
        $this->serverRepository = $this->mock(ServerRepositoryInterface::class);
        $this->translator = $this->mock(Translator::class);

        $this->service = new UserDeletionService(
            $this->userRepository,
            $this->serverRepository,
            $this->translator,
        );
    }

    public function testUserWithNoServersCanBeDeleted()
    {
        $user = User::factory()->make(['id' => 1]);

        $this->userRepository->shouldReceive('find')
            ->with(1)
            ->andReturn($user);

        $this->serverRepository->shouldReceive('setColumns')
            ->with('id')
            ->andReturnSelf();
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['owner_id', '=', 1]])
            ->andReturn(0);

        $this->userRepository->shouldReceive('delete')
            ->with(1)
            ->andReturn(true);

        $result = $this->service->handle(1);

        $this->assertTrue($result);
    }

    public function testUserWithServersCannotBeDeleted()
    {
        $user = User::factory()->make(['id' => 2]);

        $this->userRepository->shouldReceive('find')
            ->with(2)
            ->andReturn($user);

        $this->serverRepository->shouldReceive('setColumns')
            ->with('id')
            ->andReturnSelf();
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['owner_id', '=', 2]])
            ->andReturn(1);

        $this->translator->shouldReceive('get')
            ->with('admin/user.exceptions.user_has_servers')
            ->andReturn('User has servers');

        $this->expectException(DisplayException::class);

        $this->service->handle(2);
    }

    public function testUserByModelCanBeDeleted()
    {
        $user = User::factory()->make(['id' => 3]);

        $this->serverRepository->shouldReceive('setColumns')
            ->with('id')
            ->andReturnSelf();
        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['owner_id', '=', 3]])
            ->andReturn(0);

        $this->userRepository->shouldReceive('delete')
            ->with(3)
            ->andReturn(true);

        $result = $this->service->handle($user);

        $this->assertTrue($result);
    }
}
