<?php

namespace Pterodactyl\Tests\Unit\Services\Users;

use Mockery\MockInterface;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\TestCase;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Auth\PasswordBroker;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Contracts\Repository\UserRepositoryInterface;

class UserCreationServiceTest extends TestCase
{
    private MockInterface $connection;
    private MockInterface $hasher;
    private MockInterface $passwordBroker;
    private MockInterface $repository;
    private UserCreationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->connection = $this->mock(ConnectionInterface::class);
        $this->hasher = $this->mock(Hasher::class);
        $this->passwordBroker = $this->mock(PasswordBroker::class);
        $this->repository = $this->mock(UserRepositoryInterface::class);

        $this->service = new UserCreationService(
            $this->connection,
            $this->hasher,
            $this->passwordBroker,
            $this->repository,
        );
    }

    public function testUserIsCreatedWithProvidedPassword()
    {
        $data = [
            'email' => 'test@example.com',
            'username' => 'testuser',
            'password' => 'my-password',
            'name_first' => 'Test',
            'name_last' => 'User',
        ];

        $this->hasher->shouldReceive('make')
            ->with('my-password')
            ->andReturn('hashed-password');

        $this->connection->shouldReceive('beginTransaction')
            ->once()
            ->andReturnTrue();
        $this->connection->shouldReceive('commit')
            ->once()
            ->andReturnTrue();

        $this->repository->shouldReceive('create')
            ->once()
            ->with(
                \Mockery::on(function ($data) {
                    return $data['email'] === 'test@example.com'
                        && $data['password'] === 'hashed-password'
                        && !is_null($data['uuid']);
                }),
                true,
                true
            )
            ->andReturn(new User());

        \Illuminate\Support\Facades\Notification::fake();

        $result = $this->service->handle($data);

        $this->assertInstanceOf(User::class, $result);
    }

    public function testUserIsCreatedWithGeneratedPassword()
    {
        $data = [
            'email' => 'test2@example.com',
            'username' => 'testuser2',
            'name_first' => 'Test2',
            'name_last' => 'User2',
        ];

        $this->hasher->shouldReceive('make')
            ->once()
            ->andReturn('hashed-generated-password');

        $this->connection->shouldReceive('beginTransaction')
            ->once()
            ->andReturnTrue();
        $this->connection->shouldReceive('commit')
            ->once()
            ->andReturnTrue();

        $this->passwordBroker->shouldReceive('createToken')
            ->once()
            ->with(\Mockery::type(User::class))
            ->andReturn('reset-token');

        $this->repository->shouldReceive('create')
            ->once()
            ->with(
                \Mockery::on(function ($data) {
                    return true;
                }),
                true,
                true
            )
            ->andReturn(new User());

        \Illuminate\Support\Facades\Notification::fake();

        $result = $this->service->handle($data);

        $this->assertInstanceOf(User::class, $result);
    }

    public function testUserIsCreatedWithRootAdminFlag()
    {
        $data = [
            'email' => 'admin@example.com',
            'username' => 'admin',
            'password' => 'admin-pass',
            'root_admin' => true,
            'name_first' => 'Admin',
            'name_last' => 'User',
        ];

        $this->hasher->shouldReceive('make')
            ->andReturn('hashed-admin-pass');

        $this->connection->shouldReceive('beginTransaction')
            ->once()
            ->andReturnTrue();
        $this->connection->shouldReceive('commit')
            ->once()
            ->andReturnTrue();

        $this->repository->shouldReceive('create')
            ->once()
            ->with(
                \Mockery::on(function ($data) {
                    return $data['root_admin'] === true;
                }),
                true,
                true
            )
            ->andReturn(new User());

        \Illuminate\Support\Facades\Notification::fake();

        $result = $this->service->handle($data);

        $this->assertInstanceOf(User::class, $result);
    }
}
