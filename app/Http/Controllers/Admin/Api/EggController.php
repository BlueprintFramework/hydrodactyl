<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\Egg;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Eggs\EggUpdateService;
use Pterodactyl\Services\Eggs\EggCreationService;
use Pterodactyl\Services\Eggs\EggDeletionService;
use Pterodactyl\Http\Requests\Admin\Egg\EggFormRequest;
use Pterodactyl\Http\Requests\Admin\Egg\EggScriptFormRequest;
use Pterodactyl\Services\Eggs\Scripts\InstallScriptService;
use Pterodactyl\Http\Requests\Admin\Egg\EggVariableFormRequest;
use Pterodactyl\Services\Eggs\Variables\VariableUpdateService;
use Pterodactyl\Services\Eggs\Variables\VariableCreationService;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Egg\EggImportFormRequest;
use Pterodactyl\Services\Eggs\Sharing\EggUpdateImporterService;
use Pterodactyl\Contracts\Repository\EggVariableRepositoryInterface;

class EggController extends Controller
{
    /**
     * EggController constructor.
     */
    public function __construct(
        private EggCreationService $creationService,
        private EggUpdateService $updateService,
        private EggDeletionService $deletionService,
        private EggRepositoryInterface $repository,
        private EggVariableRepositoryInterface $variableRepository,
        private VariableCreationService $variableCreationService,
        private VariableUpdateService $variableUpdateService,
        private InstallScriptService $installScriptService,
        private EggUpdateImporterService $updateImporterService,
    ) {
    }

    /**
     * Return the configuration for a single egg.
     */
    public function view(Egg $egg): JsonResponse
    {
        $egg->load('nest');

        $images = array_map(
            fn ($key, $value) => $key === $value ? $value : "$key|$value",
            array_keys($egg->docker_images ?? []),
            $egg->docker_images ?? [],
        );

        return response()->json([
            'data' => [
                'id' => $egg->id,
                'uuid' => $egg->uuid,
                'author' => $egg->author,
                'name' => $egg->name,
                'description' => $egg->description,
                'startup' => $egg->startup,
                'docker_images' => implode(PHP_EOL, $images),
                'force_outgoing_ip' => (bool) $egg->force_outgoing_ip,
                'features' => $egg->features ?? [],
                'config_from' => $egg->config_from,
                'config_stop' => $egg->config_stop,
                'config_logs' => $this->prettyJson($egg->config_logs),
                'config_startup' => $this->prettyJson($egg->config_startup),
                'config_files' => $this->prettyJson($egg->config_files),
                'nest_id' => $egg->nest_id,
                'nest' => $egg->nest ? ['id' => $egg->nest->id, 'name' => $egg->nest->name] : null,
            ],
            'config_from_options' => Egg::query()
                ->where('nest_id', $egg->nest_id)
                ->where('id', '!=', $egg->id)
                ->orderBy('name')
                ->get(['id', 'name', 'author'])
                ->map(fn (Egg $option) => ['id' => $option->id, 'name' => $option->name, 'author' => $option->author])
                ->values(),
        ]);
    }

    /**
     * Create a new egg.
     */
    public function store(EggFormRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['docker_images'] = $this->normalizeDockerImages($data['docker_images'] ?? null);

        $egg = $this->creationService->handle($data);

        return response()->json(['data' => ['id' => $egg->id]], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing egg.
     */
    public function update(EggFormRequest $request, Egg $egg): JsonResponse
    {
        $data = $request->validated();
        $data['docker_images'] = $this->normalizeDockerImages($data['docker_images'] ?? null);

        $this->updateService->handle($egg, $data);

        return response()->json(['data' => ['id' => $egg->id]]);
    }

    /**
     * Delete an egg.
     */
    public function destroy(Egg $egg): JsonResponse
    {
        $this->deletionService->handle($egg->id);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Replace an egg's settings from an uploaded JSON file.
     */
    public function importUpdate(EggImportFormRequest $request, Egg $egg): JsonResponse
    {
        $this->updateImporterService->handle($egg, $request->file('import_file'));

        return response()->json(['data' => ['id' => $egg->id]]);
    }

    /**
     * Return the variables for an egg.
     */
    public function variables(Egg $egg): JsonResponse
    {
        $egg = $this->repository->getWithVariables($egg->id);

        return response()->json([
            'data' => $egg->variables
                ->map(fn (EggVariable $variable) => [
                    'id' => $variable->id,
                    'name' => $variable->name,
                    'description' => $variable->description,
                    'env_variable' => $variable->env_variable,
                    'default_value' => $variable->default_value,
                    'user_viewable' => (bool) $variable->user_viewable,
                    'user_editable' => (bool) $variable->user_editable,
                    'rules' => $variable->rules,
                    'required' => $variable->required,
                ])
                ->values(),
            'egg' => ['id' => $egg->id, 'name' => $egg->name, 'nest_id' => $egg->nest_id],
        ]);
    }

    /**
     * Create a variable for an egg.
     */
    public function storeVariable(EggVariableFormRequest $request, Egg $egg): JsonResponse
    {
        $variable = $this->variableCreationService->handle($egg->id, $request->normalize());

        return response()->json(['data' => ['id' => $variable->id]], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update a variable for an egg.
     */
    public function updateVariable(EggVariableFormRequest $request, Egg $egg, EggVariable $variable): JsonResponse
    {
        $this->variableUpdateService->handle($variable, $request->normalize());

        return response()->json(['data' => ['id' => $variable->id]]);
    }

    /**
     * Delete a variable from an egg.
     */
    public function destroyVariable(Egg $egg, EggVariable $variable): JsonResponse
    {
        $this->variableRepository->delete($variable->id);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Return the install script configuration for an egg.
     */
    public function scripts(Egg $egg): JsonResponse
    {
        $egg = $this->repository->getWithCopyAttributes($egg->id);

        $copy = $this->repository->findWhere([
            ['copy_script_from', '=', null],
            ['nest_id', '=', $egg->nest_id],
            ['id', '!=', $egg->id],
        ]);

        $rely = $this->repository->findWhere([
            ['copy_script_from', '=', $egg->id],
        ]);

        return response()->json([
            'data' => [
                'id' => $egg->id,
                'name' => $egg->name,
                'script_install' => $egg->script_install,
                'script_is_privileged' => (bool) $egg->script_is_privileged,
                'script_entry' => $egg->script_entry,
                'script_container' => $egg->script_container,
                'copy_script_from' => $egg->copy_script_from,
                'copy_from' => $egg->scriptFrom ? ['id' => $egg->scriptFrom->id, 'name' => $egg->scriptFrom->name] : null,
            ],
            'copy_from_options' => $copy
                ->map(fn (Egg $option) => ['id' => $option->id, 'name' => $option->name])
                ->values(),
            'rely_on_script' => $rely
                ->map(fn (Egg $option) => ['id' => $option->id, 'name' => $option->name])
                ->values(),
        ]);
    }

    /**
     * Update the install script for an egg.
     */
    public function updateScripts(EggScriptFormRequest $request, Egg $egg): JsonResponse
    {
        $this->installScriptService->handle($egg, $request->normalize());

        return response()->json(['data' => ['id' => $egg->id]]);
    }

    /**
     * Pretty-print a stored JSON configuration value.
     */
    private function prettyJson(?string $value): ?string
    {
        if (is_null($value)) {
            return null;
        }

        $decoded = json_decode($value, true);

        return is_null($decoded) ? $value : json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Normalizes a string of docker image data into the expected egg format.
     */
    private function normalizeDockerImages(?string $input = null): array
    {
        $data = array_map(fn ($value) => trim($value), explode("\n", $input ?? ''));

        $images = [];
        foreach ($data as $value) {
            if ($value === '') {
                continue;
            }

            $parts = explode('|', $value, 2);
            $images[$parts[0]] = empty($parts[1]) ? $parts[0] : $parts[1];
        }

        return $images;
    }
}
