<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Admin\LogoService;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\LogoFormRequest;

class LogoController extends Controller
{
    /**
     * LogoController constructor.
     */
    public function __construct(
        private LogoService $logoService,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    /**
     * Return the current logo, brand color and history.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->state());
    }

    /**
     * Update the logo from an upload, URL, rewind or removal, and/or the
     * brand color. Never restarts queue workers — logo-only and brand-color
     * changes don't affect queued jobs.
     */
    public function update(LogoFormRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            if (array_key_exists('app:brand_color', $data)) {
                if ($data['app:brand_color'] !== null) {
                    $this->settings->set('settings::app:brand_color', $data['app:brand_color']);
                } else {
                    $this->settings->forget('settings::app:brand_color');
                }

                // Re-boot the brand color into the current request's config so
                // the response reflects the mutation instead of the value that
                // was loaded when the request began.
                config([
                    'app.brand_color' => $this->settings->get(
                        'settings::app:brand_color',
                        config('app.brand_color_default'),
                    ),
                ]);
            }

            $this->logoService->handle($data);
        } catch (\Throwable $exception) {
            Log::error('Failed to update logo settings.', ['error' => $exception->getMessage()]);

            return response()->json(['error' => 'Failed to update the logo. Please check the file and try again.'], 422);
        }

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
            'brandColor' => config('app.brand_color', '#52A9FF'),
            'defaultBrandColor' => config('app.brand_color_default'),
            'canProcessImages' => $this->logoService->canProcessImages(),
        ];
    }
}
