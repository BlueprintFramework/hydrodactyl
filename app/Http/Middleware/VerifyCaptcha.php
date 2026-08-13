<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Services\Captcha\CaptchaManager;
use Pterodactyl\Exceptions\DisplayException;

class VerifyCaptcha
{
    protected CaptchaManager $captcha;

    public function __construct(CaptchaManager $captcha)
    {
        $this->captcha = $captcha;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip verification if captcha is not enabled
        $defaultDriver = $this->captcha->getDefaultDriver();

        if ($defaultDriver === 'none') {
            return $next($request);
        }

        // Get the captcha response from the request
        $driver = $this->captcha->driver();
        $fieldName = $driver->getResponseFieldName();
        $captchaResponse = $request->input($fieldName);

        if (empty($captchaResponse)) {
            Log::warning('Captcha verification failed - no response provided', [
                'field_name' => $fieldName,
                'request_data' => $request->all(),
            ]);
            throw new DisplayException('Please complete the captcha verification.');
        }

        // Verify the captcha response
        $remoteIp = $request->ip();
        $verificationResult = $this->captcha->verify($captchaResponse, $remoteIp);

        if (!$verificationResult) {
            Log::warning('Captcha verification failed - verification returned false');
            throw new DisplayException('Captcha verification failed. Please try again.');
        }

        return $next($request);
    }
}
