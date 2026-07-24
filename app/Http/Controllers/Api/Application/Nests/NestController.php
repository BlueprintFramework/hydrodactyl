<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nests;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Models\Nest;
use Pterodactyl\Services\Nests\NestCreationService;
use Pterodactyl\Services\Nests\NestUpdateService;
use Pterodactyl\Services\Nests\NestDeletionService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Transformers\Api\Application\NestTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nests\GetNestsRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\StoreNestRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\UpdateNestRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\DeleteNestRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class NestController extends ApplicationApiController
{
    private const ICON_DIR = 'nests';

    public function __construct(
        private NestRepositoryInterface $repository,
        private NestCreationService $creationService,
        private NestUpdateService $updateService,
        private NestDeletionService $deletionService,
    ) {
        parent::__construct();
    }

    /**
     * List all nests
     */
    public function index(GetNestsRequest $request): array
    {
        $nests = Nest::query()
            ->withCount('eggs', 'servers')
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($nests)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    /**
     * View a single nest
     */
    public function view(GetNestsRequest $request, Nest $nest): array
    {
        $nest->loadCount('eggs', 'servers');

        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    public function store(StoreNestRequest $request): JsonResponse
    {
        $nest = $this->creationService->handle($request->validated());
        $nest->loadCount('eggs', 'servers');

        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->addMeta([
                'resource' => route('api.application.nests.view', [
                    'nest' => $nest->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateNestRequest $request, Nest $nest): array
    {
        $this->updateService->handle($nest->id, $request->validated());

        return $this->fractal->item($nest->refresh()->loadCount('eggs', 'servers'))
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    public function updateIcon(Request $request, Nest $nest): JsonResponse
    {
        $validated = $request->validate([
            'icon_file' => 'nullable|file|mimes:png,jpg,jpeg,gif,webp,svg,ico,avif|max:2048',
            'remove' => 'nullable|boolean',
        ]);

        if (!empty($validated['remove']) && $validated['remove']) {
            $this->removeIcon($nest);
            return new JsonResponse(['success' => true, 'icon' => null]);
        }

        if (!empty($validated['icon_file'])) {
            $iconPath = $this->storeIcon($validated['icon_file'], $nest);
            $this->repository->withoutFreshModel()->update($nest->id, ['icon' => $iconPath]);
            return new JsonResponse(['success' => true, 'icon' => url('storage/' . $iconPath)]);
        }

        return new JsonResponse(['error' => 'No icon file provided.'], 422);
    }

    private function storeIcon(UploadedFile $file, Nest $nest): string
    {
        $oldIcon = $nest->icon;
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs(self::ICON_DIR, $filename, 'public');

        if ($oldIcon && Storage::disk('public')->exists($oldIcon)) {
            Storage::disk('public')->delete($oldIcon);
        }

        return $path;
    }

    private function removeIcon(Nest $nest): void
    {
        if ($nest->icon && Storage::disk('public')->exists($nest->icon)) {
            Storage::disk('public')->delete($nest->icon);
        }
        $this->repository->withoutFreshModel()->update($nest->id, ['icon' => null]);
    }

    public function delete(DeleteNestRequest $request, Nest $nest): Response
    {
        if ($nest->icon && Storage::disk('public')->exists($nest->icon)) {
            Storage::disk('public')->delete($nest->icon);
        }

        $this->deletionService->handle($nest->id);

        return response('', 204);
    }
}
