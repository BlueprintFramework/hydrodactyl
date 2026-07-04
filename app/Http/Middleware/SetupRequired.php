<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the first-run setup routes.
 *
 * The setup flow is the only unauthenticated endpoint capable of creating an
 * account with administrator privileges. Once any user has been created on the
 * system — administrator or not — this middleware hard-fails every setup route
 * with a 404, so the surface simply disappears once installation is complete.
 */
class SetupRequired
{
    public function handle(Request $request, Closure $next): Response
    {
        if (User::query()->exists()) {
            abort(404);
        }

        return $next($request);
    }
}
