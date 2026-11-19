<?php

namespace Pterodactyl\Tests\Unit\Services\Marketplace;

use Pterodactyl\Services\Marketplace\MarketplaceException;
use Pterodactyl\Services\Marketplace\MrpackParser;
use Pterodactyl\Tests\TestCase;
use ZipArchive;

class MrpackParserTest extends TestCase
{
    private MrpackParser $parser;

    private string $tempPath;

    public function setUp(): void
    {
        parent::setUp();

        $this->parser = new MrpackParser();
        $this->tempPath = tempnam(sys_get_temp_dir(), 'mrpack_') . '.mrpack';
    }

    protected function tearDown(): void
    {
        if (is_file($this->tempPath)) {
            unlink($this->tempPath);
        }

        parent::tearDown();
    }

    public function testParseRejectsPathTraversalInRequiredFiles(): void
    {
        $this->writeMrpack([
            'formatVersion' => 1,
            'game' => 'minecraft',
            'versionId' => '1.0.0',
            'name' => 'Traversal Pack',
            'dependencies' => [
                'minecraft' => '1.20.1',
                'fabric-loader' => '0.15.0',
            ],
            'files' => [
                [
                    'path' => '../evil.jar',
                    'hashes' => ['sha1' => 'abc'],
                    'downloads' => ['https://cdn.modrinth.com/data/evil.jar'],
                    'fileSize' => 12,
                    'env' => ['server' => 'required', 'client' => 'optional'],
                ],
            ],
        ]);

        $this->expectException(MarketplaceException::class);
        $this->parser->parse($this->tempPath);
    }

    public function testParseIncludesOnlyRequiredServerFiles(): void
    {
        $this->writeMrpack([
            'formatVersion' => 1,
            'game' => 'minecraft',
            'versionId' => '1.0.0',
            'name' => 'Filter Pack',
            'dependencies' => [
                'minecraft' => '1.20.1',
                'fabric-loader' => '0.15.0',
            ],
            'files' => [
                [
                    'path' => 'mods/required.jar',
                    'hashes' => ['sha1' => 'aaa'],
                    'downloads' => ['https://cdn.modrinth.com/data/required.jar'],
                    'fileSize' => 10,
                    'env' => ['server' => 'required', 'client' => 'required'],
                ],
                [
                    'path' => 'mods/optional.jar',
                    'hashes' => ['sha1' => 'bbb'],
                    'downloads' => ['https://cdn.modrinth.com/data/optional.jar'],
                    'fileSize' => 11,
                    'env' => ['server' => 'optional', 'client' => 'required'],
                ],
                [
                    'path' => 'mods/client-only.jar',
                    'hashes' => ['sha1' => 'ccc'],
                    'downloads' => ['https://cdn.modrinth.com/data/client.jar'],
                    'fileSize' => 12,
                    'env' => ['server' => 'unsupported', 'client' => 'required'],
                ],
            ],
        ], [
            'overrides/config/pack.toml' => "name = \"pack\"\n",
        ]);

        $parsed = $this->parser->parse($this->tempPath);

        $this->assertSame('1.20.1', $parsed['minecraft']);
        $this->assertSame('fabric', $parsed['loader']);
        $this->assertCount(1, $parsed['files']);
        $this->assertSame('mods/required.jar', $parsed['files'][0]['path']);
        $this->assertSame(
            ['path' => 'config/pack.toml', 'zip_entry' => 'overrides/config/pack.toml'],
            $parsed['overrides'][0],
        );
    }

    /**
     * @param array<string, mixed> $index
     * @param array<string, string> $extraEntries
     */
    private function writeMrpack(array $index, array $extraEntries = []): void
    {
        $zip = new ZipArchive();
        $this->assertTrue($zip->open($this->tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE));
        $zip->addFromString('modrinth.index.json', json_encode($index, JSON_THROW_ON_ERROR));
        foreach ($extraEntries as $name => $contents) {
            $zip->addFromString($name, $contents);
        }
        $zip->close();
    }
}
