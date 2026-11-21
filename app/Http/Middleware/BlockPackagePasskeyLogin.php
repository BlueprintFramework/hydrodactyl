<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockPackagePasskeyLogin
{
    /**
     * The package registers a passwordless login route before the panel's
     * TOTP-aware controller in some provider orders. That route must never be
     * reachable: it would sign a TOTP-protected user in without the checkpoint.
     */
    public function handle(Request $request, \Closure $next): Response
    {
        if ($request->is('passkeys/login') || $request->is('passkeys/login/options')) {
            abort(404);
        }

        return $next($request);
    }
}
