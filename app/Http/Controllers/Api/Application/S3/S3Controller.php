<?php

namespace Pterodactyl\Http\Controllers\Api\Application\S3;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\S3;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\S3\S3CreationService;
use Pterodactyl\Services\S3\S3UpdateService;
use Pterodactyl\Services\S3\S3DeletionService;
use Pterodactyl\Transformers\Api\Application\S3Transformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\S3\GetBucketsRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\GetBucketRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\StoreBucketRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\UpdateBucketRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\DeleteBucketRequest;

class S3Controller extends ApplicationApiController
{
    public function __construct(
        private S3CreationService $creationService,
        private S3UpdateService $updateService,
        private S3DeletionService $deletionService,
    ) {
        parent::__construct();
    }

    public function index(GetBucketsRequest $request): array
    {
        $buckets = QueryBuilder::for(S3::query())
            ->allowedFilters(['name'])
            ->allowedSorts(['name', 'id'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($buckets)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->toArray();
    }

    public function view(GetBucketRequest $request, S3 $bucket): array
    {
        return $this->fractal->item($bucket)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->toArray();
    }

    public function store(StoreBucketRequest $request): JsonResponse
    {
        $bucket = $this->creationService->handle($request->validated());

        return $this->fractal->item($bucket)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->addMeta([
                'resource' => route('api.application.buckets.view', [
                    'bucket' => $bucket->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateBucketRequest $request, S3 $bucket): array
    {
        $bucket = $this->updateService->handle($bucket, $request->validated());

        return $this->fractal->item($bucket)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->toArray();
    }

    public function delete(DeleteBucketRequest $request, S3 $bucket): Response
    {
        $this->deletionService->handle($bucket);

        return response('', 204);
    }
}
