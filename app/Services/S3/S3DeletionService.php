<?php

namespace Pterodactyl\Services\S3;

use Pterodactyl\Models\S3;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Contracts\Repository\S3RepositoryInterface;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class S3DeletionService
{
    public function __construct(
        protected S3RepositoryInterface $repository,
        protected ServerRepositoryInterface $serverRepository,
        protected Translator $translator,
    ) {
    }

    public function handle(S3|int $s3): bool
    {
        $id = $s3 instanceof S3 ? $s3->id : $s3;

        if ($this->serverRepository->findCountWhere([['s3_id', '=', $id]]) > 0) {
            throw new DisplayException($this->translator->get('Cannot delete: in use by servers'));
        }

        return $this->repository->delete($id);
    }
}
