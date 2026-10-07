<?php

namespace Pterodactyl\Http\Controllers\Admin\Nests;

use Pterodactyl\Models\Egg;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\HttpFoundation\Response;
use Pterodactyl\Services\Eggs\Sharing\EggExporterService;

class EggShareController extends Controller
{
    /**
     * EggShareController constructor.
     */
    public function __construct(private EggExporterService $exporterService)
    {
    }

    /**
     * Download an egg as a JSON file.
     *
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function export(Egg $egg): Response
    {
        $filename = trim(preg_replace('/\W/', '-', kebab_case($egg->name)), '-');

        return response($this->exporterService->handle($egg->id), 200, [
            'Content-Transfer-Encoding' => 'binary',
            'Content-Description' => 'File Transfer',
            'Content-Disposition' => 'attachment; filename=egg-' . $filename . '.json',
            'Content-Type' => 'application/json',
        ]);
    }
}
