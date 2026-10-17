<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\HttpFoundation\Response;
use Pterodactyl\Repositories\Calagopus\CalagopusRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * Surface the Calagopus-only node endpoints (system info, stats and logs) to
 * the admin API. These are unavailable on stock Wings.
 */
class NodeCalagopusController extends Controller
{
    public function __construct(private CalagopusRepository $repository)
    {
    }

    /**
     * Basic system/version information for the node.
     */
    public function system(Node $node): JsonResponse
    {
        try {
            return new JsonResponse($this->repository->setNode($node)->getSystem());
        } catch (DaemonConnectionException $exception) {
            return $this->connectionError($exception);
        }
    }

    /**
     * Live resource statistics for the node.
     */
    public function stats(Node $node): JsonResponse
    {
        try {
            return new JsonResponse($this->repository->setNode($node)->getStats());
        } catch (DaemonConnectionException $exception) {
            return $this->connectionError($exception);
        }
    }

    /**
     * List the log files available on the node.
     */
    public function logs(Node $node): JsonResponse
    {
        try {
            return new JsonResponse($this->repository->setNode($node)->getLogs());
        } catch (DaemonConnectionException $exception) {
            return $this->connectionError($exception);
        }
    }

    /**
     * Read (and optionally tail) a single log file.
     */
    public function log(Request $request, Node $node, string $file): Response
    {
        $lines = $request->integer('lines') ?: null;

        try {
            $contents = $this->repository->setNode($node)->getLog($file, $lines);
        } catch (DaemonConnectionException $exception) {
            return $this->connectionError($exception);
        }

        return new Response($contents, Response::HTTP_OK, ['Content-Type' => 'text/plain']);
    }

    private function connectionError(DaemonConnectionException $exception): JsonResponse
    {
        return new JsonResponse([
            'error' => __('exceptions.admin.calagopus_unreachable'),
            'detail' => $exception->getMessage(),
        ], Response::HTTP_BAD_GATEWAY);
    }
}
