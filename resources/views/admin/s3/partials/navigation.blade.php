@php
    /** @var \Pterodactyl\Models\S3 $s3 */
    $router = app('router');
@endphp
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li class="{{ $router->currentRouteNamed('admin.buckets.view') ? 'active' : '' }}">
                    <a href="{{ route('admin.buckets.view', $s3->id) }}">{{ __('admin/s3.view.nav.about') }}</a></li>
                <li class="{{ $router->currentRouteNamed('admin.buckets.view.details') ? 'active' : '' }}">
                    <a href="{{ route('admin.buckets.view.details', $s3->id) }}">{{ __('admin/s3.view.nav.details') }}</a>
                </li>
                <li class="tab-danger {{ $router->currentRouteNamed('admin.buckets.view.delete') ? 'active' : '' }}">
                    <a href="{{ route('admin.buckets.view.delete', $s3->id) }}">{{ __('strings.delete') }}</a>
                </li>
            </ul>
        </div>
    </div>
</div>
