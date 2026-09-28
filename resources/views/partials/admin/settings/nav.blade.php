@include('partials/admin.settings.notice')

@section('settings::nav')
    @yield('settings::notice')
    <div class="row">
        <div class="col-xs-12">
            <div class="nav-tabs-custom nav-tabs-floating">
                <ul class="nav nav-tabs">
                    <li @if($activeTab === 'basic')class="active"@endif><a href="{{ route('admin.settings') }}">{{ __('admin/navigation.settings_nav.general') }}</a></li>
                    <li @if($activeTab === 'mail')class="active"@endif><a href="{{ route('admin.settings.mail') }}">{{ __('admin/navigation.settings_nav.mail') }}</a></li>
                    <li @if($activeTab === 'captcha')class="active"@endif><a href="{{ route('admin.settings.captcha') }}">{{ __('admin/navigation.settings_nav.captcha') }}</a></li>
                    <li @if($activeTab === 'domains')class="active"@endif><a href="{{ route('admin.settings.domains.index') }}">{{ __('admin/navigation.settings_nav.domains') }}</a></li>
                    <li @if($activeTab === 'custom-navigation')class="active"@endif><a href="{{ route('admin.settings.custom-navigation') }}">{{ __('admin/navigation.settings_nav.custom_navigation') }}</a></li>
                    <li @if($activeTab === 'logo')class="active"@endif><a href="{{ route('admin.settings.logo') }}">{{ __('admin/navigation.settings_nav.branding') }}</a></li>
                    <li @if($activeTab === 'advanced')class="active"@endif><a href="{{ route('admin.settings.advanced') }}">{{ __('admin/navigation.settings_nav.advanced') }}</a></li>
                </ul>
            </div>
        </div>
    </div>
@endsection
