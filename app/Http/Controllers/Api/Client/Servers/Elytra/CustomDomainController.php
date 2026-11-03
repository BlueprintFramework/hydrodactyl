<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ServerCustomDomain;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\Subdomain\CustomDomainService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain\StoreCustomDomainRequest;

class CustomDomainController extends ClientApiController
{
    public function __construct(private CustomDomainService $customDomainService)
    {
        parent::__construct();
    }

    /**
     * List the custom domains pointed at a server
     */
    public function index(Request $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_READ, $server);

        return new JsonResponse([
            'enabled' => $server->allowsCustomDomains(),
            'data' => $server->customDomains()
                ->orderBy('hostname')
                ->get()
                ->map(fn (ServerCustomDomain $customDomain) => $this->transform($customDomain->setRelation('server', $server)))
                ->values(),
        ]);
    }

    /**
     * Point a custom domain at a server
     */
    public function store(StoreCustomDomainRequest $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_UPDATE, $server);

        if (!$server->allowsCustomDomains()) {
            throw new DisplayException('Custom domains are not enabled for this server.');
        }

        $customDomain = $this->customDomainService->create(
            $server,
            $request->input('hostname'),
            $request->input('api_token'),
            $this->resolveAllocation($request, $server)
        );

        return new JsonResponse(['data' => $this->transform($customDomain)], JsonResponse::HTTP_CREATED);
    }

    /**
     * Change the subdomain or allocation of a custom domain
     */
    public function update(Request $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_UPDATE, $server);

        $request->merge(['subdomain' => trim(strtolower((string) $request->input('subdomain')), ". \t\n")]);
        $request->validate([
            'subdomain' => ['nullable', 'string', 'max:191', 'regex:/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/'],
            'allocation_id' => 'sometimes|nullable|integer',
        ]);

        $customDomain = $server->customDomains()->findOrFail((int) $request->route('customDomain'));
        $customDomain->setRelation('server', $server);

        // An empty subdomain points the root of the user's domain at the server.
        $subdomain = $request->input('subdomain');
        $hostname = $subdomain ? "{$subdomain}.{$customDomain->zone_name}" : $customDomain->zone_name;

        if (ServerCustomDomain::where('hostname', $hostname)->where('id', '!=', $customDomain->id)->exists()) {
            throw new DisplayException('This domain is already pointed at a server.');
        }

        $customDomain = $this->customDomainService->update(
            $customDomain,
            $hostname,
            $this->resolveAllocation($request, $server)
        );

        return new JsonResponse(['data' => $this->transform($customDomain)]);
    }

    /**
     * Remove a custom domain and its DNS records
     */
    public function destroy(Request $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_CUSTOM_DOMAIN_UPDATE, $server);

        $customDomain = $server->customDomains()->findOrFail((int) $request->route('customDomain'));

        $this->customDomainService->delete($customDomain->setRelation('server', $server));

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Resolve the allocation picked in the request, which has to belong to the server.
     *
     * @throws DisplayException
     */
    private function resolveAllocation(Request $request, Server $server): ?Allocation
    {
        if (!$request->filled('allocation_id')) {
            return null;
        }

        $allocation = $server->allocations()->find($request->integer('allocation_id'));

        if (!$allocation) {
            throw new DisplayException('The selected allocation is not assigned to this server.');
        }

        return $allocation;
    }

    /**
     * Map a custom domain into the shape consumed by the client interface.
     * The API token is never sent back.
     */
    private function transform(ServerCustomDomain $customDomain): array
    {
        $allocation = $customDomain->resolveAllocation();

        return [
            'id' => $customDomain->id,
            'hostname' => $customDomain->hostname,
            'zone_name' => $customDomain->zone_name,
            'allocation_id' => $allocation->id,
            'ip' => $allocation->ip,
            'port' => $allocation->port,
        ];
    }
}
