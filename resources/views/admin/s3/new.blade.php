@extends('layouts.admin')

@section('title')
    New Bucket
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">Create Bucket
                <small class="text-gray-500 ml-2">Add a new S3 bucket configuration.</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets') }}" class="text-blue-400 hover:text-blue-300">Buckets</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">Create</li>
        </ol>
    </div>
@endsection

@section('content')
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
    <div class="lg:col-span-2">
        <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-800">
                <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">External S3 Connection</h3>
            </div>
            <form action="{{ route('admin.depr.buckets') }}" method="POST">
                <div class="p-5 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-400 mb-1">Bucket Name <span class="text-red-400">*</span></label>
                            <input type="text" id="name" name="name" value="{{ old('name') }}" placeholder="My S3 Bucket"
                                   class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" required>
                            <p class="text-xs text-gray-600 mt-1">A unique name for this S3 bucket configuration.</p>
                        </div>
                        <div>
                            <label for="bucket_name" class="block text-sm font-medium text-gray-400 mb-1">S3 Bucket Name <span class="text-red-400">*</span></label>
                            <input type="text" id="bucket_name" name="bucket_name" value="{{ old('bucket_name') }}" placeholder="my-bucket"
                                   class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" required>
                            <p class="text-xs text-gray-600 mt-1">The actual S3 bucket name on your provider.</p>
                        </div>
                        <div>
                            <label for="endpoint" class="block text-sm font-medium text-gray-400 mb-1">Endpoint</label>
                            <input type="text" id="endpoint" name="endpoint" value="{{ old('endpoint') }}" placeholder="https://s3.amazonaws.com"
                                   class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500">
                            <p class="text-xs text-gray-600 mt-1">S3 endpoint URL. Leave blank for AWS S3.</p>
                        </div>
                        <div>
                            <label for="description" class="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea id="description" name="description" rows="3"
                                      class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500">{{ old('description') }}</textarea>
                            <p class="text-xs text-gray-600 mt-1">A brief description of this configuration.</p>
                        </div>
                        <div>
                            <label for="access_key" class="block text-sm font-medium text-gray-400 mb-1">Access Key <span class="text-red-400">*</span></label>
                            <input type="text" id="access_key" name="access_key" value="{{ old('access_key') }}" placeholder="Access Key"
                                   class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" required>
                            <p class="text-xs text-gray-600 mt-1">Your S3 access key.</p>
                        </div>
                        <div>
                            <label for="secret_key" class="block text-sm font-medium text-gray-400 mb-1">Secret Key <span class="text-red-400">*</span></label>
                            <input type="password" id="secret_key" name="secret_key" value="{{ old('secret_key') }}" placeholder="Secret Key"
                                   class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" required>
                            <p class="text-xs text-gray-600 mt-1">Your S3 secret key.</p>
                        </div>
                    </div>

                    <div class="space-y-3 pt-2">
                        <label class="flex items-center space-x-3 cursor-pointer">
                            <input type="hidden" name="use_path_style_endpoint" value="0" />
                            <input id="use_path_style_endpoint" name="use_path_style_endpoint" type="checkbox" value="1"
                                   {{ old('use_path_style_endpoint') ? 'checked' : '' }}
                                   class="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-gray-300 font-medium">Use Path-Style Endpoints</span>
                        </label>
                        <p class="text-xs text-gray-600 ml-7">Enable for S3-compatible services that require path-style endpoints.</p>

                        <label class="flex items-center space-x-3 cursor-pointer">
                            <input type="hidden" name="enabled" value="0" />
                            <input id="enabled" name="enabled" type="checkbox" value="1"
                                   {{ old('enabled', true) ? 'checked' : '' }}
                                   class="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-gray-300 font-medium">Enabled</span>
                        </label>
                        <p class="text-xs text-gray-600 ml-7">Whether this bucket configuration is active.</p>
                    </div>
                </div>
                <div class="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
                    {!! csrf_field() !!}
                    <button type="button" id="test-connection"
                            class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors border border-gray-700">
                        <span class="spinner hidden"><svg class="animate-spin w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg></span>
                        <span class="btn-text">Test Connection</span>
                    </button>
                    <input type="submit" value="Create Bucket"
                           class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium transition-colors cursor-pointer">
                </div>
            </form>
        </div>
    </div>

    <div class="space-y-4">
        <div class="bg-[#1a1a1a] rounded-lg border border-indigo-800/50 overflow-hidden">
            <div class="px-5 py-4 border-b border-indigo-800/30 flex items-center space-x-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/></svg>
                <h3 class="text-sm font-semibold text-indigo-300 uppercase tracking-wider">Local MinIO</h3>
            </div>
            <form action="{{ route('admin.depr.buckets.provision-local') }}" method="POST">
                <div class="p-5 space-y-4">
                    <p class="text-sm text-gray-500">Provision a bucket on the local MinIO instance. No external configuration needed.</p>
                    <div>
                        <label for="local_name" class="block text-sm font-medium text-gray-400 mb-1">Name <span class="text-red-400">*</span></label>
                        <input type="text" id="local_name" name="name" placeholder="Local Backups"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500" required>
                    </div>
                    <div>
                        <label for="local_bucket_name" class="block text-sm font-medium text-gray-400 mb-1">Bucket Name <span class="text-red-400">*</span></label>
                        <input type="text" id="local_bucket_name" name="bucket_name" placeholder="my-local-bucket"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500" required>
                    </div>
                    <div>
                        <label for="local_description" class="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea id="local_description" name="description" rows="2"
                                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"></textarea>
                    </div>
                </div>
                <div class="px-5 py-4 border-t border-indigo-800/30">
                    {!! csrf_field() !!}
                    <button type="submit"
                            class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded font-medium transition-colors">
                        Provision Local MinIO Bucket
                    </button>
                    <p class="text-xs text-gray-600 mt-2 text-center">
                        Endpoint: <code class="text-indigo-400">{{ $minio_endpoint ?? 'http://localhost:9000' }}</code>
                        &middot;
                        <a href="{{ $minio_console_url ?? 'http://localhost:9001' }}" target="_blank" class="text-indigo-400 hover:text-indigo-300">Console</a>
                    </p>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#test-connection').click(function () {
        const $button = $(this);
        const $spinner = $button.find('.spinner');
        const $text = $button.find('.btn-text');

        $button.prop('disabled', true);
        $spinner.removeClass('hidden');
        $text.text('Testing...');

        $.post('{{ route('admin.depr.buckets.test-connection') }}', {
            _token: '{{ csrf_token() }}',
            access_key: $('#access_key').val(),
            secret_key: $('#secret_key').val(),
            endpoint: $('#endpoint').val(),
            region: $('#region').val(),
            bucket_name: $('#bucket_name').val(),
            use_path_style_endpoint: $('#use_path_style_endpoint').is(':checked') ? '1' : '0',
        })
        .done(function (response) {
            swal({ type: 'success', title: 'Success', text: response.message });
        })
        .fail(function (xhr) {
            const response = xhr.responseJSON || {};
            const message = response.message || xhr.responseText || `Request failed with status ${xhr.status}.`;
            swal({ type: 'error', title: 'Connection Failed', text: message });
        })
        .always(function () {
            $button.prop('disabled', false);
            $spinner.addClass('hidden');
            $text.text('Test Connection');
        });
    });
    </script>
@endsection
