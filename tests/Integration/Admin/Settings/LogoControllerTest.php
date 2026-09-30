<?php

namespace Pterodactyl\Tests\Integration\Admin\Settings;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class LogoControllerTest extends IntegrationTestCase
{
    use DatabaseTransactions;
    public function testIndexPageRendersWithoutExperimentalBadge(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/admin/settings/logo');

        $response->assertOk();
        $response->assertSee('Branding');
        $response->assertDontSee('Experimental');
        $response->assertSee('faviconPreview');
        $response->assertSee('Company Name');
        $response->assertSee('companyNameInput');
    }

    public function testCompanyNameCanBeSavedViaBrandingPage(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->patch('/admin/settings/logo', [
            'app:name' => 'Hydrodactyl Test',
        ]);

        $response->assertRedirect('/admin/settings/logo');

        $this->assertDatabaseHas('settings', [
            'key' => 'settings::app:name',
            'value' => 'Hydrodactyl Test',
        ]);
    }

    public function testGeneralSettingsPageDoesNotHaveCompanyNameField(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/admin/settings');

        $response->assertOk();
        $response->assertDontSee('name="app:name"');
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

        $response = $this->actingAs($user)->patch('/admin/settings/logo', [
            'logo_file' => $file,
        ]);

        $response->assertRedirect('/admin/settings/logo');

        $this->assertDatabaseHas('settings', ['key' => 'settings::app:logo:type', 'value' => 'upload']);
        $value = \DB::table('settings')->where('key', 'settings::app:logo:value')->value('value');
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

        $response = $this->actingAs($user)->patch('/admin/settings/logo', [
            'logo_file' => $file,
        ]);

        $response->assertRedirect('/admin/settings/logo');

        $value = \DB::table('settings')->where('key', 'settings::app:logo:value')->value('value');
        $this->assertNotNull($value);
        $this->assertStringEndsWith('.svg', $value);
        Storage::disk('public')->assertExists($value);
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
        $this->actingAs($user)->patch('/admin/settings/logo', ['logo_file' => $fileA]);
        $valA = \DB::table('settings')->where('key', 'settings::app:logo:value')->value('value');

        // Upload second logo (index 0, pushes A to index 1)
        $fileB = UploadedFile::fake()->createWithContent('b.jpg', $this->makeJpg());
        $this->actingAs($user)->patch('/admin/settings/logo', ['logo_file' => $fileB]);

        // Remove the logo — current becomes null, B's file is deleted, history filters to [A]
        $this->actingAs($user)->patch('/admin/settings/logo', ['remove' => '1']);

        // Rewind to index 0 (the remaining history item A) — was silently ignored before the fix
        $this->actingAs($user)->patch('/admin/settings/logo', ['rewind' => '0']);

        $current = \DB::table('settings')->where('key', 'settings::app:logo:value')->value('value');
        $this->assertSame($valA, $current, 'Rewind to index 0 should restore the remaining history logo');
    }

    public function testRewindWorksWhenCurrentNotInHistory(): void
    {
        $user = User::factory()->admin()->create();

        Storage::fake('public');
        Storage::disk('public')->put('logo/rewind-x.webp', 'fake-x');
        Storage::disk('public')->put('logo/rewind-y.webp', 'fake-y');

        // Upload a logo to seed the history
        $fileA = UploadedFile::fake()->createWithContent('a.jpg', $this->makeJpg());
        $this->actingAs($user)->patch('/admin/settings/logo', ['logo_file' => $fileA]);
        $valA = \DB::table('settings')->where('key', 'settings::app:logo:value')->value('value');

        // Set current to a link that is NOT in history
        \DB::table('settings')->where('key', 'settings::app:logo:type')->update(['value' => 'link']);
        \DB::table('settings')->where('key', 'settings::app:logo:value')->update(['value' => 'https://example.com/external.png']);

        // Rewind to index 0 (the upload) — was broken by the moveToFront index bug
        $this->actingAs($user)->patch('/admin/settings/logo', ['rewind' => '0']);

        $current = \DB::table('settings')->where('key', 'settings::app:logo:value')->value('value');
        $this->assertSame($valA, $current, 'Rewind should work even when current logo is not in history');
    }

    public function testBrandingPageHasBrandColorPicker(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/admin/settings/logo');

        $response->assertOk();
        $response->assertSee('Brand Color');
        $response->assertSee('brandColorPicker');
        $response->assertSee('brandColorText');
    }

    public function testBrandColorCanBeSavedViaBrandingPage(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->patch('/admin/settings/logo', [
            'app:brand_color' => '#FF6600',
        ]);

        $response->assertRedirect('/admin/settings/logo');

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