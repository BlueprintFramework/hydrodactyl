<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Admin\LogoService;
use Pterodactyl\Http\Requests\Admin\Settings\LogoFormRequest;

class LogoController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private Kernel $kernel,
        private LogoService $logoService,
        private ViewFactory $view,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.settings.logo', [
            'logoType' => $this->logoService->getCurrentType(),
            'logoUrl' => $this->logoService->getCurrentUrl(),
            'logoValue' => $this->logoService->getCurrentValue(),
            'history' => $this->logoService->getHistory(),
        ]);
    }

    public function update(LogoFormRequest $request): RedirectResponse
    {
        $this->logoService->handle($request->validated());

        $this->kernel->call('queue:restart');
        $this->alert->success('Logo settings have been updated successfully.')->flash();

        return redirect()->route('admin.depr.settings.logo');
    }
}
