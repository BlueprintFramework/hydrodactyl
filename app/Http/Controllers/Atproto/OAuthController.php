<?php

namespace Pterodactyl\Http\Controllers\Atproto;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Models\AtprotoOauthSession;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Atproto\AtprotoOAuthService;
use Pterodactyl\Exceptions\Atproto\AtprotoOAuthException;

/**
 * Public endpoints for the AT Protocol OAuth client. These must be reachable
 * without authentication: the client metadata document is fetched by PDS
 * instances, and the callback is the browser redirect target.
 */
class OAuthController extends Controller
{
    public function __construct(private AtprotoOAuthService $service)
    {
    }

    /**
     * The OAuth client metadata document.
     */
    public function metadata(): JsonResponse
    {
        return response()->json($this->service->clientMetadata());
    }

    /**
     * Handle the authorization server redirect.
     */
    public function callback(Request $request): RedirectResponse
    {
        $state = $request->query('state');
        $pending = is_string($state) && $state !== ''
            ? AtprotoOauthSession::query()->where('state', $state)->first()
            : null;

        $return = $this->safeReturnUrl($pending?->return_url);

        try {
            $session = $this->service->complete(
                is_string($state) ? $state : null,
                $this->stringParam($request, 'code'),
                $this->stringParam($request, 'iss'),
                $this->stringParam($request, 'error'),
            );
        } catch (AtprotoOAuthException $exception) {
            return redirect()->to($this->appendQuery($return, ['atproto_error' => $exception->getMessage()]));
        }

        return redirect()->to($this->appendQuery($return, ['atproto_session' => $session->id]));
    }

    private function stringParam(Request $request, string $key): ?string
    {
        $value = $request->query($key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * Only allow returning to a local admin path, never an external URL.
     */
    private function safeReturnUrl(?string $url): string
    {
        if (is_string($url) && str_starts_with($url, '/') && !str_starts_with($url, '//')) {
            return $url;
        }

        return '/admin/settings/domains';
    }

    private function appendQuery(string $url, array $parameters): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url . $separator . http_build_query($parameters);
    }
}
