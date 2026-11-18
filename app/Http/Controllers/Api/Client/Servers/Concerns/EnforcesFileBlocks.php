<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Concerns;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Exceptions\Http\HttpForbiddenException;
use Pterodactyl\Services\Files\FileBlockService;

trait EnforcesFileBlocks
{
    abstract protected function getFileBlockService(): FileBlockService;

    protected function assertPathNotBlocked(Server $server, User $user, string $path): void
    {
        if ($this->getFileBlockService()->isBlocked($server, $user, $path)) {
            throw new HttpForbiddenException(__('exceptions.client.files.blocked'));
        }
    }

    /**
     * @param  string[]  $names
     */
    protected function assertNamesNotBlocked(Server $server, User $user, string $root, array $names): void
    {
        $service = $this->getFileBlockService();

        foreach ($names as $name) {
            $this->assertPathNotBlocked($server, $user, $service->join($root, $name));
        }
    }
}
