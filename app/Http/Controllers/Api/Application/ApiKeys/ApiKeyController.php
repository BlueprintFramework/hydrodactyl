<?php

namespace Pterodactyl\Http\Controllers\Api\Application\ApiKeys;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\ApiKey;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Api\KeyCreationService;
use Pterodactyl\Transformers\Api\Application\ApiKeyTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\GetApiKeysRequest;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\GetApiKeyRequest;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\StoreApiKeyRequest;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\UpdateApiKeyRequest;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\DeleteApiKeyRequest;

class ApiKeyController extends ApplicationApiController
{
    public function __construct(
        private KeyCreationService $creationService,
    ) {
        parent::__construct();
    }

    public function index(GetApiKeysRequest $request): array
    {
        $keys = QueryBuilder::for(ApiKey::query())
            ->allowedFilters(['memo', 'key_type'])
            ->allowedSorts(['id', 'created_at'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($keys)
            ->transformWith($this->getTransformer(ApiKeyTransformer::class))
            ->toArray();
    }

    public function view(GetApiKeyRequest $request, ApiKey $key): array
    {
        return $this->fractal->item($key)
            ->transformWith($this->getTransformer(ApiKeyTransformer::class))
            ->toArray();
    }

    public function store(StoreApiKeyRequest $request): JsonResponse
    {
        $key = $this->creationService
            ->setKeyType(ApiKey::TYPE_APPLICATION)
            ->handle(array_merge($request->validated(), [
                'user_id' => $request->user()->id,
            ]), $request->permissions() ?? []);

        return $this->fractal->item($key)
            ->transformWith($this->getTransformer(ApiKeyTransformer::class))
            ->addMeta([
                'resource' => route('api.application.api-keys.view', [
                    'key' => $key->id,
                ]),
                'token' => decrypt($key->token),
            ])
            ->respond(201);
    }

    public function update(UpdateApiKeyRequest $request, ApiKey $key): array
    {
        $data = $request->validated();
        $data = array_merge($data, $request->permissions() ?? []);

        $key->forceFill($data)->save();

        return $this->fractal->item($key->refresh())
            ->transformWith($this->getTransformer(ApiKeyTransformer::class))
            ->toArray();
    }

    public function delete(DeleteApiKeyRequest $request, ApiKey $key): Response
    {
        $key->delete();

        return response('', 204);
    }
}
