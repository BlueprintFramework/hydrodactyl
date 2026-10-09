<?php

namespace Pterodactyl\Services\Captcha\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Contracts\Captcha\CaptchaProviderInterface;

class CapProvider implements CaptchaProviderInterface
{
    protected string $siteKey;
    protected string $secretKey;
    protected string $serverUrl;

    public function __construct(array $config)
    {
        $this->siteKey = $config['site_key'] ?? '';
        $this->secretKey = $config['secret_key'] ?? '';
        $this->serverUrl = rtrim($config['server_url'] ?? '', '/');
    }

    /**
     * Get the HTML widget for the captcha.
     */
    public function getWidget(string $form): string
    {
        if (empty($this->siteKey) || empty($this->serverUrl)) {
            return '';
        }

        return sprintf(
            '<cap-widget data-cap-api-endpoint="%s/%s/"></cap-widget>',
            htmlspecialchars($this->serverUrl, ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($this->siteKey, ENT_QUOTES, 'UTF-8')
        );
    }

    /**
     * Verify a captcha response.
     */
    public function verify(string $response, ?string $remoteIp = null): bool
    {
        if (empty($this->secretKey) || empty($this->serverUrl) || empty($response)) {
            Log::warning('Cap verification failed: Missing secret key, server url or response', [
                'secret_key_empty' => empty($this->secretKey),
                'server_url_empty' => empty($this->serverUrl),
                'response_empty' => empty($response),
            ]);
            return false;
        }

        try {
            $httpResponse = Http::timeout(10)
                ->asJson()
                ->post($this->serverUrl . '/siteverify', [
                    'secret' => $this->secretKey,
                    'response' => $response,
                ]);

            if (!$httpResponse->successful()) {
                Log::warning('Cap verification failed: HTTP ' . $httpResponse->status(), [
                    'response_body' => $httpResponse->body(),
                ]);
                return false;
            }

            $result = $httpResponse->json();

            if (!isset($result['success'])) {
                Log::warning('Cap verification failed: Invalid response format', [
                    'result' => $result,
                ]);
                return false;
            }

            if (!$result['success'] && isset($result['errors'])) {
                Log::warning('Cap verification failed', [
                    'errors' => $result['errors'],
                    'full_result' => $result,
                ]);
            }

            return (bool) $result['success'];
        } catch (\Exception $e) {
            Log::error('Cap verification exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Get the JavaScript includes needed for this captcha provider.
     */
    public function getScriptIncludes(): array
    {
        return [
            'https://cdn.jsdelivr.net/npm/@cap.js/widget',
        ];
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'cap';
    }

    /**
     * Get the site key for frontend use.
     */
    public function getSiteKey(): string
    {
        return $this->siteKey;
    }

    /**
     * Get the Cap server URL for frontend use.
     */
    public function getServerUrl(): string
    {
        return $this->serverUrl;
    }

    /**
     * Check if the provider is properly configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->siteKey) && !empty($this->secretKey) && !empty($this->serverUrl);
    }

    /**
     * Get the response field name for this provider.
     */
    public function getResponseFieldName(): string
    {
        return 'cap-token';
    }
}