<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerResourceSample;
use Pterodactyl\Transformers\Api\Client\ResourceSampleTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;
use Pterodactyl\Services\Servers\RecordServerResourceSampleService;

class ResourceHistoryController extends ClientApiController
{
    public function __construct(private RecordServerResourceSampleService $samples)
    {
        parent::__construct();
    }

    /**
     * The recent resource samples for a server, oldest first, so the console
     * graphs can be drawn before the websocket sends anything.
     */
    public function __invoke(GetServerRequest $request, Server $server): array
    {
        $samples = ServerResourceSample::query()
            ->where('server_id', $server->id)
            ->orderByDesc('recorded_at')
            ->limit($this->samples->limit())
            ->get()
            ->reverse()
            ->values();

        return $this->fractal->collection($samples)
            ->transformWith($this->getTransformer(ResourceSampleTransformer::class))
            ->toArray();
    }
}
