@extends('layouts.admin')

@section('title')
    S3 — {{ $s3->name }}: Delete
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">{{ $s3->name }}
                <small class="text-gray-500 ml-2">Delete this S3 configuration.</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets') }}" class="text-blue-400 hover:text-blue-300">S3 Configurations</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.buckets.view', $s3->id) }}" class="text-blue-400 hover:text-blue-300">{{ $s3->name }}</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">Delete</li>
        </ol>
    </div>
@endsection

@section('content')
@include('admin.s3.partials.navigation')

<div class="max-w-xl mt-6">
    <div class="bg-red-900/10 border border-red-800/30 rounded-lg overflow-hidden">
        <div class="px-5 py-4 border-b border-red-800/30 flex items-center space-x-2">
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <h3 class="text-sm font-semibold text-red-300 uppercase tracking-wider">Delete S3 Configuration</h3>
        </div>
        <div class="p-5">
            <p class="text-sm text-gray-300 mb-4">This action will permanently delete this S3 bucket configuration.</p>
            @if($s3->servers_count > 0)
                <div class="bg-red-900/30 border border-red-700/40 rounded-lg p-4 mb-4">
                    <p class="text-sm text-red-300">
                        <strong class="text-red-200">{{ $s3->servers_count }} server(s)</strong> are currently using this S3 configuration. You must reassign them to another bucket before deleting.
                    </p>
                </div>
            @else
                <div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
                    <p class="text-sm text-yellow-400">
                        <svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                        Deleting an S3 configuration is irreversible. Any backups stored in this bucket will become inaccessible from the panel.
                    </p>
                </div>
            @endif
        </div>
        <div class="px-5 py-4 border-t border-red-800/30">
            <form id="deleteform" action="{{ route('admin.depr.buckets.view.delete', $s3->id) }}" method="POST">
                @csrf
                @method('DELETE')
                <button id="deletebtn"
                        class="px-5 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        {{ $s3->servers_count > 0 ? 'disabled' : '' }}>
                    <svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    Delete This Configuration
                </button>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    @if($s3->servers_count === 0)
    <script>
    $('#deletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: 'Are you sure that you want to delete this S3 configuration? There is no going back.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#deleteform').submit()
        });
    });
    </script>
    @endif
@endsection
