<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Services\Captcha\CaptchaManager;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class AssetComposer
{
  protected CaptchaManager $captcha;
  protected SettingsRepositoryInterface $settings;

  /** @var array<string, bool> Per-request filesystem existence cache. */
  private static array $storageExistsCache = [];

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
      'upload' => ($logoValue && $this->storageExists($logoValue)) ? url('storage/' . $logoValue) : null,
      'link' => $logoValue,
      default => null,
    };

    // Resolve the captcha provider once and reuse the driver instance.
    $provider = $this->captcha->getDefaultDriver();
    $driver = $provider !== 'none' ? $this->captcha->driver() : null;

    $view->with('siteConfiguration', [
      'name' => config('app.name') ?? 'Hydrodactyl',
      'locale' => config('app.locale') ?? 'en',
      'timezone' => config('app.timezone') ?? '',
      'logo' => $logoUrl,
      'customNavItems' => $this->getCustomNavItems(),
      'captcha' => [
        'enabled' => $provider !== 'none',
        'provider' => $provider,
        'siteKey' => !is_null($driver) && method_exists($driver, 'getSiteKey') ? $driver->getSiteKey() : '',
        'serverUrl' => !is_null($driver) && method_exists($driver, 'getServerUrl') ? $driver->getServerUrl() : '',
        'scriptIncludes' => $this->captcha->getScriptIncludes(),
      ],
    ]);
  }

  /**
   * Memoize a Storage::exists() check for the duration of the request.
   */
  private function storageExists(string $path): bool
  {
    if (!array_key_exists($path, self::$storageExistsCache)) {
      self::$storageExistsCache[$path] = Storage::disk('public')->exists($path);
    }

    return self::$storageExistsCache[$path];
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
