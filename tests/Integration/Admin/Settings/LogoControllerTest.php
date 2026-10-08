<?php

namespace Pterodactyl\Tests\Integration\Admin\Settings;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Admin\LogoService;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class LogoControllerTest extends IntegrationTestCase
{
    use DatabaseTransactions;

    public function testBrandingPageRespondsOk(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->get('/admin/settings/logo')->assertOk();
    }

    public function testBrandingApiReturnsStateWithoutExperimentalFlag(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->getJson('/admin/api/settings/logo');

        $response->assertOk()
            ->assertJsonStructure([
                'type',
                'value',
                'url',
                'history',
                'brandColor',
                'canProcessImages',
            ])
            ->assertJsonPath('brandColor', config('app.brand_color', '#52A9FF'));

        $this->assertArrayNotHasKey('experimental', $response->json());
    }

    public function testJpgUploadIsConvertedToWebp(): void
    {
        Storage::fake('public');

        $user = User::factory()->admin()->create();

        $image = imagecreatetruecolor(200, 100);
        $blue = imagecolorallocate($image, 82, 169, 255);
        imagefill($image, 0, 0, $blue);
        ob_start();
        imagejpeg($image);
        $jpg = ob_get_clean();

        $file = UploadedFile::fake()->createWithContent('logo.jpg', $jpg);

        $response = $this->actingAs($user)->post('/admin/api/settings/logo', [
            'logo_file' => $file,
        ]);

        $response->assertOk()->assertJsonPath('type', 'upload');

        $value = app(LogoService::class)->getCurrentValue();
        $this->assertNotNull($value);
        $this->assertStringEndsWith('.webp', $value);
        Storage::disk('public')->assertExists($value);
    }

    public function testSvgUploadIsStoredAsIs(): void
    {
        Storage::fake('public');

        $user = User::factory()->admin()->create();

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#52A9FF"/></svg>';
        $file = UploadedFile::fake()->createWithContent('logo.svg', $svg);

        $response = $this->actingAs($user)->post('/admin/api/settings/logo', [
            'logo_file' => $file,
        ]);

        $response->assertOk()->assertJsonPath('type', 'upload');

        $value = app(LogoService::class)->getCurrentValue();
        $this->assertNotNull($value);
        $this->assertStringEndsWith('.svg', $value);
        Storage::disk('public')->assertExists($value);
        $this->assertStringNotContainsString('<script', Storage::disk('public')->get($value));
    }

    public function testLogoUrlIsStoredAsLink(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->postJson('/admin/api/settings/logo', [
            'logo_url' => 'https://example.com/logo.png',
        ]);

        $response->assertOk()->assertJsonPath('type', 'link');
        $this->assertSame('https://example.com/logo.png', app(LogoService::class)->getCurrentValue());
    }

    public function testLogoCanBeRemoved(): void
    {
        Storage::fake('public');

        $user = User::factory()->admin()->create();

        $file = UploadedFile::fake()->createWithContent('logo.jpg', $this->makeJpg());
        $this->actingAs($user)->post('/admin/api/settings/logo', ['logo_file' => $file])->assertOk();
        $this->assertSame('upload', app(LogoService::class)->getCurrentType());

        $response = $this->actingAs($user)->postJson('/admin/api/settings/logo', ['remove' => true]);

        $response->assertOk();
        $this->assertNull(app(LogoService::class)->getCurrentType());
        $this->assertNull(app(LogoService::class)->getCurrentValue());
    }

    public function testCustomLogoRendersOnlyCustomFaviconLinks(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('logo/test.webp', 'fake-image-content');

        config(['app.logo.type' => 'upload', 'app.logo.value' => 'logo/test.webp']);

        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/admin/settings/logo');

        $response->assertOk();
        $response->assertSee('storage/logo/test.webp?v=', false);
        $response->assertDontSee('favicon.ico');
        $response->assertDontSee('favicon-96x96.png');
        $response->assertDontSee('favicon.svg');
    }

    public function testNoCustomLogoRendersStaticFaviconLinks(): void
    {
        Storage::fake('public');

        config(['app.logo.type' => null, 'app.logo.value' => null]);

        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/admin/settings/logo');

        $response->assertOk();
        $response->assertSee('favicon.ico');
        $response->assertSee('favicon-96x96.png');
        $response->assertSee('favicon.svg');
    }

    public function testRewindToIndexZeroWorks(): void
    {
        $user = User::factory()->admin()->create();

        Storage::fake('public');

        // Upload first logo (index 0)
        $fileA = UploadedFile::fake()->createWithContent('a.jpg', $this->makeJpg());
        $this->actingAs($user)->post('/admin/api/settings/logo', ['logo_file' => $fileA])->assertOk();
        $valA = app(LogoService::class)->getCurrentValue();
        $this->assertNotNull($valA);

        // Upload second logo (index 0, pushes A to index 1)
        $fileB = UploadedFile::fake()->createWithContent('b.jpg', $this->makeJpg());
        $this->actingAs($user)->post('/admin/api/settings/logo', ['logo_file' => $fileB])->assertOk();
        $this->assertNotSame($valA, app(LogoService::class)->getCurrentValue());

        // Remove the logo — current becomes null, B's file is deleted, history filters to [A]
        $this->actingAs($user)->postJson('/admin/api/settings/logo', ['remove' => true])->assertOk();
        $this->assertNull(app(LogoService::class)->getCurrentValue());

        // Rewind to index 0 (the remaining history item A) — was silently ignored before the fix
        $response = $this->actingAs($user)->postJson('/admin/api/settings/logo', ['rewind' => 0]);

        $response->assertOk();
        $this->assertSame($valA, app(LogoService::class)->getCurrentValue(), 'Rewind to index 0 should restore the remaining history logo');
    }

    public function testRewindWorksWhenCurrentNotInHistory(): void
    {
        $user = User::factory()->admin()->create();

        Storage::fake('public');

        // Upload a logo to seed the history
        $fileA = UploadedFile::fake()->createWithContent('a.jpg', $this->makeJpg());
        $this->actingAs($user)->post('/admin/api/settings/logo', ['logo_file' => $fileA])->assertOk();
        $valA = app(LogoService::class)->getCurrentValue();
        $this->assertNotNull($valA);

        // Set current to a link that is NOT in history (seeded directly, since
        // storeLink would add it to history — this mirrors legacy/direct-set state)
        \DB::table('settings')->where('key', 'settings::app:logo:type')->update(['value' => 'link']);
        \DB::table('settings')->where('key', 'settings::app:logo:value')->update(['value' => 'https://example.com/external.png']);

        // Rewind to index 0 (the upload) — should still restore A
        $response = $this->actingAs($user)->postJson('/admin/api/settings/logo', ['rewind' => 0]);

        $response->assertOk();
        $this->assertSame($valA, app(LogoService::class)->getCurrentValue(), 'Rewind should work even when current logo is not in history');
    }

    public function testBrandingApiExposesBrandColor(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->getJson('/admin/api/settings/logo');

        $response->assertOk()
            ->assertJsonStructure(['brandColor'])
            ->assertJsonPath('brandColor', config('app.brand_color', '#52A9FF'));
    }

    public function testBrandColorCanBeSavedViaBrandingApi(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->postJson('/admin/api/settings/logo', [
            'app:brand_color' => '#FF6600',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('settings', [
            'key' => 'settings::app:brand_color',
            'value' => '#FF6600',
        ]);
    }

    private function makeJpg(): string
    {
        $image = imagecreatetruecolor(100, 50);
        ob_start();
        imagejpeg($image);
        $data = ob_get_clean();

        return $data;
    }
}