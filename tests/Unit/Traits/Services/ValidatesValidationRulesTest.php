<?php

namespace Pterodactyl\Tests\Unit\Traits\Services;

use Mockery\MockInterface;
use Pterodactyl\Tests\TestCase;
use Illuminate\Contracts\Validation\Validator;
use Pterodactyl\Traits\Services\ValidatesValidationRules;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Pterodactyl\Exceptions\Service\Egg\Variable\BadValidationRuleException;

class ValidatesValidationRulesTest extends TestCase
{
    private MockInterface $validator;
    private ValidatesValidationRulesTestClass $instance;

    public function setUp(): void
    {
        parent::setUp();

        $this->validator = $this->mock(ValidationFactory::class);
        $this->instance = new ValidatesValidationRulesTestClass($this->validator);
    }

    public function testValidRulesPass()
    {
        $mockValidator = \Mockery::mock(Validator::class);
        $mockValidator->shouldReceive('fails')->once()->andReturn(null);

        $this->validator->shouldReceive('make')
            ->once()
            ->with(['__TEST' => 'test'], ['__TEST' => 'required|string|max:255'])
            ->andReturn($mockValidator);

        $this->instance->validateRules('required|string|max:255');
    }

    public function testValidArrayRulesPass()
    {
        $mockValidator = \Mockery::mock(Validator::class);
        $mockValidator->shouldReceive('fails')->once()->andReturn(null);

        $this->validator->shouldReceive('make')
            ->once()
            ->with(['__TEST' => 'test'], ['__TEST' => ['required', 'string', 'max:255']])
            ->andReturn($mockValidator);

        $this->instance->validateRules(['required', 'string', 'max:255']);
    }

    public function testBadMethodCallExceptionIsConvertedToBadValidationRuleException()
    {
        $mockValidator = \Mockery::mock(Validator::class);
        $mockValidator->shouldReceive('fails')
            ->once()
            ->andThrow(new \BadMethodCallException('Method [validateMyCustomRule] does not exist.'));

        $this->validator->shouldReceive('make')
            ->once()
            ->andReturn($mockValidator);

        $this->expectException(BadValidationRuleException::class);

        $this->instance->validateRules('my_custom_rule');
    }

    public function testNonMatchingBadMethodCallExceptionIsRethrown()
    {
        $mockValidator = \Mockery::mock(Validator::class);
        $mockValidator->shouldReceive('fails')
            ->once()
            ->andThrow(new \BadMethodCallException('Some other error.'));

        $this->validator->shouldReceive('make')
            ->once()
            ->andReturn($mockValidator);

        $this->expectException(\BadMethodCallException::class);
        $this->expectExceptionMessage('Some other error.');

        $this->instance->validateRules('some_rule');
    }

    public function testEmptyRulesStringDoesNotThrow()
    {
        $mockValidator = \Mockery::mock(Validator::class);
        $mockValidator->shouldReceive('fails')->once()->andReturn(null);

        $this->validator->shouldReceive('make')
            ->once()
            ->with(['__TEST' => 'test'], ['__TEST' => ''])
            ->andReturn($mockValidator);

        $this->instance->validateRules('');
    }
}

class ValidatesValidationRulesTestClass
{
    use ValidatesValidationRules;

    private ValidationFactory $validator;

    public function __construct(ValidationFactory $validator)
    {
        $this->validator = $validator;
    }

    protected function getValidator(): ValidationFactory
    {
        return $this->validator;
    }
}
