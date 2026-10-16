<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Helpers\SoftwareVersionService;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

/**
 * Exposes whether the running panel is up to date with the latest release
 * published on the CDN. The daemon equivalent is returned alongside each
 * node's status (see NodesController::status).
 */
class VersionController extends Controller
{
    /**
     * VersionController constructor.
     */
    public function __construct(
        private ConfigRepository $config,
        private SoftwareVersionService $versionService,
    ) {
    }

    /**
     * Return the current and latest panel version.
     */
    public function index(): JsonResponse
    {
        $latest = $this->versionService->getPanel();
        $latest = $latest === 'error' ? null : $latest;

        return response()->json([
            'data' => [
                'current' => $this->config->get('app.version'),
                'latest' => $latest,
                'up_to_date' => $latest !== null ? $this->versionService->isLatestPanel() : null,
            ],
        ]);
    }
}
