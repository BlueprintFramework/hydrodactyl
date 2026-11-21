<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

use Pterodactyl\Models\Server;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ListFileBlocksRequest extends ClientApiRequest
{
    public function authorize(): bool
    {
        /** @var Server $server */
        $server = $this->route()->parameter('server');

        return $this->user()->root_admin || $this->user()->id === $server->owner_id;
    }
}
