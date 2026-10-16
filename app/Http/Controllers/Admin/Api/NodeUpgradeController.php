<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\HttpFoundation\Response;
use Pterodactyl\Services\Daemons\DaemonVersionService;
use Pterodactyl\Repositories\Daemons\DaemonUpgradeRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * Hand a node a fresh binary to install and restart into.
 *
 * The daemon-side endpoint and restart service are backend specific and come
 * from config/daemons.php; backends without a self-upgrade endpoint are
 * rejected with a 422.
 */
class NodeUpgradeController extends Controller
{
    public function __construct(
        private DaemonVersionService $versions,
        private DaemonUpgradeRepository $repository,
    ) {
    }

    public function store(Request $request, Node $node): JsonResponse
    {
        $data = $request->validate([
            'url' => 'required|string',
            'sha256' => 'required|string|size:64',
            'headers' => 'sometimes|array',
            'restart_command' => 'sometimes|string',
            'restart_command_args' => 'sometimes|array',
        ]);

        $type = DaemonType::tryFrom(strtolower((string) $node->daemonType));
        $endpoint = $type ? $this->versions->upgradeEndpoint($type) : null;

        if (!$type || !$endpoint) {
            return new JsonResponse([
                'error' => 'This daemon does not support remote upgrades.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $result = $this->repository->setNode($node)->upgradeAt(
                $endpoint,
                $data['url'],
                $data['sha256'],
                $data['headers'] ?? [],
                $data['restart_command'] ?? 'systemctl',
                $data['restart_command_args'] ?? ['restart', $this->versions->restartService($type)],
            );
        } catch (DaemonConnectionException $exception) {
            return new JsonResponse([
                'error' => 'The panel could not reach the node.',
                'detail' => $exception->getMessage(),
            ], Response::HTTP_BAD_GATEWAY);
        }

        return new JsonResponse($result, Response::HTTP_ACCEPTED);
    }
}
