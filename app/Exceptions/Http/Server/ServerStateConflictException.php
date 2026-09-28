<?php

namespace Pterodactyl\Exceptions\Http\Server;

use Pterodactyl\Models\Server;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ServerStateConflictException extends ConflictHttpException
{
    /**
     * Exception thrown when the server is in an unsupported state for API access or
     * certain operations within the codebase.
     */
    public function __construct(Server $server, ?\Throwable $previous = null)
    {
        $message = __('exceptions.server_state.unsupported');
        if ($server->isSuspended()) {
            $message = __('exceptions.server_state.suspended');
        } elseif ($server->node->isUnderMaintenance()) {
            $message = __('exceptions.server_state.node_maintenance');
        } elseif (!$server->isInstalled()) {
            $message = __('exceptions.server_state.installing');
        } elseif ($server->status === Server::STATUS_RESTORING_BACKUP) {
            $message = __('exceptions.server_state.restoring');
        } elseif (!is_null($server->transfer)) {
            $message = __('exceptions.server_state.transferring');
        }

        parent::__construct($message, $previous);
    }
}
