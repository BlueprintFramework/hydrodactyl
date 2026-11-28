<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Contracts\Elytra\Job;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;

class ElytraJobsController extends ClientApiController
{
    public function __construct(
        private ElytraJobService $elytraJobService,
    ) {
        parent::__construct();
    }

    /**
     * List jobs
     */
    public function index(Request $request, Server $server): JsonResponse
    {
        $jobType = $request->query('type');

        if ($jobType) {
            $handler = $this->elytraJobService->getJobHandler($jobType);
            $this->authorizeJobOperation($request, $server, $handler, 'index', $jobType);
        }

        $jobs = $this->elytraJobService->listJobs(
            $server,
            $request->query('type'),
            $request->query('status')
        );

        return new JsonResponse([
            'object' => 'list',
            'data' => $jobs,
        ]);
    }

    /**
     * Create a job
     */
    public function create(Request $request, Server $server): JsonResponse
    {
        $jobType = $request->input('job_type');
        $jobData = $request->input('job_data', []);

        $handler = $this->elytraJobService->getJobHandler($jobType);
        $this->authorizeJobOperation($request, $server, $handler, 'create', $jobType);

        $result = $this->elytraJobService->submitJob(
            $server,
            $jobType,
            $jobData,
            $request->user()
        );

        Activity::event('job:create')
            ->subject($server)
            ->property(['job_type' => $jobType, 'job_id' => $result['job_id']])
            ->log();

        return new JsonResponse($result);
    }

    /**
     * View a job
     */
    public function show(Request $request, Server $server, string $jobId): JsonResponse
    {
        $job = $this->elytraJobService->getJobStatus($server, $jobId);

        if (!$job) {
            return response()->json(['error' => __('exceptions.client.jobs.not_found')], 404);
        }

        $handler = $this->elytraJobService->getJobHandler($job['type']);
        $this->authorizeJobOperation($request, $server, $handler, 'show', $job['type']);

        return new JsonResponse([
            'object' => 'job',
            'attributes' => $job,
        ]);
    }

    /**
     * Cancel a job
     */
    public function cancel(Request $request, Server $server, string $jobId): JsonResponse
    {
        $job = $this->elytraJobService->getJobStatus($server, $jobId);

        if (!$job) {
            return response()->json(['error' => __('exceptions.client.jobs.not_found')], 404);
        }

        $handler = $this->elytraJobService->getJobHandler($job['type']);
        $this->authorizeJobOperation($request, $server, $handler, 'cancel', $job['type']);

        $result = $this->elytraJobService->cancelJob($server, $jobId);

        Activity::event('job:cancel')
            ->subject($server)
            ->property(['job_id' => $jobId])
            ->log();

        return new JsonResponse($result);
    }

    /**
     * Throws unless the user holds every permission the job type requires for the
     * operation. A null permission list means the operation is not offered for that
     * job type through this API.
     *
     * @throws AuthorizationException
     */
    private function authorizeJobOperation(Request $request, Server $server, Job $handler, string $operation, string $jobType): void
    {
        $requiredPermissions = $handler->getRequiredPermissions($operation, $jobType);
        if (is_null($requiredPermissions)) {
            throw new AuthorizationException();
        }

        foreach ($requiredPermissions as $permission) {
            if (!$request->user()->can($permission, $server)) {
                throw new AuthorizationException();
            }
        }
    }
}
