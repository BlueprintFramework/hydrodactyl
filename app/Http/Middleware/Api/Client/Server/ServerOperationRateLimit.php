<?php

namespace Pterodactyl\Http\Middleware\Api\Client\Server;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerOperation;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Middleware to rate limit server operations.
 *
 * Prevents concurrent operations on the same server and provides monitoring
 * of operation attempts for analytics and troubleshooting.
 */
class ServerOperationRateLimit
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $operationType = 'general')
    {
        /** @var Server $server */
        $server = $request->route('server');

        $this->checkActiveOperations($server);

        return $next($request);
    }

    /**
     * Check for active operations on the same server.
     *
     * @throws TooManyRequestsHttpException
     */
    private function checkActiveOperations(Server $server): void
    {
        $hasActiveOperations = false;

        try {
            if (!$this->tableExists('server_operations')) {
                return;
            }

            $hasActiveOperations = ServerOperation::forServer($server)->active()->exists();
        } catch (\Exception $e) {
            // Fail open rather than blocking every operation when the database is
            // unavailable or the table cannot be inspected.
            Log::warning('Failed to check for active operations', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        if ($hasActiveOperations) {
            throw new TooManyRequestsHttpException(
                300,
                'Another operation is currently in progress for this server. Please wait for it to complete.'
            );
        }
    }

    /**
     * Check if a database table exists.
     *
     * Once a table has been confirmed to exist the result is cached forever, since
     * tables are only ever added by migrations and never lazily dropped at runtime.
     * A negative result is intentionally not cached so that a table created by a
     * later migration is picked up on the next request.
     */
    private function tableExists(string $tableName): bool
    {
        $cacheKey = 'pterodactyl.schema.' . $tableName;

        try {
            if (Cache::has($cacheKey)) {
                return (bool) Cache::get($cacheKey);
            }

            $exists = \Schema::hasTable($tableName);
            if ($exists) {
                Cache::forever($cacheKey, true);
            }

            return $exists;
        } catch (\Exception $e) {
            Log::warning('Failed to check if table exists', [
                'table' => $tableName,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}