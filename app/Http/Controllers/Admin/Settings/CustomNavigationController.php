<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\CustomNavigationSettingsFormRequest;

class CustomNavigationController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
        private ViewFactory $view,
    ) {
    }

    /**
     * Render custom navigation settings UI.
     */
    public function index(): View
    {
        return $this->view->make('admin.settings.custom-navigation');
    }

    /**
     * Update custom navigation settings.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(CustomNavigationSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Custom navigation settings have been updated successfully and the queue worker was restarted to apply these changes.')->flash();

        return redirect()->route('admin.settings.custom-navigation');
    }
}
