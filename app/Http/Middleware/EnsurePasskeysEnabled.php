<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasskeysEnabled
{
    public function handle(Request $request, \Closure $next): Response
    {
        if (!config('passkeys.enabled', true)) {
            abort(404);
        }

        return $next($request);
    }
}
