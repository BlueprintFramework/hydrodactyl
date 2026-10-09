<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Eggs\Sharing\EggImporterService;
use Pterodactyl\Http\Requests\Admin\Egg\EggImportFormRequest;
use Pterodactyl\Http\Requests\Admin\Egg\EggImportUrlFormRequest;

class EggShareController extends Controller
{
    /**
     * EggShareController constructor.
     */
    public function __construct(private EggImporterService $importerService)
    {
    }

    /**
     * Import a new egg from an uploaded JSON file.
     */
    public function import(EggImportFormRequest $request): JsonResponse
    {
        $egg = $this->importerService->handle($request->file('import_file'), $request->input('import_to_nest'));

        return response()->json(['data' => ['id' => $egg->id]], JsonResponse::HTTP_CREATED);
    }

    /**
     * Import a new egg from a remote URL.
     */
    public function importFromUrl(EggImportUrlFormRequest $request): JsonResponse
    {
        $allowedHosts = array_map('trim', explode(',', config('pterodactyl.eggs.allowed_import_hosts', '')));
        $parsed = parse_url($request->input('import_file_url'));

        if (!is_array($parsed) || !isset($parsed['host']) || !in_array($parsed['host'], $allowedHosts)) {
            throw new DisplayException('The Egg import URL is not from an allowed host.');
        }

        if (!isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'])) {
            throw new DisplayException('The Egg import URL scheme is invalid.');
        }

        $response = @file_get_contents($request->input('import_file_url'));
        if ($response === false) {
            throw new DisplayException('Fetching the Egg from the URL failed.');
        }

        $egg = $this->importerService->handleFromString($response, $request->input('import_to_nest'));

        return response()->json(['data' => ['id' => $egg->id]], JsonResponse::HTTP_CREATED);
    }
}
