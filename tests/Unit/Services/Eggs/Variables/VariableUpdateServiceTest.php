<?php

namespace Pterodactyl\Tests\Unit\Services\Eggs\Variables;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Contracts\Validation\Validator;
use Pterodactyl\Services\Eggs\Variables\VariableUpdateService;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Pterodactyl\Contracts\Repository\EggVariableRepositoryInterface;
use Pterodactyl\Exceptions\Service\Egg\Variable\ReservedVariableNameException;

class VariableUpdateServiceTest extends TestCase
{
    private MockInterface $repository;
    private MockInterface $validator;
    private VariableUpdateService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(EggVariableRepositoryInterface::class);
        $this->validator = $this->mock(ValidationFactory::class);
        $this->service = new VariableUpdateService($this->repository, $this->validator);
    }

    public function testVariableIsUpdated()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $data = [
            'name' => 'Updated Name',
            'description' => 'Updated description',
            'env_variable' => 'UPDATED_VAR',
            'default_value' => 'new-default',
            'rules' => 'string|max:255',
            'options' => ['user_viewable'],
        ];

        $this->repository->shouldReceive('setColumns')
            ->once()
            ->with('id')
            ->andReturnSelf();
        $this->repository->shouldReceive('findCountWhere')
            ->once()
            ->with([
                ['env_variable', '=', 'UPDATED_VAR'],
                ['egg_id', '=', 5],
                ['id', '!=', 1],
            ])
            ->andReturn(0);

        $this->validator->shouldReceive('make')
            ->once()
            ->with(['__TEST' => 'test'], ['__TEST' => 'string|max:255'])
            ->andReturn(\Mockery::mock(Validator::class, ['fails' => null]));

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, [
                'name' => 'Updated Name',
                'description' => 'Updated description',
                'env_variable' => 'UPDATED_VAR',
                'default_value' => 'new-default',
                'user_viewable' => true,
                'user_editable' => false,
                'rules' => 'string|max:255',
            ])
            ->andReturn(true);

        $this->service->handle($variable, $data);
    }

    public function testExceptionIsThrownForReservedName()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $this->expectException(ReservedVariableNameException::class);

        $this->service->handle($variable, [
            'env_variable' => 'SERVER_PORT',
        ]);
    }

    public function testExceptionIsThrownForDuplicateEnvVariable()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $this->repository->shouldReceive('setColumns')
            ->once()
            ->with('id')
            ->andReturnSelf();
        $this->repository->shouldReceive('findCountWhere')
            ->once()
            ->andReturn(1);

        $this->expectException(DisplayException::class);

        $this->service->handle($variable, [
            'env_variable' => 'DUPLICATE_VAR',
        ]);
    }

    public function testNoUniquenessCheckWhenEnvVariableNotChanged()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $this->repository->shouldNotReceive('findCountWhere');
        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->andReturn(true);

        $this->service->handle($variable, [
            'name' => 'Just Name Change',
        ]);
    }

    public function testRulesAreSplitByDoubleSemicolons()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $data = [
            'env_variable' => 'TEST_VAR',
            'rules' => 'required;;string;;max:255',
        ];

        $this->repository->shouldReceive('setColumns')
            ->once()
            ->with('id')
            ->andReturnSelf();
        $this->repository->shouldReceive('findCountWhere')
            ->once()
            ->andReturn(0);

        $this->validator->shouldReceive('make')
            ->once()
            ->with(['__TEST' => 'test'], ['__TEST' => ['required', 'string', 'max:255']])
            ->andReturn(\Mockery::mock(Validator::class, ['fails' => null]));

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->andReturn(true);

        $this->service->handle($variable, $data);
    }

    public function testRulesAreNotValidatedWhenEmpty()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $this->validator->shouldNotReceive('make');

        $this->repository->shouldReceive('setColumns')
            ->once()
            ->with('id')
            ->andReturnSelf();
        $this->repository->shouldReceive('findCountWhere')
            ->once()
            ->andReturn(0);
        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->andReturn(true);

        $this->service->handle($variable, [
            'env_variable' => 'TEST_VAR',
            'rules' => '',
        ]);
    }

    public function testOptionsParseCorrectly()
    {
        $variable = EggVariable::factory()->make(['id' => 1, 'egg_id' => 5]);

        $this->repository->shouldReceive('withoutFreshModel')
            ->once()
            ->andReturnSelf();
        $this->repository->shouldReceive('update')
            ->once()
            ->with(1, \Mockery::on(function ($data) {
                return $data['user_viewable'] === false && $data['user_editable'] === true;
            }))
            ->andReturn(true);

        $this->service->handle($variable, [
            'name' => 'Test',
            'options' => ['user_editable'],
        ]);
    }
}
