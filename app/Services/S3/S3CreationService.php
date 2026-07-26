<?php

namespace Pterodactyl\Services\S3;

use Pterodactyl\Models\S3;
use Pterodactyl\Contracts\Repository\S3RepositoryInterface;

class S3CreationService
{
    public function __construct(
        private S3RepositoryInterface $repository,
    ) {
    }

    public function handle(array $data): S3
    {
        return $this->repository->create($data);
    }
}
