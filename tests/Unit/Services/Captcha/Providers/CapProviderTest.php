<?php

namespace Pterodactyl\Tests\Unit\Services\Captcha\Providers;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Services\Captcha\Providers\CapProvider;
use Pterodactyl\Tests\TestCase;

class CapProviderTest extends TestCase
{
    private const SERVER_URL = 'https://cap.example.com';
    private const SITE_KEY = 'test-site-key';
    private const SECRET_KEY = 'test-secret-key';

    private function makeProvider(array $overrides = []): CapProvider
    {
        return new CapProvider(array_merge([
            'site_key' => self::SITE_KEY,
            'secret_key' => self::SECRET_KEY,
            'server_url' => self::SERVER_URL,
        ], $overrides));
    }

    /**
     * Test that the widget HTML contains the Cap API endpoint.
     */
    public function testGetWidgetContainsApiEndpoint()
    {
        $widget = $this->provider()->getWidget('default');

        $this->assertStringContainsString('<cap-widget', $widget);
        $this->assertStringContainsString('data-cap-api-endpoint="' . self::SERVER_URL . '/' . self::SITE_KEY . '/"', $widget);
    }

    /**
     * Test that the widget HTML is empty when the provider is not configured.
     */
    public function testGetWidgetReturnsEmptyStringWhenUnconfigured()
    {
        $this->assertSame('', $this->makeProvider(['site_key' => ''])->getWidget('default'));
        $this->assertSame('', $this->makeProvider(['server_url' => ''])->getWidget('default'));
    }

    /**
     * Test that the widget HTML escapes the server url and site key.
     */
    public function testGetWidgetEscapesValues()
    {
        $provider = $this->makeProvider(['site_key' => 'key"><script>']);
        $widget = $provider->getWidget('default');

        $this->assertStringNotContainsString('"><script>', $widget);
        $this->assertStringContainsString('key&quot;&gt;&lt;script&gt;', $widget);
    }

    /**
     * Test that verification posts the secret and response as JSON to siteverify.
     */
    public function testVerifyPostsSecretAndResponseToSiteverify()
    {
        Http::fake([
            self::SERVER_URL . '/siteverify' => Http::response(['success' => true]),
        ]);

        $this->assertTrue($this->provider()->verify('valid-token', '127.0.0.1'));

        Http::assertSent(function (Request $request) {
            return $request->url() === self::SERVER_URL . '/siteverify'
                && $request->method() === 'POST'
                && str_contains($request->header('Content-Type')[0] ?? '', 'application/json')
                && $request->data() === [
                    'secret' => self::SECRET_KEY,
                    'response' => 'valid-token',
                ];
        });
    }

    /**
     * Test that verification returns false when the Cap server reports failure.
     */
    public function testVerifyReturnsFalseOnUnsuccessfulVerification()
    {
        Http::fake([
            self::SERVER_URL . '/siteverify' => Http::response(['success' => false, 'errors' => ['invalid-token']]),
        ]);

        $this->assertFalse($this->provider()->verify('bad-token'));
    }

    /**
     * Test that verification returns false when the Cap server is unreachable.
     */
    public function testVerifyReturnsFalseOnNetworkFailure()
    {
        Http::fake(function () {
            throw new \Exception('Connection refused');
        });

        $this->assertFalse($this->provider()->verify('any-token'));
    }

    /**
     * Test that verification returns false when the Cap server returns an HTTP error.
     */
    public function testVerifyReturnsFalseOnHttpError()
    {
        Http::fake([
            self::SERVER_URL . '/siteverify' => Http::response(['error' => 'Internal Server Error'], 500),
        ]);

        $this->assertFalse($this->provider()->verify('any-token'));
    }

    /**
     * Test that verification fails fast when the secret key or response is missing.
     */
    public function testVerifyFailsFastWhenMissingSecretOrResponse()
    {
        Http::fake();

        $this->assertFalse($this->makeProvider(['secret_key' => ''])->verify('token'));
        $this->assertFalse($this->makeProvider(['server_url' => ''])->verify('token'));
        $this->assertFalse($this->provider()->verify(''));

        Http::assertNothingSent();
    }

    /**
     * Test that verification fails fast when the server url is missing.
     */
    public function testVerifyFailsFastWhenMissingServerUrl()
    {
        Http::fake();

        $this->assertFalse($this->makeProvider(['server_url' => ''])->verify('token'));

        Http::assertNothingSent();
    }

    /**
     * Test the provider metadata.
     */
    public function testProviderMetadata()
    {
        $provider = $this->provider();

        $this->assertSame('cap', $provider->getName());
        $this->assertSame('cap-token', $provider->getResponseFieldName());
        $this->assertSame(self::SITE_KEY, $provider->getSiteKey());
        $this->assertSame(self::SERVER_URL, $provider->getServerUrl());
        $this->assertSame(['https://cdn.jsdelivr.net/npm/@cap.js/widget'], $provider->getScriptIncludes());
        $this->assertTrue($provider->isConfigured());
    }

    /**
     * Test that the server url has trailing slashes trimmed.
     */
    public function testServerUrlTrailingSlashIsTrimmed()
    {
        $provider = $this->makeProvider(['server_url' => self::SERVER_URL . '/']);

        $this->assertSame(self::SERVER_URL, $provider->getServerUrl());
    }

    /**
     * Test that the provider is not considered configured with missing values.
     */
    public function testIsConfiguredReturnsFalseWhenMissingValues()
    {
        $this->assertFalse($this->makeProvider(['site_key' => ''])->isConfigured());
        $this->assertFalse($this->makeProvider(['secret_key' => ''])->isConfigured());
        $this->assertFalse($this->makeProvider(['server_url' => ''])->isConfigured());
    }

    private function provider(): CapProvider
    {
        return $this->makeProvider();
    }
}