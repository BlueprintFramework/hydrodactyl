@extends('layouts.admin')

@section('title')
    S3 — {{ $s3->name }}: Details
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">{{ $s3->name }}
                <small class="text-gray-500 ml-2">Edit details for this S3 configuration.</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets') }}" class="text-blue-400 hover:text-blue-300">S3 Configurations</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets.view', $s3->id) }}" class="text-blue-400 hover:text-blue-300">{{ $s3->name }}</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">Details</li>
        </ol>
    </div>
@endsection

@section('content')
@include('admin.s3.partials.navigation')

<div class="max-w-3xl mt-6">
    <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-800">
            <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">S3 Configuration</h3>
        </div>
        <form action="{{ route('admin.depr.buckets.view.details', $s3->id) }}" method="POST">
            <div class="p-5 space-y-4">
                @if($s3->is_local)
                    <div class="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-4 text-sm text-indigo-300">
                        This is a local MinIO bucket. Some fields are auto-configured.
                    </div>
                @endif
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-400 mb-1">Name <span class="text-red-400">*</span></label>
                        <input type="text" id="name" name="name" value="{{ old('name', $s3->name) }}"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" required />
                        <p class="text-xs text-gray-600 mt-1">A display name for this S3 configuration.</p>
                    </div>
                    <div>
                        <label for="bucket_name" class="block text-sm font-medium text-gray-400 mb-1">Bucket Name <span class="text-red-400">*</span></label>
                        <input type="text" id="bucket_name" name="bucket_name" value="{{ old('bucket_name', $s3->bucket_name) }}"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" required />
                        <p class="text-xs text-gray-600 mt-1">The name of the S3 bucket.</p>
                    </div>
                    <div>
                        <label for="access_key" class="block text-sm font-medium text-gray-400 mb-1">Access Key <span class="text-red-400">*</span></label>
                        <input type="text" id="access_key" name="access_key" value="{{ old('access_key', $s3->access_key) }}"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" required />
                        <p class="text-xs text-gray-600 mt-1">The access key for the S3 service.</p>
                    </div>
                    <div>
                        <label for="secret_key" class="block text-sm font-medium text-gray-400 mb-1">Secret Key <span class="text-red-400">*</span></label>
                        <input type="password" id="secret_key" name="secret_key" value="{{ old('secret_key', $s3->secret_key) }}"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" required />
                        <p class="text-xs text-gray-600 mt-1">The secret key for the S3 service.</p>
                    </div>
                    <div>
                        <label for="endpoint" class="block text-sm font-medium text-gray-400 mb-1">Endpoint</label>
                        <input type="url" id="endpoint" name="endpoint" value="{{ old('endpoint', $s3->endpoint) }}"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
                        <p class="text-xs text-gray-600 mt-1">Leave empty for AWS S3.</p>
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea id="description" name="description" rows="3"
                                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">{{ old('description', $s3->description) }}</textarea>
                    </div>
                </div>

                <div class="space-y-3 pt-2">
                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input type="hidden" name="use_path_style_endpoint" value="0" />
                        <input id="use_path_style_endpoint" name="use_path_style_endpoint" type="checkbox" value="1"
                               {{ ((int) old('use_path_style_endpoint', $s3->use_path_style_endpoint ? 1 : 0)) ? 'checked' : '' }}
                               class="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500" {{ $s3->is_local ? 'disabled' : '' }}>
                        <span class="text-sm text-gray-300 font-medium">Use Path Style Endpoints</span>
                    </label>
                    <p class="text-xs text-gray-600 ml-7">Enable for S3-compatible services requiring path-style endpoints.</p>

                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input type="hidden" name="enabled" value="0" />
                        <input id="enabled" name="enabled" type="checkbox" value="1"
                               {{ ((int) old('enabled', $s3->enabled ? 1 : 0)) ? 'checked' : '' }}
                               class="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500">
                        <span class="text-sm text-gray-300 font-medium">Enabled</span>
                    </label>
                    <p class="text-xs text-gray-600 ml-7">Enable or disable this S3 configuration.</p>
                </div>
            </div>
            <div class="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
                {!! csrf_field() !!}
                <button type="button" id="test-connection"
                        class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors border border-gray-700">
                    <span class="spinner hidden"><svg class="animate-spin w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg></span>
                    <span class="btn-text">Test Connection</span>
                </button>
                <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium transition-colors">Update Configuration</button>
            </div>
        </form>
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
            access_key: $('input[name="access_key"]').val(),
            secret_key: $('input[name="secret_key"]').val(),
            endpoint: $('input[name="endpoint"]').val(),
            region: $('input[name="region"]').val(),
            bucket_name: $('input[name="bucket_name"]').val(),
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
