<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Models\AtprotoOauthSession;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Atproto\AtprotoOAuthService;
use Pterodactyl\Exceptions\Atproto\AtprotoOAuthException;

/**
 * Admin facing endpoints for connecting and managing AT Protocol OAuth
 * accounts used by the Marque DNS provider.
 */
class AtprotoOAuthController extends Controller
{
    private const DEFAULT_RETURN_URL = '/admin/settings/domains';

    public function __construct(private AtprotoOAuthService $service)
    {
    }

    /**
     * Kick off the authorization flow and redirect the admin to the PDS.
     */
    public function start(Request $request): RedirectResponse
    {
        $return = $this->safeReturnUrl($request->query('return'));
        $identifier = trim((string) $request->query('identifier', ''));

        if ($identifier === '') {
            return redirect()->to($this->appendQuery($return, ['atproto_error' => __('exceptions.atproto.enter_identifier')]));
        }

        try {
            $url = $this->service->begin($identifier, $return);
        } catch (AtprotoOAuthException $exception) {
            return redirect()->to($this->appendQuery($return, ['atproto_error' => $exception->getMessage()]));
        }

        return redirect()->away($url);
    }

    /**
     * List the authorized accounts available to attach to a domain.
     */
    public function index(): JsonResponse
    {
        $sessions = AtprotoOauthSession::query()
            ->where('status', AtprotoOauthSession::STATUS_AUTHORIZED)
            ->orderByDesc('authorized_at')
            ->get()
            ->map(fn (AtprotoOauthSession $session) => [
                'id' => $session->id,
                'handle' => $session->handle,
                'did' => $session->account_did,
                'authorized_at' => $session->authorized_at?->toIso8601String(),
            ])
            ->values();

        return response()->json(['data' => $sessions]);
    }

    /**
     * Revoke the panel's stored tokens for an account.
     */
    public function destroy(AtprotoOauthSession $session): JsonResponse
    {
        $session->delete();

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    private function safeReturnUrl(?string $url): string
    {
        if (is_string($url) && str_starts_with($url, '/') && !str_starts_with($url, '//')) {
            return $url;
        }

        return self::DEFAULT_RETURN_URL;
    }

    private function appendQuery(string $url, array $parameters): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url . $separator . http_build_query($parameters);
    }
}
