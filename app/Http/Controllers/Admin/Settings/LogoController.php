<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Admin\LogoService;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\LogoFormRequest;

class LogoController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private Kernel $kernel,
        private LogoService $logoService,
        private SettingsRepositoryInterface $settings,
        private ViewFactory $view,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.settings.logo', [
            'logoType' => $this->logoService->getCurrentType(),
            'logoUrl' => $this->logoService->getCurrentUrl(),
            'logoValue' => $this->logoService->getCurrentValue(),
            'history' => $this->logoService->getHistory(),
            'canProcessImages' => $this->logoService->canProcessImages(),
            'brandColor' => config('app.brand_color', '#52A9FF'),
        ]);
    }

    public function update(LogoFormRequest $request): RedirectResponse
    {
        try {
            $data = $request->validated();

            $nameChanged = false;
            if (array_key_exists('app:name', $data) && $data['app:name'] !== null) {
                $currentName = $this->settings->get('settings::app:name');
                if ($data['app:name'] !== $currentName) {
                    $this->settings->set('settings::app:name', $data['app:name']);
                    $nameChanged = true;
                }
            }

            if (array_key_exists('app:brand_color', $data) && $data['app:brand_color'] !== null) {
                $this->settings->set('settings::app:brand_color', $data['app:brand_color']);
            }

            $this->logoService->handle($data);

            // Only restart queue workers when the site name changed — logo-only
            // updates don't affect queued jobs.
            if ($nameChanged) {
                $this->kernel->call('queue:restart');
            }
            $this->alert->success('Logo settings have been updated successfully.')->flash();
        } catch (\Throwable $exception) {
            Log::error('Failed to update logo settings.', ['error' => $exception->getMessage()]);
            $this->alert->danger('Failed to update the logo. Please check the file and try again.')->flash();
        }

        return redirect()->route('admin.settings.logo');
    }
}