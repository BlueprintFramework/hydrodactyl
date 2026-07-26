<?php

namespace Pterodactyl\Tests\Unit\Services\Eggs\Variables;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\EggVariable;
use Illuminate\Contracts\Validation\Validator;
use Pterodactyl\Services\Eggs\Variables\VariableCreationService;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Pterodactyl\Contracts\Repository\EggVariableRepositoryInterface;
use Pterodactyl\Exceptions\Service\Egg\Variable\ReservedVariableNameException;

class VariableCreationServiceTest extends TestCase
{
    private MockInterface $repository;
    private MockInterface $validator;
    private VariableCreationService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(EggVariableRepositoryInterface::class);
        $this->validator = $this->mock(ValidationFactory::class);
        $this->service = new VariableCreationService($this->repository, $this->validator);
    }

    public function testVariableIsCreated()
    {
        $eggId = 1;
        $data = [
            'name' => 'Test Variable',
            'description' => 'A test variable',
            'env_variable' => 'TEST_VAR',
            'default_value' => 'default',
            'rules' => 'required|string',
            'options' => ['user_viewable', 'user_editable'],
        ];

        $this->validator->shouldReceive('make')
            ->once()
            ->with(['__TEST' => 'test'], ['__TEST' => 'required|string'])
            ->andReturn(\Mockery::mock(Validator::class, [
                'fails' => null,
            ]));

        $this->repository->shouldReceive('create')
            ->once()
            ->with([
                'egg_id' => $eggId,
                'name' => 'Test Variable',
                'description' => 'A test variable',
                'env_variable' => 'TEST_VAR',
                'default_value' => 'default',
                'user_viewable' => true,
                'user_editable' => true,
                'rules' => 'required|string',
            ])
            ->andReturn(new EggVariable());

        $result = $this->service->handle($eggId, $data);

        $this->assertInstanceOf(EggVariable::class, $result);
    }

    public function testVariableIsCreatedWithDefaults()
    {
        $eggId = 2;
        $data = [
            'env_variable' => 'MY_VAR',
        ];

        $this->repository->shouldReceive('create')
            ->once()
            ->with([
                'egg_id' => $eggId,
                'name' => '',
                'description' => '',
                'env_variable' => 'MY_VAR',
                'default_value' => '',
                'user_viewable' => false,
                'user_editable' => false,
                'rules' => '',
            ])
            ->andReturn(new EggVariable());

        $result = $this->service->handle($eggId, $data);

        $this->assertInstanceOf(EggVariable::class, $result);
    }

    public function testExceptionIsThrownForReservedName()
    {
        $this->expectException(ReservedVariableNameException::class);

        $this->service->handle(1, [
            'env_variable' => 'SERVER_MEMORY',
        ]);
    }

    public function testExceptionIsThrownForReservedNameInsensitiveCase()
    {
        $this->expectException(ReservedVariableNameException::class);

        $this->service->handle(1, [
            'env_variable' => 'server_ip',
        ]);
    }

    public function testRulesAreNotValidatedWhenEmpty()
    {
        $this->validator->shouldNotReceive('make');

        $this->repository->shouldReceive('create')
            ->once()
            ->andReturn(new EggVariable());

        $this->service->handle(1, [
            'env_variable' => 'VALID_VAR',
            'rules' => '',
        ]);
    }

    public function testOptionsAreParsedCorrectly()
    {
        $data = [
            'env_variable' => 'MY_VAR',
            'options' => ['user_viewable'],
        ];

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return $data['user_viewable'] === true && $data['user_editable'] === false;
            }))
            ->andReturn(new EggVariable());

        $this->service->handle(1, $data);
    }

    public function testOptionsDefaultToEmptyArrayWhenNotSet()
    {
        $data = [
            'env_variable' => 'MY_VAR',
        ];

        $this->repository->shouldReceive('create')
            ->once()
            ->with(\Mockery::on(function ($data) {
                return $data['user_viewable'] === false && $data['user_editable'] === false;
            }))
            ->andReturn(new EggVariable());

        $this->service->handle(1, $data);
    }
}
