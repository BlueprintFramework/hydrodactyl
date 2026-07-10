@extends('layouts.admin')

@section('title')
    List S3 Buckets
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">S3 Configurations
                <small class="text-gray-500 ml-2">All S3 bucket configurations on the system.</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">S3 Buckets</li>
        </ol>
    </div>
@endsection

@section('content')
<div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden mt-6">
    <div class="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">S3 Bucket List</h3>
        <div class="flex items-center space-x-2">
            <form action="{{ route('admin.depr.buckets') }}" method="GET" class="flex items-center">
                <div class="relative">
                    <input type="text" name="filter[name]"
                           value="{{ request()->input()['filter']['name'] ?? '' }}"
                           placeholder="Search Buckets"
                           class="bg-gray-900 border border-gray-700 rounded-l px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48">
                    <button type="submit" class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </button>
                </div>
            </form>
            <div class="flex space-x-1">
                <a href="{{ route('admin.depr.buckets.new') }}">
                    <button type="button" class="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-r font-medium transition-colors">
                        + New Bucket
                    </button>
                </a>
            </div>
        </div>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-gray-800 bg-gray-900/50">
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bucket</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servers</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($buckets as $bucket)
                    <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
                        <td class="px-5 py-3"><code class="text-blue-400">{{ $bucket->id }}</code></td>
                        <td class="px-5 py-3">
                            <a href="{{ route('admin.depr.buckets.view', $bucket->id) }}" class="text-blue-400 hover:text-blue-300 font-medium">
                                {{ $bucket->name }}
                            </a>
                            @if($bucket->description)
                                <p class="text-xs text-gray-600 mt-0.5">{{ str_limit($bucket->description, 40) }}</p>
                            @endif
                        </td>
                        <td class="px-5 py-3"><code class="text-gray-300">{{ $bucket->bucket_name }}</code></td>
                        <td class="px-5 py-3">
                            @if($bucket->is_local)
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-400 border border-indigo-800/50">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    Local MinIO
                                </span>
                            @else
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                                    Remote
                                </span>
                            @endif
                        </td>
                        <td class="px-5 py-3">
                            @if($bucket->enabled)
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-400">Enabled</span>
                            @else
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">Disabled</span>
                            @endif
                        </td>
                        <td class="px-5 py-3 text-gray-300">{{ $bucket->server_count }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="px-5 py-12 text-center text-gray-500">
                            <p class="text-lg font-medium mb-1">No buckets configured</p>
                            <p class="text-sm">Create your first S3 bucket configuration to get started.</p>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    @if(method_exists($buckets, 'links'))
        <div class="px-5 py-3 border-t border-gray-800">
            {{ $buckets->links() }}
        </div>
    @endif
</div>
@endsection

@section('footer-scripts')
    @parent
@endsection
