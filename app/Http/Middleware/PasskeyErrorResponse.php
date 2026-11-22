<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PasskeyErrorResponse
{
    /**
     * The @laravel/passkeys browser client reads the error text from a
     * top-level "message" field. The panel's JSON:API error envelope uses
     * errors[].detail, so mirror it for passkey requests.
     */
    public function handle(Request $request, \Closure $next): Response
    {
        $response = $next($request);

        if ($response instanceof JsonResponse && ($response->isClientError() || $response->isServerError())) {
            $data = $response->getData(true);

            if (is_array($data) && !isset($data['message']) && isset($data['errors'][0]['detail'])) {
                $data['message'] = $data['errors'][0]['detail'];
                $response->setData($data);
            }
        }

        return $response;
    }
}
