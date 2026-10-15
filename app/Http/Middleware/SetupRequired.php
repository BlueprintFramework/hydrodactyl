<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
        // Only cache the positive result — the setup surface disappears permanently
        // the moment the first user exists. An empty database is cached negatively
        // (i.e. not cached at all) so a just-created user is picked up immediately.
        if (Cache::get('pterodactyl.setup_complete')) {
            abort(404);
        }

        if (User::query()->exists()) {
            Cache::forever('pterodactyl.setup_complete', true);
            abort(404);
        }

        return $next($request);
    }
}
