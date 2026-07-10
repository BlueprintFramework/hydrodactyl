<?php

namespace Pterodactyl\Http\Controllers\Admin\Buckets;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\S3\S3CreationService;
use Pterodactyl\Http\Requests\Admin\BucketFormRequest;

class CreateBucketController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private S3CreationService $creationService,
        private ViewFactory $view,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.s3.new');
    }

    public function store(BucketFormRequest $request): RedirectResponse
    {
        $s3 = $this->creationService->handle($request->validated());

        $this->alert->success('S3 configuration created')->flash();

        return redirect()->route('admin.depr.buckets.view', $s3->id);
    }
}
