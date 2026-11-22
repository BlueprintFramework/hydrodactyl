<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePasskeyPasswordConfirmation
{
    /**
     * The session key used by Laravel's password.confirm middleware.
     */
    public const SESSION_KEY = 'auth.password_confirmed_at';

    public function handle(Request $request, \Closure $next): Response
    {
        if (!self::isConfirmed($request)) {
            return response()->json([
                'message' => __('validation.json_api.password_confirmation_required'),
                'requires_password_confirmation' => true,
            ], Response::HTTP_LOCKED);
        }

        return $next($request);
    }

    /**
     * Determine whether the session has a fresh password confirmation.
     */
    public static function isConfirmed(Request $request): bool
    {
        $confirmedAt = (int) $request->session()->get(self::SESSION_KEY, 0);
        $timeout = (int) config('auth.password_timeout', 10800);

        return $confirmedAt > 0 && (time() - $confirmedAt) <= $timeout;
    }

    /**
     * Mark the current session as password confirmed.
     */
    public static function confirm(Request $request): void
    {
        $request->session()->put(self::SESSION_KEY, time());
    }
}
