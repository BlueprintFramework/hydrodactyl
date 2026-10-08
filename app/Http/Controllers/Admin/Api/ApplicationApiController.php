<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\Request;
use Pterodactyl\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Api\KeyCreationService;
use Pterodactyl\Contracts\Repository\ApiKeyRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Api\StoreApplicationApiKeyRequest;

class ApplicationApiController extends Controller
{
    /**
     * ApplicationApiController constructor.
     */
    public function __construct(
        private ApiKeyRepositoryInterface $repository,
        private KeyCreationService $keyCreationService,
    ) {
    }

    /**
     * Return the current user's application API keys and the available permission options.
     */
    public function index(Request $request): JsonResponse
    {
        $resources = AdminAcl::getResourceList();
        sort($resources);

        return response()->json([
            'data' => $this->repository->getApplicationKeys($request->user())
                ->map(fn (ApiKey $key) => [
                    'identifier' => $key->identifier,
                    'key' => $key->identifier . decrypt($key->token),
                    'memo' => $key->memo,
                    'last_used_at' => $key->last_used_at?->toIso8601String(),
                    'created_at' => $key->created_at?->toIso8601String(),
                ])
                ->values(),
            'resources' => $resources,
            'permissions' => [
                'read' => AdminAcl::READ,
                'read_write' => AdminAcl::READ | AdminAcl::WRITE,
                'none' => AdminAcl::NONE,
            ],
        ]);
    }

    /**
     * Create a new application API key for the current user.
     */
    public function store(StoreApplicationApiKeyRequest $request): JsonResponse
    {
        $key = $this->keyCreationService->setKeyType(ApiKey::TYPE_APPLICATION)->handle([
            'memo' => $request->input('memo'),
            'user_id' => $request->user()->id,
        ], $request->getKeyPermissions());

        return response()->json([
            'data' => [
                'identifier' => $key->identifier,
                'key' => $key->identifier . decrypt($key->token),
            ],
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * Revoke an application API key.
     */
    public function destroy(Request $request, string $identifier): JsonResponse
    {
        $this->repository->deleteApplicationKey($request->user(), $identifier);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
