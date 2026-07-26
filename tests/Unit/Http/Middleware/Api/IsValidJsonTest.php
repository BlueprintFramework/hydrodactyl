<?php

namespace Pterodactyl\Tests\Unit\Http\Middleware\Api;

use Illuminate\Http\Request;
use Pterodactyl\Http\Middleware\Api\IsValidJson;
use Pterodactyl\Tests\Unit\Http\Middleware\MiddlewareTestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class IsValidJsonTest extends MiddlewareTestCase
{
    /**
     * Test that valid JSON passes through the middleware.
     */
    public function testValidJsonPassesThrough()
    {
        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(true);
        $this->request->shouldReceive('getContent')->withNoArgs()->twice()->andReturn('{"key":"value"}');

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that non-JSON requests pass through without validation.
     */
    public function testNonJsonRequestPassesThrough()
    {
        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(false);

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that empty JSON body passes through without validation.
     */
    public function testEmptyJsonBodyPassesThrough()
    {
        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(true);
        $this->request->shouldReceive('getContent')->withNoArgs()->once()->andReturn('');

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that malformed JSON throws a bad request exception.
     */
    public function testMalformedJsonThrowsException()
    {
        $this->expectException(BadRequestHttpException::class);

        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(true);
        $this->request->shouldReceive('getContent')->withNoArgs()->twice()->andReturn('{invalid json}');

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that valid JSON array passes through.
     */
    public function testValidJsonArrayPassesThrough()
    {
        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(true);
        $this->request->shouldReceive('getContent')->withNoArgs()->twice()->andReturn('[1, 2, 3]');

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that valid nested JSON passes through.
     */
    public function testValidNestedJsonPassesThrough()
    {
        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(true);
        $this->request->shouldReceive('getContent')->withNoArgs()->twice()->andReturn('{"nested":{"key":"value"},"array":[1,2,3]}');

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that the exception message includes the JSON error.
     */
    public function testExceptionMessageIncludesJsonError()
    {
        $this->request->shouldReceive('isJson')->withNoArgs()->once()->andReturn(true);
        $this->request->shouldReceive('getContent')->withNoArgs()->twice()->andReturn('{invalid}');

        try {
            $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
            $this->fail('Expected BadRequestHttpException was not thrown.');
        } catch (BadRequestHttpException $exception) {
            $this->assertStringContainsString('malformed', $exception->getMessage());
        }
    }

    /**
     * Return an instance of the middleware for testing.
     */
    private function getMiddleware(): IsValidJson
    {
        return new IsValidJson();
    }
}
