<?php

namespace Pterodactyl\Services\Subdomain;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\ServerCustomDomain;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Pterodactyl\Services\Dns\Providers\CloudflareProvider;
use Pterodactyl\Services\Subdomain\Features\MinecraftSubdomainFeature;

class CustomDomainService
{
    public function __construct(private SubdomainManagementService $subdomainService)
    {
    }

    /**
     * Custom domains are only available on Minecraft servers, as other games
     * don't resolve the SRV record the same way.
     */
    public function supports(Server $server): bool
    {
        return $this->subdomainService->getServerSubdomainFeature($server) instanceof MinecraftSubdomainFeature;
    }

    /**
     * Point a hostname on the user's own Cloudflare account at a server and
     * create its DNS records straight away.
     *
     * @throws DisplayException
     */
    public function create(Server $server, string $hostname, string $apiToken, ?Allocation $allocation = null): ServerCustomDomain
    {
        if (!$this->supports($server)) {
            throw new DisplayException('Custom domains are only available on Minecraft servers.');
        }

        if ($server->customDomains()->exists()) {
            throw new DisplayException('This server already has a custom domain. Edit or remove it first.');
        }

        $provider = $this->provider(['api_token' => $apiToken]);

        try {
            $zone = $provider->findZone($hostname);
        } catch (DnsProviderException $exception) {
            throw new DisplayException(
                $this->tokenWasRejected($exception)
                    ? 'Cloudflare rejected this API token. Check that it has the Zone > DNS > Edit permission.'
                    : 'Could not reach Cloudflare. Try again in a moment.'
            );
        }

        if (!$zone) {
            throw new DisplayException("Could not find a Cloudflare domain for {$hostname} with this API token.");
        }

        $config = ['api_token' => $apiToken, 'zone_id' => $zone['id']];
        $provider = $this->provider($config);

        $this->assertHostnameIsFree($provider, $zone['name'], $hostname);

        $customDomain = new ServerCustomDomain([
            'server_id' => $server->id,
            'allocation_id' => $allocation && $allocation->id !== $server->allocation_id ? $allocation->id : null,
            'hostname' => $hostname,
            'zone_name' => $zone['name'],
            'dns_config' => $config,
            'dns_records' => [],
        ]);
        $customDomain->setRelation('server', $server);

        $this->createRecords($provider, $customDomain);

        return $customDomain;
    }

    /**
     * Move a custom domain to another name inside the same Cloudflare domain
     * and/or another allocation, updating its DNS records to match.
     *
     * @throws DisplayException
     */
    public function update(ServerCustomDomain $customDomain, string $hostname, ?Allocation $allocation = null): ServerCustomDomain
    {
        $server = $customDomain->server;
        $allocationId = $allocation && $allocation->id !== $server->allocation_id ? $allocation->id : null;

        if ($hostname === $customDomain->hostname) {
            $customDomain->allocation_id = $allocationId;

            try {
                $this->sync($customDomain);
            } catch (DnsProviderException $exception) {
                throw $this->displayException($exception);
            }

            return $customDomain;
        }

        $provider = $this->provider($customDomain->dns_config);

        try {
            $this->assertHostnameIsFree($provider, $customDomain->zone_name, $hostname);
        } catch (DnsProviderException $exception) {
            throw $this->displayException($exception);
        }

        // Record names can't be changed in place, so create the new set
        // before removing the old one to avoid a gap.
        $previousRecords = $customDomain->dns_records ?? [];
        $customDomain->hostname = $hostname;
        $customDomain->allocation_id = $allocationId;

        $this->createRecords($provider, $customDomain);
        $this->deleteRecords($provider, $customDomain->zone_name, $previousRecords);

        return $customDomain;
    }

    /**
     * Bring a custom domain's DNS records in line with the server's current
     * address and port.
     */
    public function sync(ServerCustomDomain $customDomain): void
    {
        $provider = $this->provider($customDomain->dns_config);
        $zone = $customDomain->zone_name;

        $records = $this->buildRecords($customDomain);
        $existing = $customDomain->dns_records ?? [];
        $recordIds = [];

        foreach ($records as $index => $record) {
            if (isset($existing[$index])) {
                $provider->updateRecord($zone, $existing[$index], $record['content'], $record['ttl'] ?? null);
                $recordIds[] = $existing[$index];
            } else {
                $recordIds[] = $provider->createRecord(
                    $zone,
                    $record['name'],
                    $record['type'],
                    $record['content'],
                    $record['ttl'] ?? 300
                );
            }
        }

        // The record count changes when the port moves on or off the game's default.
        $this->deleteRecords($provider, $zone, array_slice($existing, count($records)));

        $customDomain->update(['dns_records' => $recordIds]);
    }

    /**
     * Sync every custom domain on a server, or only the ones pointing at the
     * given allocation. Failures are logged so they never block the change
     * that triggered the sync.
     */
    public function syncForServer(Server $server, ?Allocation $allocation = null): void
    {
        // Reload so the records are built from the saved state, not from
        // relations that were loaded before the change being synced.
        $server = $server->fresh();

        foreach ($server->customDomains as $customDomain) {
            $customDomain->setRelation('server', $server);

            if ($allocation && $customDomain->resolveAllocation()->id !== $allocation->id) {
                continue;
            }

            try {
                $this->sync($customDomain);
                Log::info("Updated DNS records for custom domain {$customDomain->hostname}");
            } catch (\Exception $e) {
                Log::error("Failed to update DNS records for custom domain {$customDomain->hostname}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Remove a custom domain along with its DNS records.
     */
    public function delete(ServerCustomDomain $customDomain): void
    {
        try {
            $this->deleteRecords(
                $this->provider($customDomain->dns_config),
                $customDomain->zone_name,
                $customDomain->dns_records ?? []
            );
        } catch (\Exception $e) {
            Log::warning("DNS provider unavailable while deleting custom domain {$customDomain->hostname}: {$e->getMessage()}");
        }

        $customDomain->delete();
    }

    /**
     * Build the DNS records for a custom domain from the server's game type
     * and the allocation the domain points at.
     */
    private function buildRecords(ServerCustomDomain $customDomain): array
    {
        $hostname = $customDomain->hostname;

        // The record generators read the address off the primary allocation, so
        // hand them a copy of the server that has the chosen one in its place.
        $server = (clone $customDomain->server)->setRelation('allocation', $customDomain->resolveAllocation());

        $feature = $this->subdomainService->getServerSubdomainFeature($server);
        if (!$feature instanceof MinecraftSubdomainFeature) {
            throw new \Exception('Server no longer supports custom domains.');
        }

        $records = $feature->getDnsRecords($server, $hostname, $customDomain->zone_name);

        foreach ($records as &$record) {
            if ($record['type'] !== 'SRV' || !is_array($record['content'])) {
                continue;
            }

            // The generators build the target from the first label only, which
            // is wrong for a root domain or a multi-level name.
            $content = $record['content'];
            $record['content']['target'] = $hostname;
            $record['content']['content'] = "SRV {$content['priority']} {$content['weight']} {$content['port']} {$hostname}";
        }

        return $this->subdomainService->normalizeIpAddresses($records, $server);
    }

    /**
     * Create a custom domain's DNS records and save it. Nothing is left
     * behind in Cloudflare if any step fails.
     *
     * @throws DisplayException
     */
    private function createRecords(CloudflareProvider $provider, ServerCustomDomain $customDomain): void
    {
        $recordIds = [];

        try {
            foreach ($this->buildRecords($customDomain) as $record) {
                $recordIds[] = $provider->createRecord(
                    $customDomain->zone_name,
                    $record['name'],
                    $record['type'],
                    $record['content'],
                    $record['ttl'] ?? 300
                );
            }

            $customDomain->dns_records = $recordIds;
            $customDomain->saveOrFail();
        } catch (\Throwable $exception) {
            $this->deleteRecords($provider, $customDomain->zone_name, $recordIds);

            if ($exception instanceof DnsProviderException) {
                throw $this->displayException($exception);
            }

            throw $exception;
        }
    }

    /**
     * Adding a second address record next to one the user already has would
     * split their traffic between the two, so make them remove it first.
     *
     * @throws DisplayException
     */
    private function assertHostnameIsFree(CloudflareProvider $provider, string $zone, string $hostname): void
    {
        foreach (['A', 'AAAA', 'CNAME'] as $type) {
            if (!empty($provider->listRecords($zone, $hostname, $type))) {
                throw new DisplayException("{$hostname} already has a {$type} record in Cloudflare. Remove it there first, then try again.");
            }
        }
    }

    private function tokenWasRejected(DnsProviderException $exception): bool
    {
        return str_contains($exception->getMessage(), CloudflareProvider::TOKEN_REJECTED);
    }

    /**
     * Turn a provider failure into a message the user can act on.
     */
    private function displayException(DnsProviderException $exception): DisplayException
    {
        return new DisplayException(
            $this->tokenWasRejected($exception)
                ? 'Cloudflare rejected the API token saved for this domain. Remove the domain and add it again with a new token.'
                : $exception->getMessage()
        );
    }

    private function deleteRecords(CloudflareProvider $provider, string $zone, array $recordIds): void
    {
        foreach ($recordIds as $recordId) {
            try {
                $provider->deleteRecord($zone, $recordId);
            } catch (\Exception $e) {
                Log::warning("Failed to delete DNS record {$recordId} for {$zone}: {$e->getMessage()}");
            }
        }
    }

    private function provider(array $config): CloudflareProvider
    {
        // Shown next to each record in the Cloudflare dashboard, which caps
        // comments at 100 characters on free plans.
        $config['comment'] = mb_substr('Autogenerated by ' . (config('app.name') ?: 'Hydrodactyl Panel'), 0, 100);

        return app()->makeWith(CloudflareProvider::class, ['config' => $config]);
    }
}
