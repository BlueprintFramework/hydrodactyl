@extends('layouts.admin')

@section('title')
    S3 — {{ $s3->name }}
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">{{ $s3->name }}
                <small class="text-gray-500 ml-2">{{ str_limit($s3->description ?? '', 60) }}</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets') }}" class="text-blue-400 hover:text-blue-300">S3 Configurations</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">{{ $s3->name }}</li>
        </ol>
    </div>
@endsection

@section('content')
@include('admin.s3.partials.navigation')

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
                            ['ID', '<code class="text-blue-400">'.$s3->id.'</code>'],
                            ['Name', $s3->name],
                            ['Description', $s3->description ?? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">None</span>'],
                            ['Bucket Name', '<code class="text-blue-400">'.$s3->bucket_name.'</code>'],
                            ['Type', $s3->is_local
                                ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-400 border border-indigo-800/50"><svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/></svg>Local MinIO</span>'
                                : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400"><svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>Remote</span>'],
                            ['Endpoint', $s3->endpoint
                                ? '<code class="text-blue-400 break-all">'.$s3->endpoint.'</code>'
                                : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">Default (AWS)</span>'],
                            ['Path Style Endpoints', $s3->use_path_style_endpoint
                                ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-400">Enabled</span>'
                                : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">Disabled</span>'],
                            ['Status', $s3->enabled
                                ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-400">Enabled</span>'
                                : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">Disabled</span>'],
                            ['Created', $s3->created_at->diffForHumans()],
                            ['Updated', $s3->updated_at->diffForHumans()],
                        ] as $row)
                            <tr class="border-b border-gray-800 last:border-0 hover:bg-white/5">
                                <td class="px-5 py-3 text-gray-400 font-medium w-44">{{ $row[0] }}</td>
                                <td class="px-5 py-3 text-gray-200">{!! $row[1] !!}</td>
                            </tr>
                        @endforeach
                    </tbody>
            </div>
        </div>
    </div>

    <div class="space-y-4">
        @if($s3->is_local && $s3->minio_instance_url)
            <div class="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-3">
                    <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <h3 class="text-sm font-semibold text-indigo-300 uppercase tracking-wider">MinIO Instance</h3>
                </div>
                <p class="text-xs text-gray-500 mb-2">This bucket is hosted on your local MinIO server.</p>
                <a href="{{ $s3->minio_instance_url }}" target="_blank"
                   class="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors">
                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    Open MinIO Console
                </a>
            </div>
        @endif

        <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
            <div class="p-4 space-y-3">
                <a href="{{ route('admin.depr.buckets.view.servers', $s3->id) }}"
                   class="block bg-gray-900 rounded-lg p-4 hover:bg-gray-800/50 transition-colors group">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-100">{{ $s3->servers_count ?? $s3->servers->count() }}</h3>
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Attached Servers</p>
                        </div>
                        <svg class="w-8 h-8 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                </a>

                <div class="bg-gray-900 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-100">{{ humanizeSize($storageUsed) }}</h3>
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Estimated Storage Usage</p>
                        </div>
                        <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
                    </div>
                    </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('[data-toggle="tooltip"]').tooltip();
    </script>
@endsection
