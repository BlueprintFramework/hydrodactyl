@include('partials/admin.settings.notice')

@section('settings::nav')
    @yield('settings::notice')
    <div class="flex items-center space-x-1 border-b border-gray-800 mt-6 overflow-x-auto">
        @foreach([
            ['route' => route('admin.depr.settings'), 'label' => 'General', 'tab' => 'basic'],
            ['route' => route('admin.depr.settings.mail'), 'label' => 'Mail', 'tab' => 'mail'],
            ['route' => route('admin.depr.settings.captcha'), 'label' => 'Captcha', 'tab' => 'captcha'],
            ['route' => route('admin.depr.settings.domains.index'), 'label' => 'Domains', 'tab' => 'domains'],
            ['route' => route('admin.depr.settings.logo'), 'label' => 'Branding', 'tab' => 'logo'],
            ['route' => route('admin.depr.settings.advanced'), 'label' => 'Advanced', 'tab' => 'advanced'],
        ] as $item)
            <a href="{{ $item['route'] }}"
               class="whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                      {{ $activeTab === $item['tab'] ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600' }}">
                {{ $item['label'] }}
            </a>
        @endforeach
    </div>
@endsection
