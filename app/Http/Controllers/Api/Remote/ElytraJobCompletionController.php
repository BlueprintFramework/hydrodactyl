<?php

namespace Pterodactyl\Http\Controllers\Api\Remote;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\ElytraJob;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\HttpForbiddenException;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Http\Requests\Api\Remote\ElytraJobCompleteRequest;

class ElytraJobCompletionController extends Controller
{
    public function __construct(
        private ElytraJobService $elytraJobService,
    ) {}

    /**
     * Report job completion status
     */
    public function update(ElytraJobCompleteRequest $request, string $jobId): JsonResponse
    {
        // Only the node hosting the job's server may report on it. This runs outside the
        // try block below so the 403 is not swallowed into a generic 500.
        /** @var \Pterodactyl\Models\Node $node */
        $node = $request->attributes->get('node');
        $job = ElytraJob::query()->where('elytra_job_id', $jobId)->with('server')->first();
        if ($job && $job->server?->node_id !== $node->id) {
            throw new HttpForbiddenException(__('exceptions.remote.backups.forbidden'));
        }

        try {
            $this->elytraJobService->updateJobStatus($jobId, $request->validated());

            return response()->json([
                'success' => true,
                'message' => __('exceptions.remote.jobs.status_updated'),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}