<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\ServerResourceSample;

class ResourceSampleTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return ServerResourceSample::RESOURCE_NAME;
    }

    public function transform(ServerResourceSample $sample): array
    {
        return [
            'cpu_absolute' => $sample->cpu_absolute,
            'memory_bytes' => $sample->memory_bytes,
            'network_rx_bytes' => $sample->network_rx_bytes,
            'network_tx_bytes' => $sample->network_tx_bytes,
            'uptime' => $sample->uptime,
            'recorded_at' => $sample->recorded_at->toAtomString(),
        ];
    }
}
