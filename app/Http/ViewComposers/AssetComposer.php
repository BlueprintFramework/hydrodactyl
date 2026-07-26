<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Services\Captcha\CaptchaManager;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class AssetComposer
{
    protected CaptchaManager $captcha;
    protected SettingsRepositoryInterface $settings;

    public function __construct(CaptchaManager $captcha, SettingsRepositoryInterface $settings)
    {
        $this->captcha = $captcha;
        $this->settings = $settings;
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $logoType = config('app.logo.type');
        $logoValue = config('app.logo.value');
        $logoUrl = match ($logoType) {
            'upload' => ($logoValue && Storage::disk('public')->exists($logoValue)) ? url('storage/' . $logoValue) : null,
            'link' => $logoValue,
            default => null,
        };

        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Hydrodactyl',
            'locale' => config('app.locale') ?? 'en',
            'timezone' => config('app.timezone') ?? '',
            'logo' => $logoUrl,
            'customNavItems' => $this->getCustomNavItems(),
            'captcha' => [
                'enabled' => $this->captcha->getDefaultDriver() !== 'none',
                'provider' => $this->captcha->getDefaultDriver(),
                'siteKey' => $this->getSiteKeyForCurrentProvider(),
                'scriptIncludes' => $this->captcha->getScriptIncludes(),
            ],
        ]);
    }

    /**
     * Get the site key for the currently active captcha provider.
     */
    private function getSiteKeyForCurrentProvider(): string
    {
        $provider = $this->captcha->getDefaultDriver();

        if ($provider === 'none') {
            return '';
        }

        try {
            $driver = $this->captcha->driver();
            if (method_exists($driver, 'getSiteKey')) {
                return $driver->getSiteKey();
            }
        } catch (\Exception $e) {
            // Silently fail to avoid exposing errors to frontend
        }

        return '';
    }

    private function getCustomNavItems(): array
    {
        $items = json_decode((string) config('app.custom_nav_items', '[]'), true);

        if (!is_array($items)) {
            return [];
        }

        return collect($items)
          ->take(3)
          ->map(function (array $item): ?array {
              $label = trim((string) ($item['label'] ?? ''));
              $url = trim((string) ($item['url'] ?? ''));
              $icon = trim((string) ($item['icon'] ?? 'link'));

              if ($label === '' || $url === '') {
                  return null;
              }

              return [
                  'label' => $label,
                  'url' => $url,
                  'icon' => $icon !== '' ? $icon : 'link',
              ];
          })
          ->filter()
          ->values()
          ->toArray();
    }
}
