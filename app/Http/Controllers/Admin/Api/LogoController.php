<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Admin\LogoService;
use Pterodactyl\Http\Requests\Admin\Settings\LogoFormRequest;

class LogoController extends Controller
{
    /**
     * LogoController constructor.
     */
    public function __construct(
        private LogoService $logoService,
        private Kernel $kernel,
    ) {
    }

    /**
     * Return the current logo and its history.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->state());
    }

    /**
     * Update the logo from an upload, URL, rewind or removal.
     */
    public function update(LogoFormRequest $request): JsonResponse
    {
        $this->logoService->handle($request->validated());
        $this->kernel->call('queue:restart');

        return response()->json($this->state());
    }

    /**
     * Build the current logo state for the admin interface.
     */
    private function state(): array
    {
        $type = $this->logoService->getCurrentType();
        $value = $this->logoService->getCurrentValue();

        $history = collect($this->logoService->getHistory())
            ->map(fn (array $entry) => [
                'type' => $entry['type'],
                'value' => $entry['value'],
                'url' => $entry['type'] === 'upload' ? url('storage/' . $entry['value']) : $entry['value'],
                'current' => $type && $value && $entry['type'] === $type && $entry['value'] === $value,
            ])
            ->values();

        return [
            'type' => $type,
            'value' => $value,
            'url' => $this->logoService->getCurrentUrl(),
            'history' => $history,
        ];
    }
}
