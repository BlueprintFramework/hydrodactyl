<?php

namespace Pterodactyl\Http\Middleware\Api\Client\Server;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckDaemonType
{
    public function handle(Request $request, Closure $next, string $daemon)
    {
        $server = $request->attributes->get('server');
        $daemonType = $server->node->daemonType;

        if (! $daemonType) {
            abort(404);
        }

        if ($daemonType !== $daemon) {
            abort(400, __('exceptions.middleware.daemon_type_mismatch', ['daemon' => $daemon, 'daemon_type' => $daemonType]));
        }

        return $next($request);
    }
}
