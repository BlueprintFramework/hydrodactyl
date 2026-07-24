<?php

namespace Pterodactyl\Http\Controllers\Admin\Buckets;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\S3;
use Pterodactyl\Models\Backup;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Eloquent\ServerRepository;
use Pterodactyl\Repositories\Eloquent\S3Repository;
use Illuminate\Contracts\View\Factory as ViewFactory;

class BucketViewController extends Controller
{
    public function __construct(
        private S3Repository $repository,
        private ServerRepository $serverRepository,
        private ViewFactory $view,
    ) {}

    public function index(Request $request, S3 $s3): View
    {
        $s3->loadCount('servers');
        $storageUsed = Cache::remember("s3_storage_{$s3->id}", 60, function() use($s3) {
            return Backup::whereHas('server', function($q) use($s3) {
                $q->where('bucket', $s3->id);
            })->where('is_successful', true)->sum('bytes');
        });

        return $this->view->make('admin.s3.view.index', compact('s3', 'storageUsed'));
    }

    public function details(Request $request, S3 $s3): View
    {
        return $this->view->make('admin.s3.view.details', compact('s3'));
    }

    public function update(Request $request, S3 $s3): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'access_key' => 'required|string|max:255',
            'secret_key' => 'required|string|max:255',
            'endpoint' => 'nullable|url|max:255',
            'region' => 'nullable|string|max:64',
            'bucket_name' => 'required|string|max:255',
            'use_path_style_endpoint' => 'boolean',
            'enabled' => 'boolean',
        ]);

        $s3->update($validated);

        return redirect()->route('admin.depr.buckets.view.details', $s3->id)->with('success', 'S3 configuration updated.');
    }

    public function servers(Request $request, S3 $s3): View
    {
        $s3->load('servers');

        return $this->view->make('admin.s3.view.servers', [
            'bucket'     => $s3,
            'servers' => $s3->servers,
        ]);
    }

    public function delete(Request $request, S3 $s3): View
    {
        return $this->view->make('admin.s3.view.delete', compact('s3'));
    }
}
