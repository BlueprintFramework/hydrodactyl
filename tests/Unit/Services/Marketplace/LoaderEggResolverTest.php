<?php

namespace Pterodactyl\Tests\Unit\Services\Marketplace;

use PHPUnit\Framework\Attributes\DataProvider;
use Pterodactyl\Services\Marketplace\LoaderEggResolver;
use Pterodactyl\Tests\TestCase;

class LoaderEggResolverTest extends TestCase
{
    private LoaderEggResolver $resolver;

    public function setUp(): void
    {
        parent::setUp();
        $this->resolver = new LoaderEggResolver();
    }

    #[DataProvider('javaFloorProvider')]
    public function testRecommendedJava(string $minecraftVersion, int $expected): void
    {
        $this->assertSame($expected, $this->resolver->recommendedJava($minecraftVersion));
    }

    public static function javaFloorProvider(): array
    {
        return [
            '1.16' => ['1.16.5', 8],
            '1.17' => ['1.17.1', 16],
            '1.18' => ['1.18.2', 17],
            '1.20.4' => ['1.20.4', 17],
            '1.20.5' => ['1.20.5', 21],
            '1.21' => ['1.21.1', 21],
        ];
    }

    public function testPickJavaDockerImageExactMatch(): void
    {
        $images = [
            'Java 17' => 'ghcr.io/example/java:17',
            'Java 21' => 'ghcr.io/example/java:21',
        ];

        $this->assertSame('ghcr.io/example/java:21', $this->resolver->pickJavaDockerImage($images, 21));
    }

    public function testPickJavaDockerImageFallsBackToNextHigher(): void
    {
        $images = [
            'Java 17' => 'ghcr.io/example/java:17',
            'Java 21' => 'ghcr.io/example/java:21',
        ];

        $this->assertSame('ghcr.io/example/java:21', $this->resolver->pickJavaDockerImage($images, 18));
    }

    public function testPickJavaDockerImageEmptyReturnsNull(): void
    {
        $this->assertNull($this->resolver->pickJavaDockerImage([], 21));
    }
}
