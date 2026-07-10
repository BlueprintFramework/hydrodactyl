@php
    /** @var \Pterodactyl\Models\Server $server */
    $router = app('router');
    $tabs = [
        ['route' => 'admin.servers.view', 'label' => 'About', 'always' => true],
        ['route' => 'admin.servers.view.details', 'label' => 'Details', 'installed' => true],
        ['route' => 'admin.servers.view.build', 'label' => 'Build Configuration', 'installed' => true],
        ['route' => 'admin.servers.view.startup', 'label' => 'Startup', 'installed' => true],
        ['route' => 'admin.servers.view.database', 'label' => 'Database', 'installed' => true],
        ['route' => 'admin.servers.view.mounts', 'label' => 'Mounts', 'installed' => true],
        ['route' => 'admin.servers.view.manage', 'label' => 'Manage', 'always' => true],
        ['route' => 'admin.servers.view.delete', 'label' => 'Delete', 'always' => true, 'danger' => true],
    ];
@endphp
<div class="mb-6">
    <div class="flex items-center space-x-1 border-b border-gray-800 overflow-x-auto">
        @foreach($tabs as $tab)
            @if(isset($tab['installed']) && !$server->isInstalled())
                @continue
            @endif
            @php
                $isActive = $router->currentRouteNamed($tab['route']);
                $isDanger = isset($tab['danger']) && $tab['danger'];
            @endphp
            <a href="{{ route($tab['route'], $server->id) }}"
               class="whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                      {{ $isActive
                          ? ($isDanger ? 'border-red-500 text-red-400' : 'border-blue-500 text-blue-400')
                          : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                      }}
                      {{ $isDanger && !$isActive ? 'text-red-500/60 hover:text-red-400' : '' }}">
                {{ $tab['label'] }}
            </a>
        @endforeach
        <a href="/server/{{ $server->uuidShort }}" target="_blank"
           class="whitespace-nowrap px-4 py-3 text-sm font-medium text-green-500/60 hover:text-green-400 transition-colors ml-auto">
            Open Panel &nearr;
        </a>
    </div>
</div>
@endSection
