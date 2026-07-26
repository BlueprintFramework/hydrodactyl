<?php

namespace Pterodactyl\Services\Nests;

use Pterodactyl\Models\Nest;
use Pterodactyl\Services\UuidService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

class NestCreationService
{
    /**
     * NestCreationService constructor.
     */
    public function __construct(private ConfigRepository $config, private NestRepositoryInterface $repository, private UuidService $uuidService)
    {
    }

    /**
     * Create a new nest on the system.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function handle(array $data, ?string $author = null): Nest
    {
        return $this->repository->create([
            'uuid' => $this->uuidService->uuid(),
            'author' => $author ?? $this->config->get('pterodactyl.service.author'),
            'name' => array_get($data, 'name'),
            'description' => array_get($data, 'description'),
        ], true, true);
    }
}
