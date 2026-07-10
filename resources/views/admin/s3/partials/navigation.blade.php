@php
    /** @var \Pterodactyl\Models\S3 $s3 */
    $router = app('router');
@endphp
<div class="mb-6">
    <div class="flex items-center space-x-1 border-b border-gray-800">
        <a href="{{ route('admin.depr.buckets.view', $s3->id) }}"
           class="whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                  {{ $router->currentRouteNamed('admin.buckets.view') ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600' }}">
            About
        </a>
        <a href="{{ route('admin.depr.buckets.view.details', $s3->id) }}"
           class="whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                  {{ $router->currentRouteNamed('admin.buckets.view.details') ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600' }}">
            Details
        </a>
        <a href="{{ route('admin.depr.buckets.view.delete', $s3->id) }}"
           class="whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                  {{ $router->currentRouteNamed('admin.buckets.view.delete') ? 'border-red-500 text-red-400' : 'border-transparent text-red-500/60 hover:text-red-400 hover:border-gray-600' }}">
            Delete
        </a>
    </div>
</div>
