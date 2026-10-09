<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Enums\Subdomain\Providers;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Pterodactyl\Http\Requests\Admin\Settings\DomainFormRequest;

class DomainsController extends Controller
{
    /**
     * DNS providers that can actually be saved (see DomainFormRequest).
     */
    private const ALLOWED_PROVIDERS = ['cloudflare', 'hetzner', 'route53', 'bunny', 'spaceship'];

    /**
     * Return every configured domain along with the available providers.
     */
    public function index(): JsonResponse
    {
        $domains = Domain::withCount(['serverSubdomains', 'activeSubdomains'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $domains->map(fn (Domain $domain) => $this->transform($domain))->values(),
            'providers' => collect(Providers::allWithDescriptions())->only(self::ALLOWED_PROVIDERS)->all(),
        ]);
    }

    /**
     * Return the configuration schema for a DNS provider.
     */
    public function schema(string $provider): JsonResponse
    {
        $schema = (new ($this->providerClass($provider))([]))->getConfigurationSchema();

        return response()->json(['data' => $schema]);
    }

    /**
     * Create a new domain.
     */
    public function store(DomainFormRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->assertConnection($data['dns_provider'], $data['dns_config']);

        $domain = DB::transaction(function () use ($data) {
            if (!empty($data['is_default'])) {
                Domain::where('is_default', true)->update(['is_default' => false]);
            }

            return Domain::create([
                'name' => $data['name'],
                'dns_provider' => $data['dns_provider'],
                'dns_config' => $data['dns_config'],
                'is_active' => $data['is_active'] ?? true,
                'is_default' => $data['is_default'] ?? false,
            ]);
        });

        return response()->json(['data' => $this->transform($domain)], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing domain.
     */
    public function update(DomainFormRequest $request, Domain $domain): JsonResponse
    {
        $data = $request->validated();

        if ($data['dns_config'] !== $domain->dns_config || $data['dns_provider'] !== $domain->dns_provider) {
            $this->assertConnection($data['dns_provider'], $data['dns_config']);
        }

        DB::transaction(function () use ($data, $domain) {
            $newIsDefault = $data['is_default'] ?? false;

            if ($newIsDefault && !$domain->is_default) {
                Domain::where('is_default', true)->update(['is_default' => false]);
            } elseif (!$newIsDefault && $domain->is_default && Domain::where('is_default', true)->count() <= 1) {
                throw new DisplayException('At least one domain must remain set as the default.');
            }

            $domain->update([
                'name' => $data['name'],
                'dns_provider' => $data['dns_provider'],
                'dns_config' => $data['dns_config'],
                'is_active' => $data['is_active'] ?? $domain->is_active,
                'is_default' => $newIsDefault,
            ]);
        });

        return response()->json(['data' => $this->transform($domain->refresh())]);
    }

    /**
     * Delete a domain.
     */
    public function destroy(Domain $domain): JsonResponse
    {
        if ($domain->activeSubdomains()->count() > 0) {
            throw new DisplayException('Cannot delete a domain that still has active subdomains.');
        }

        if ($domain->is_default && Domain::where('is_default', true)->count() <= 1) {
            throw new DisplayException('Cannot delete the only default domain.');
        }

        $domain->delete();

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Test a DNS provider connection without persisting anything.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dns_provider' => 'required|string',
            'dns_config' => 'required|array',
        ]);

        try {
            $this->assertConnection($data['dns_provider'], $data['dns_config']);
        } catch (\Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return response()->json(['message' => 'Connection successful.']);
    }

    /**
     * Verify the provider accepts the given configuration.
     *
     * @throws ValidationException
     */
    private function assertConnection(string $provider, array $config): void
    {
        try {
            (new ($this->providerClass($provider))($config))->testConnection();
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages(['dns_config' => $exception->getMessage()]);
        }
    }

    /**
     * Resolve a provider key to its implementation class.
     */
    private function providerClass(string $provider): string
    {
        if (!in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            throw new DnsProviderException("Unsupported DNS provider: {$provider}");
        }

        return Providers::getClass($provider);
    }

    /**
     * Map a domain model into the shape consumed by the admin interface.
     */
    private function transform(Domain $domain): array
    {
        return [
            'id' => $domain->id,
            'name' => $domain->name,
            'dns_provider' => $domain->dns_provider,
            'dns_config' => $domain->dns_config,
            'is_active' => (bool) $domain->is_active,
            'is_default' => (bool) $domain->is_default,
            'subdomains_count' => (int) ($domain->server_subdomains_count ?? 0),
            'active_subdomains_count' => (int) ($domain->active_subdomains_count ?? 0),
            'created_at' => $domain->created_at?->toIso8601String(),
        ];
    }
}
