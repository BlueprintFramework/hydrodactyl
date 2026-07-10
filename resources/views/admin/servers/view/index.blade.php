@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">{{ $server->name }}
                <small class="text-gray-500 ml-2">{{ str_limit($server->description) }}</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.servers') }}" class="text-blue-400 hover:text-blue-300">Servers</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">{{ $server->name }}</li>
        </ol>
    </div>
@endsection

@section('content')
@include('admin.servers.partials.navigation')

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
    <div class="lg:col-span-2">
        <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-800">
                <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Information</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <tbody>
                        @foreach([
                            ['Internal Identifier', '<code class="text-blue-400">'.$server->id.'</code>'],
                            ['External Identifier', is_null($server->external_id)
                                ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">Not Set</span>'
                                : '<code class="text-blue-400">'.$server->external_id.'</code>'],
                            ['UUID / Docker Container ID', '<code class="text-blue-400 break-all">'.$server->uuid.'</code>'],
                            ['Current Egg', '<a href="'.route('admin.depr.nests.view', $server->nest_id).'" class="text-blue-400 hover:text-blue-300">'.$server->nest->name.'</a> :: <a href="'.route('admin.depr.nests.egg.view', $server->egg_id).'" class="text-blue-400 hover:text-blue-300">'.$server->egg->name.'</a>'],
                            ['Server Name', $server->name],
                            ['CPU Limit', $server->cpu === 0
                                ? '<code class="text-green-400">Unlimited</code>'
                                : '<code class="text-yellow-400">'.$server->cpu.'%</code>'],
                            ['CPU Pinning', $server->threads != null
                                ? '<code class="text-blue-400">'.$server->threads.'</code>'
                                : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">Not Set</span>'],
                            ['Memory', ($server->memory === 0 ? '<code class="text-green-400">Unlimited</code>' : '<code class="text-yellow-400">'.$server->memory.'MiB</code>').' / '.($server->swap === 0 ? '<code class="text-gray-400" title="Swap Space">Not Set</code>' : ($server->swap === -1 ? '<code class="text-green-400" title="Swap Space">Unlimited</code>' : '<code class="text-yellow-400" title="Swap Space">'.$server->swap.'MiB</code>'))],
                            ['Disk Space', $server->disk === 0
                                ? '<code class="text-green-400">Unlimited</code>'
                                : '<code class="text-yellow-400">'.$server->disk.'MiB</code>'],
                            ['Block IO Weight', '<code class="text-blue-400">'.$server->io.'</code>'],
                            ['Default Connection', '<code class="text-blue-400">'.$server->allocation->ip.':'.$server->allocation->port.'</code>'],
                            ['Connection Alias', $server->allocation->alias !== $server->allocation->ip
                                ? '<code class="text-blue-400">'.$server->allocation->alias.':'.$server->allocation->port.'</code>'
                                : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">No Alias Assigned</span>'],
                        ] as $row)
                            <tr class="border-b border-gray-800 last:border-0 hover:bg-white/5">
                                <td class="px-5 py-3 text-gray-400 font-medium w-56">{{ $row[0] }}</td>
                                <td class="px-5 py-3 text-gray-200">{!! $row[1] !!}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="space-y-4">
        @if($server->isSuspended())
            <div class="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 text-center">
                <h3 class="text-lg font-bold text-yellow-400">Suspended</h3>
            </div>
        @endif

        @if(!$server->isInstalled())
            <div class="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 text-center">
                <h3 class="text-lg font-bold text-blue-400">{{ $server->isInstalled() ? 'Install Failed' : 'Installing' }}</h3>
            </div>
        @endif

        <a href="{{ route('admin.depr.users.view', $server->user->id) }}" class="block bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden group">
            <div class="p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-100">{{ str_limit($server->user->username, 16) }}</h3>
                        <p class="text-sm text-gray-500">{{ $server->user->email }}</p>
                    </div>
                    <div class="text-gray-600 group-hover:text-gray-400 transition-colors">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mt-2 font-medium uppercase tracking-wider">Server Owner</p>
            </div>
            <div class="bg-blue-500/10 px-5 py-2 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View User Profile &rarr;
            </div>
        </a>

        <a href="{{ route('admin.depr.nodes.view', $server->node->id) }}" class="block bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden group">
            <div class="p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-100">{{ str_limit($server->node->name, 16) }}</h3>
                    </div>
                    <div class="text-gray-600 group-hover:text-gray-400 transition-colors">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mt-2 font-medium uppercase tracking-wider">Server Node</p>
            </div>
            <div class="bg-blue-500/10 px-5 py-2 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View Node Details &rarr;
            </div>
        </a>
    </div>
</div>
@endsection
