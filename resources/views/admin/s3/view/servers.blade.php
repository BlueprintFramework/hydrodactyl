@extends('layouts.admin')

@section('title')
    {{ $bucket->name }}: Servers
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">{{ $bucket->name }}
                <small class="text-gray-500 ml-2">Servers using this S3 bucket configuration.</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets') }}" class="text-blue-400 hover:text-blue-300">S3 Configurations</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets.view', $bucket->id) }}" class="text-blue-400 hover:text-blue-300">{{ $bucket->name }}</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">Servers</li>
        </ol>
    </div>
@endsection

@section('content')
@include('admin.s3.partials.navigation')

<div class="mt-6">
    <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-800">
            <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Server List</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-gray-800 bg-gray-900/50">
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server Name</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($servers as $server)
                        <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
                            <td class="px-5 py-3"><code class="text-blue-400">{{ $server->uuidShort }}</code></td>
                            <td class="px-5 py-3">
                                <a href="{{ route('admin.depr.servers.view', $server->id) }}" class="text-blue-400 hover:text-blue-300 font-medium">
                                    {{ $server->name }}
                                </a>
                            </td>
                            <td class="px-5 py-3">
                                <a href="{{ route('admin.depr.users.view', $server->owner_id) }}" class="text-blue-400 hover:text-blue-300">
                                    {{ $server->user->username ?? 'N/A' }}
                                </a>
                            </td>
                            <td class="px-5 py-3 text-gray-300">{{ $server->nest->name ?? 'N/A' }} ({{ $server->egg->name ?? 'N/A' }})</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="px-5 py-12 text-center text-gray-500">
                                <p class="text-lg font-medium mb-1">No servers using this bucket</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
