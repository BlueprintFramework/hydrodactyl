<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Settings;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Models\Domain;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Admin\LogoService;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Services\Captcha\CaptchaManager;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;
use Pterodactyl\Enums\Subdomain\Providers;
use Pterodactyl\Enums\Captcha\Captchas;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Support\Facades\Notification;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Providers\SettingsServiceProvider;

class SettingsController extends Controller
{
    use AvailableLanguages;

    public function __construct(
        private ConfigRepository $config,
        private Encrypter $encrypter,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
        private CaptchaManager $captcha,
        private LogoService $logoService,
        private SubdomainManagementService $subdomainService,
    ) {}

    public function general(): JsonResponse
    {
        return new JsonResponse([
            'app:locale' => $this->config->get('app.locale'),
            'pterodactyl:auth:2fa_required' => (int) $this->config->get('pterodactyl.auth.2fa_required', 0),
            'available_languages' => $this->getAvailableLanguages(true),
        ]);
    }

    public function updateGeneral(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pterodactyl:auth:2fa_required' => 'required|integer|in:0,1,2',
            'app:locale' => 'required|string|max:10',
        ]);

        foreach ($data as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return new JsonResponse(['success' => true]);
    }

    public function mail(): JsonResponse
    {
        return new JsonResponse([
            'disabled' => $this->config->get('mail.default') !== 'smtp',
            'mail:mailers:smtp:host' => $this->config->get('mail.mailers.smtp.host'),
            'mail:mailers:smtp:port' => $this->config->get('mail.mailers.smtp.port'),
            'mail:mailers:smtp:encryption' => $this->config->get('mail.mailers.smtp.encryption'),
            'mail:mailers:smtp:username' => $this->config->get('mail.mailers.smtp.username'),
            'mail:from:address' => $this->config->get('mail.from.address'),
            'mail:from:name' => $this->config->get('mail.from.name'),
        ]);
    }

    public function updateMail(Request $request): JsonResponse
    {
        if ($this->config->get('mail.default') !== 'smtp') {
            throw new DisplayException('This feature is only available if SMTP is the selected email driver for the Panel.');
        }

        $data = $request->validate([
            'mail:mailers:smtp:host' => 'required|string',
            'mail:mailers:smtp:port' => 'required|integer|between:1,65535',
            'mail:mailers:smtp:encryption' => 'present|in:null,"",tls,ssl',
            'mail:mailers:smtp:username' => 'nullable|string|max:191',
            'mail:mailers:smtp:password' => 'nullable|string|max:191',
            'mail:from:address' => 'required|string|email',
            'mail:from:name' => 'nullable|string|max:191',
        ]);

        if (($data['mail:mailers:smtp:password'] ?? '') === '!e') {
            $data['mail:mailers:smtp:password'] = '';
        }

        foreach ($data as $key => $value) {
            if (empty($value) && $key === 'mail:mailers:smtp:password') {
                continue;
            }

            if (in_array($key, SettingsServiceProvider::getEncryptedKeys()) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return new JsonResponse(['success' => true]);
    }

    public function testMail(Request $request): JsonResponse
    {
        try {
            Notification::route('mail', $request->user()->email)
                ->notify(new MailTested($request->user()));
        } catch (\Exception $exception) {
            $message = $exception->getMessage();

            if (str_contains($message, 'stream_socket_client') || str_contains($message, 'getaddrinfo')) {
                return new JsonResponse([
                    'error' => 'Could not connect to the mail server. Please verify your SMTP host and port settings are correct and that the server is reachable.',
                ], 500);
            }

            return new JsonResponse(['error' => 'Failed to send test email: ' . $message], 500);
        }

        return new JsonResponse(['success' => true]);
    }

    public function captcha(): JsonResponse
    {
        return new JsonResponse([
            'providers' => Captchas::all(),
            'pterodactyl:captcha:provider' => $this->config->get('pterodactyl.captcha.provider', 'none'),
            'pterodactyl:captcha:turnstile:site_key' => $this->config->get('pterodactyl.captcha.turnstile.site_key', ''),
            'pterodactyl:captcha:hcaptcha:site_key' => $this->config->get('pterodactyl.captcha.hcaptcha.site_key', ''),
            'pterodactyl:captcha:recaptcha:site_key' => $this->config->get('pterodactyl.captcha.recaptcha.site_key', ''),
        ]);
    }

    public function updateCaptcha(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pterodactyl:captcha:provider' => 'required|string|in:none,turnstile,hcaptcha,recaptcha',
            'pterodactyl:captcha:turnstile:site_key' => 'nullable|string|max:255',
            'pterodactyl:captcha:turnstile:secret_key' => 'nullable|string|max:255',
            'pterodactyl:captcha:hcaptcha:site_key' => 'nullable|string|max:255',
            'pterodactyl:captcha:hcaptcha:secret_key' => 'nullable|string|max:255',
            'pterodactyl:captcha:recaptcha:site_key' => 'nullable|string|max:255',
            'pterodactyl:captcha:recaptcha:secret_key' => 'nullable|string|max:255',
        ]);

        $provider = $data['pterodactyl:captcha:provider'];

        if ($provider === 'none') {
            $data['pterodactyl:captcha:turnstile:site_key'] = '';
            $data['pterodactyl:captcha:turnstile:secret_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:site_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:secret_key'] = '';
            $data['pterodactyl:captcha:recaptcha:site_key'] = '';
            $data['pterodactyl:captcha:recaptcha:secret_key'] = '';
        } elseif ($provider === 'turnstile') {
            $data['pterodactyl:captcha:hcaptcha:site_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:secret_key'] = '';
            $data['pterodactyl:captcha:recaptcha:site_key'] = '';
            $data['pterodactyl:captcha:recaptcha:secret_key'] = '';
            $request->validate([
                'pterodactyl:captcha:turnstile:site_key' => 'required|string|max:255',
                'pterodactyl:captcha:turnstile:secret_key' => 'required|string|max:255',
            ]);
        } elseif ($provider === 'hcaptcha') {
            $data['pterodactyl:captcha:turnstile:site_key'] = '';
            $data['pterodactyl:captcha:turnstile:secret_key'] = '';
            $data['pterodactyl:captcha:recaptcha:site_key'] = '';
            $data['pterodactyl:captcha:recaptcha:secret_key'] = '';
            $request->validate([
                'pterodactyl:captcha:hcaptcha:site_key' => 'required|string|max:255',
                'pterodactyl:captcha:hcaptcha:secret_key' => 'required|string|max:255',
            ]);
        } elseif ($provider === 'recaptcha') {
            $data['pterodactyl:captcha:turnstile:site_key'] = '';
            $data['pterodactyl:captcha:turnstile:secret_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:site_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:secret_key'] = '';
            $request->validate([
                'pterodactyl:captcha:recaptcha:site_key' => 'required|string|max:255',
                'pterodactyl:captcha:recaptcha:secret_key' => 'required|string|max:255',
            ]);
        }

        foreach ($data as $key => $value) {
            if (in_array($key, SettingsServiceProvider::getEncryptedKeys()) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return new JsonResponse(['success' => true]);
    }

    public function branding(): JsonResponse
    {
        return new JsonResponse([
            'companyName' => $this->config->get('app.name', ''),
            'logoType' => $this->logoService->getCurrentType(),
            'logoUrl' => $this->logoService->getCurrentUrl(),
            'logoValue' => $this->logoService->getCurrentValue(),
            'history' => $this->logoService->getHistory(),
        ]);
    }

    public function updateBranding(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:191',
            'logo_file' => 'nullable|file|mimes:png,jpg,jpeg,gif,webp,svg,ico,avif,mp4,webm|max:2048',
            'logo_url' => 'nullable|url|max:2048',
            'remove' => 'nullable|boolean',
            'rewind' => 'nullable|integer|min:0',
        ]);

        if (isset($validated['company_name'])) {
            $this->settings->set('settings::app:name', $validated['company_name']);
            unset($validated['company_name']);
        }

        if (!empty($validated)) {
            $this->logoService->handle($validated);
        }

        $this->kernel->call('queue:restart');

        return new JsonResponse(['success' => true]);
    }

    public function advanced(): JsonResponse
    {
        return new JsonResponse([
            'pterodactyl:guzzle:connect_timeout' => (int) $this->config->get('pterodactyl.guzzle.connect_timeout', 5),
            'pterodactyl:guzzle:timeout' => (int) $this->config->get('pterodactyl.guzzle.timeout', 30),
            'pterodactyl:client_features:allocations:enabled' => $this->config->get('pterodactyl.client_features.allocations.enabled', false) ? 'true' : 'false',
            'pterodactyl:client_features:allocations:range_start' => $this->config->get('pterodactyl.client_features.allocations.range_start'),
            'pterodactyl:client_features:allocations:range_end' => $this->config->get('pterodactyl.client_features.allocations.range_end'),
        ]);
    }

    public function updateAdvanced(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pterodactyl:guzzle:timeout' => 'required|integer|between:1,60',
            'pterodactyl:guzzle:connect_timeout' => 'required|integer|between:1,60',
            'pterodactyl:client_features:allocations:enabled' => 'required|in:true,false',
            'pterodactyl:client_features:allocations:range_start' => [
                'nullable',
                'required_if:pterodactyl:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
            ],
            'pterodactyl:client_features:allocations:range_end' => [
                'nullable',
                'required_if:pterodactyl:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
            ],
        ]);

        foreach ($data as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return new JsonResponse(['success' => true]);
    }

    public function domains(): JsonResponse
    {
        $domains = Domain::withCount('serverSubdomains')->orderBy('created_at', 'desc')->get();
        $providers = Providers::allWithDescriptions();

        return new JsonResponse([
            'domains' => $domains,
            'providers' => $providers,
        ]);
    }

    public function storeDomain(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:191|regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/|unique:domains,name',
            'dns_provider' => 'required|string|in:cloudflare,hetzner,route53',
            'dns_config' => 'required|array',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ]);

        try {
            $providerClass = $this->getProviderClass($data['dns_provider']);
            $provider = new $providerClass($data['dns_config']);
            $provider->testConnection();

            \DB::transaction(function () use ($data) {
                if (!empty($data['is_default'])) {
                    Domain::where('is_default', true)->update(['is_default' => false]);
                }

                $domain = Domain::create([
                    'name' => strtolower(trim($data['name'])),
                    'dns_provider' => $data['dns_provider'],
                    'dns_config' => $data['dns_config'],
                    'is_active' => $data['is_active'] ?? true,
                    'is_default' => $data['is_default'] ?? false,
                ]);

                return $domain;
            });

            return new JsonResponse(['success' => true]);
        } catch (DnsProviderException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }
    }

    public function updateDomain(Request $request, Domain $domain): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:191|regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/|unique:domains,name,' . $domain->id,
            'dns_provider' => 'required|string|in:cloudflare,hetzner,route53',
            'dns_config' => 'required|array',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ]);

        try {
            if ($data['dns_config'] !== $domain->dns_config || $data['dns_provider'] !== $domain->dns_provider) {
                $providerClass = $this->getProviderClass($data['dns_provider']);
                $provider = new $providerClass($data['dns_config']);
                $provider->testConnection();
            }

            \DB::transaction(function () use ($data, $domain) {
                $newIsDefault = $data['is_default'] ?? false;
                if ($newIsDefault && !$domain->is_default) {
                    Domain::where('is_default', true)->update(['is_default' => false]);
                } elseif (!$newIsDefault && $domain->is_default) {
                    $defaultCount = Domain::where('is_default', true)->count();
                    if ($defaultCount <= 1) {
                        throw new \Exception('Cannot remove default status: At least one domain must be set as default.');
                    }
                }

                $domain->update([
                    'name' => strtolower(trim($data['name'])),
                    'dns_provider' => $data['dns_provider'],
                    'dns_config' => $data['dns_config'],
                    'is_active' => $data['is_active'] ?? $domain->is_active,
                    'is_default' => $newIsDefault,
                ]);
            });

            return new JsonResponse(['success' => true]);
        } catch (DnsProviderException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }
    }

    public function deleteDomain(Domain $domain): JsonResponse
    {
        $activeSubdomains = $domain->activeSubdomains()->count();
        if ($activeSubdomains > 0) {
            return new JsonResponse(['error' => "Cannot delete domain with {$activeSubdomains} active subdomains."], 400);
        }

        if ($domain->is_default) {
            $defaultCount = Domain::where('is_default', true)->count();
            if ($defaultCount <= 1) {
                return new JsonResponse(['error' => 'Cannot delete the only default domain. Please set another domain as default first.'], 400);
            }
        }

        $domain->delete();
        return new JsonResponse(['success' => true]);
    }

    public function testConnection(Request $request): JsonResponse
    {
        $request->validate([
            'dns_provider' => 'required|string',
            'dns_config' => 'required|array',
        ]);

        try {
            $providerClass = $this->getProviderClass($request->input('dns_provider'));
            $provider = new $providerClass($request->input('dns_config'));
            $provider->testConnection();

            return new JsonResponse(['success' => true, 'message' => 'Connection successful.']);
        } catch (DnsProviderException $e) {
            return new JsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function getProviderSchema(string $provider): JsonResponse
    {
        try {
            $providerClass = $this->getProviderClass($provider);
            $providerInstance = new $providerClass([]);
            $schema = $providerInstance->getConfigurationSchema();

            return new JsonResponse(['success' => true, 'schema' => $schema]);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    private function getProviderClass(string $provider): string
    {
        $providers = Providers::all();

        if (!isset($providers[$provider])) {
            throw new \Exception("Unsupported DNS provider: {$provider}");
        }

        return $providers[$provider];
    }
}
