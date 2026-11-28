<?php

namespace Pterodactyl\Contracts\Elytra;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\ElytraJob;
use Pterodactyl\Repositories\Elytra\ElytraRepository;

interface Job
{
    public static function getSupportedJobTypes(): array;

    /**
     * Permissions required to perform an operation (index, create, show, cancel) on a job
     * of the given type through the generic jobs API. Returns null when that operation is
     * not available for the job type through the generic API at all.
     */
    public function getRequiredPermissions(string $operation, string $jobType): ?array;

    /**
     * Validates job data for the given job type, rejecting data meant for another type.
     */
    public function validateJobData(string $jobType, array $jobData): array;

    public function submitToElytra(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string;

    public function cancelOnElytra(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): void;

    public function processStatusUpdate(ElytraJob $job, array $statusData): void;

    public function formatJobResponse(ElytraJob $job): array;
}