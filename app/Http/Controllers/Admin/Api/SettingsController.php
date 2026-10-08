<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Enums\Captcha\Captchas;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Providers\SettingsServiceProvider;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\BaseSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\MailSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\AdvancedSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\CaptchaSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\CustomNavigationSettingsFormRequest;

class SettingsController extends Controller
{
    use AvailableLanguages;

    /**
     * SettingsController constructor.
     */
    public function __construct(
        private ConfigRepository $config,
        private Encrypter $encrypter,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    /**
     * Return the current values for every settings group.
     */
    public function index(): JsonResponse
    {
        $items = collect(json_decode((string) $this->config->get('app.custom_nav_items', '[]'), true) ?: [])
            ->take(3)
            ->map(fn ($item) => [
                'label' => $item['label'] ?? '',
                'url' => $item['url'] ?? '',
                'icon' => $item['icon'] ?? 'link',
            ])
            ->values();

        while ($items->count() < 3) {
            $items->push(['label' => '', 'url' => '', 'icon' => 'link']);
        }

        return response()->json([
            'general' => [
                'app:name' => $this->config->get('app.name'),
                'app:locale' => $this->config->get('app.locale'),
                'pterodactyl:auth:2fa_required' => (int) $this->config->get('pterodactyl.auth.2fa_required'),
            ],
            'advanced' => [
                'pterodactyl:guzzle:timeout' => (int) $this->config->get('pterodactyl.guzzle.timeout'),
                'pterodactyl:guzzle:connect_timeout' => (int) $this->config->get('pterodactyl.guzzle.connect_timeout'),
                'pterodactyl:client_features:allocations:enabled' => (bool) $this->config->get('pterodactyl.client_features.allocations.enabled'),
                'pterodactyl:client_features:allocations:range_start' => $this->config->get('pterodactyl.client_features.allocations.range_start'),
                'pterodactyl:client_features:allocations:range_end' => $this->config->get('pterodactyl.client_features.allocations.range_end'),
                'pterodactyl:client_features:groups:enabled' => (bool) $this->config->get('pterodactyl.client_features.groups.enabled'),
            ],
            'mail' => [
                'enabled' => $this->config->get('mail.default') === 'smtp',
                'mail:mailers:smtp:host' => $this->config->get('mail.mailers.smtp.host'),
                'mail:mailers:smtp:port' => (int) $this->config->get('mail.mailers.smtp.port'),
                'mail:mailers:smtp:encryption' => $this->config->get('mail.mailers.smtp.encryption'),
                'mail:mailers:smtp:username' => $this->config->get('mail.mailers.smtp.username'),
                'mail:from:address' => $this->config->get('mail.from.address'),
                'mail:from:name' => $this->config->get('mail.from.name'),
            ],
            'captcha' => [
                'providers' => Captchas::all(),
                'pterodactyl:captcha:provider' => $this->config->get('pterodactyl.captcha.provider', 'none'),
                'pterodactyl:captcha:turnstile:site_key' => $this->config->get('pterodactyl.captcha.turnstile.site_key', ''),
                'pterodactyl:captcha:turnstile:secret_key' => $this->config->get('pterodactyl.captcha.turnstile.secret_key', ''),
                'pterodactyl:captcha:hcaptcha:site_key' => $this->config->get('pterodactyl.captcha.hcaptcha.site_key', ''),
                'pterodactyl:captcha:hcaptcha:secret_key' => $this->config->get('pterodactyl.captcha.hcaptcha.secret_key', ''),
                'pterodactyl:captcha:recaptcha:site_key' => $this->config->get('pterodactyl.captcha.recaptcha.site_key', ''),
                'pterodactyl:captcha:recaptcha:secret_key' => $this->config->get('pterodactyl.captcha.recaptcha.secret_key', ''),
                'pterodactyl:captcha:cap:site_key' => $this->config->get('pterodactyl.captcha.cap.site_key', ''),
                'pterodactyl:captcha:cap:secret_key' => $this->config->get('pterodactyl.captcha.cap.secret_key', ''),
                'pterodactyl:captcha:cap:server_url' => $this->config->get('pterodactyl.captcha.cap.server_url', ''),
            ],
            'custom_navigation' => [
                'items' => $items,
            ],
            'languages' => $this->getAvailableLanguages(true),
        ]);
    }

    /**
     * Update the general settings.
     */
    public function updateGeneral(BaseSettingsFormRequest $request): JsonResponse
    {
        return $this->store($request->normalize());
    }

    /**
     * Update the advanced settings.
     */
    public function updateAdvanced(AdvancedSettingsFormRequest $request): JsonResponse
    {
        return $this->store($request->normalize());
    }

    /**
     * Update the mail settings.
     *
     * @throws DisplayException
     */
    public function updateMail(MailSettingsFormRequest $request): JsonResponse
    {
        if ($this->config->get('mail.default') !== 'smtp') {
            throw new DisplayException('This feature is only available if SMTP is the selected email driver for the Panel.');
        }

        return $this->store($request->normalize());
    }

    /**
     * Update the captcha settings.
     */
    public function updateCaptcha(CaptchaSettingsFormRequest $request): JsonResponse
    {
        return $this->store($request->normalize());
    }

    /**
     * Update the custom navigation settings.
     */
    public function updateCustomNavigation(CustomNavigationSettingsFormRequest $request): JsonResponse
    {
        return $this->store($request->normalize());
    }

    /**
     * Persist a set of settings keys and restart the queue worker.
     */
    private function store(array $values): JsonResponse
    {
        foreach ($values as $key => $value) {
            if (in_array($key, SettingsServiceProvider::getEncryptedKeys(), true) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response()->json(['status' => 'ok']);
    }
}
