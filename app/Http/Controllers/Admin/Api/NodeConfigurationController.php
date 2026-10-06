<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;

class NodeConfigurationController extends Controller
{
    /**
     * Return the generated daemon configuration and auto-deploy command for a node.
     */
    public function index(Node $node): JsonResponse
    {
        return response()->json([
            'yaml' => $node->getYamlConfiguration(),
            'auto_deploy' => $node->getAutoDeploy('PLACEHOLDER_TOKEN'),
        ]);
    }
}
