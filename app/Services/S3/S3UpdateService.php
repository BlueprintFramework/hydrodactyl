<?php

namespace Pterodactyl\Services\S3;

use Pterodactyl\Models\S3;
use Pterodactyl\Contracts\Repository\S3RepositoryInterface;

class S3UpdateService
{
    public function __construct(
        private S3RepositoryInterface $repository,
    ) {
    }

    public function handle(S3 $s3, array $data): S3
    {
        $this->repository->update($s3->id, $data);

        return $s3->refresh();
    }
}
