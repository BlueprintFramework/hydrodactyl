<?php

namespace Pterodactyl\Exceptions\Service\Allocation;

use Pterodactyl\Exceptions\DisplayException;

class InvalidPortMappingException extends DisplayException
{
    /**
     * InvalidPortMappingException constructor.
     */
    public function __construct(mixed $port)
    {
        parent::__construct(__('exceptions.allocations.invalid_mapping', ['port' => $port]));
    }
}
