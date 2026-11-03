<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\Api;

use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class EggImportControllerTest extends IntegrationTestCase
{
    use DatabaseTransactions;

    private function eggFile(string $name): UploadedFile
    {
        $contents = json_encode([
            'meta' => [
                'version' => 'PTDL_v2',
                'update_url' => null,
            ],
            'name' => $name,
            'author' => 'admin@example.com',
            'description' => 'Imported from a test file',
            'features' => null,
            'docker_images' => ['Java 21' => 'eclipse-temurin:21'],
            'file_denylist' => [],
            'startup' => 'java -jar server.jar',
            'config' => [
                'files' => '{}',
                'startup' => '{}',
                'logs' => '{}',
                'stop' => 'stop',
            ],
            'scripts' => [
                'installation' => [
                    'script' => 'echo install',
                    'container' => 'alpine',
                    'entrypoint' => 'bash',
                ],
            ],
            'variables' => [],
        ], JSON_THROW_ON_ERROR);

        return UploadedFile::fake()->createWithContent('egg.json', $contents);
    }

    public function testImportingAnEggAddsItToTheNest()
    {
        $nest = Nest::factory()->create();
        $user = User::factory()->admin()->create();
        $name = 'Imported Egg ' . Str::random(12);

        $response = $this->actingAs($user)->post('/admin/api/nests/import', [
            'import_file' => $this->eggFile($name),
            'import_to_nest' => $nest->id,
        ]);

        $response->assertCreated();

        $egg = Egg::query()->where('name', $name)->firstOrFail();
        $this->assertSame($nest->id, $egg->nest_id);

        $this->actingAs($user)
            ->getJson("/admin/api/nests/{$nest->id}")
            ->assertOk()
            ->assertJsonPath('data.eggs.0.id', $egg->id);
    }

    public function testUpdatingAnEggFromAFileDoesNotRequireANest()
    {
        $nest = Nest::factory()->create();
        $egg = Egg::factory()->for($nest)->create([
            'author' => 'admin@example.com',
            'name' => 'Old Name',
            'docker_images' => ['Java 21' => 'eclipse-temurin:21'],
            'config_stop' => 'stop',
            'config_startup' => '{}',
            'config_logs' => '{}',
            'config_files' => '{}',
        ]);
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post("/admin/api/eggs/{$egg->id}/import", [
            'import_file' => $this->eggFile('Updated Name'),
        ]);

        $response->assertOk();
        $this->assertSame('Updated Name', $egg->refresh()->name);
    }
}
