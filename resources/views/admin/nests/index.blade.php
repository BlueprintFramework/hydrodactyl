@extends('layouts.admin')

@section('title')
    Nests
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">Nests
                <small class="text-gray-500 ml-2">All nests currently available on this system.</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">Nests</li>
        </ol>
    </div>
@endsection

@section('content')
<div class="mt-6">
    <div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <svg class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        <div>
            <strong class="text-yellow-400 text-sm">Eggs are powerful</strong>
            <p class="text-xs text-yellow-600/80 mt-0.5">Modifying them incorrectly can break your servers. Avoid editing default eggs unless you know what you're doing.</p>
        </div>
    </div>

    <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Configured Nests</h3>
            <div class="flex items-center space-x-2">
                <button type="button" class="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors" data-toggle="modal" data-target="#importServiceOptionModal">
                    <svg class="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    Import Egg
                </button>
                <a href="{{ route('admin.depr.nests.new') }}">
                    <button type="button" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors">
                        + New Nest
                    </button>
                </a>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-gray-800 bg-gray-900/50">
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Eggs</th>
                        <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Servers</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($nests as $nest)
                        <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
                            <td class="px-5 py-3"><code class="text-blue-400">{{ $nest->id }}</code></td>
                            <td class="px-5 py-3">
                                <a href="{{ route('admin.depr.nests.view', $nest->id) }}" class="text-blue-400 hover:text-blue-300 font-medium" title="{{ $nest->author }}">
                                    {{ $nest->name }}
                                </a>
                            </td>
                            <td class="px-5 py-3 text-gray-400 max-w-xs truncate">{{ $nest->description }}</td>
                            <td class="px-5 py-3 text-center text-gray-300">{{ $nest->eggs_count }}</td>
                            <td class="px-5 py-3 text-center text-gray-300">{{ $nest->servers_count }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-5 py-12 text-center text-gray-500">
                                <p class="text-lg font-medium mb-1">No nests configured</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content" style="background: #1a1a1a; border: 1px solid #2d2d2d;">
            <div class="modal-header" style="border-bottom: 1px solid #2d2d2d; padding: 16px 20px;">
                <button type="button" class="close text-gray-400 hover:text-gray-200" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title text-gray-100 text-lg font-semibold">Import an Egg</h4>
            </div>
            <form action="{{ route('admin.depr.nests.egg.import') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body" style="padding: 20px;">
                    <div class="space-y-4">
                        <div>
                            <label class="control-label text-sm font-medium text-gray-400 mb-1">Egg File <span class="text-red-400">*</span></label>
                            <input id="pImportFile" type="file" name="import_file" class="form-control block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500" accept="application/json" />
                            <p class="text-xs text-gray-600 mt-1">Select the <code class="text-blue-400">.json</code> file for the new egg to import.</p>
                        </div>
                        <div>
                            <label class="control-label text-sm font-medium text-gray-400 mb-1">Associated Nest <span class="text-red-400">*</span></label>
                            <select id="pImportToNest" name="import_to_nest" class="form-control w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <p class="text-xs text-gray-600 mt-1">Select the nest that this egg will be associated with.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="border-top: 1px solid #2d2d2d; padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px;">
                    {{ csrf_field() }}
                    <button type="button" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors">Import</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionFromUrlModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content" style="background: #1a1a1a; border: 1px solid #2d2d2d;">
            <div class="modal-header" style="border-bottom: 1px solid #2d2d2d; padding: 16px 20px;">
                <button type="button" class="close text-gray-400 hover:text-gray-200" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title text-gray-100 text-lg font-semibold">Import an Egg</h4>
            </div>
            <form action="{{ route('admin.depr.nests.egg.import_url') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body" style="padding: 20px;">
                    <div class="space-y-4">
                        <div>
                            <label class="control-label text-sm font-medium text-gray-400 mb-1">Egg URL <span class="text-red-400">*</span></label>
                            <input id="pImportFile" type="url" name="import_file_url" class="form-control w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" accept="application/json" />
                            <p class="text-xs text-gray-600 mt-1">Type the URL of the file for the new egg to import.</p>
                        </div>
                        <div>
                            <label class="control-label text-sm font-medium text-gray-400 mb-1">Associated Nest <span class="text-red-400">*</span></label>
                            <select id="pImportToNestUrl" name="import_to_nest" class="form-control w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <p class="text-xs text-gray-600 mt-1">Select the nest that this egg will be associated with.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="border-top: 1px solid #2d2d2d; padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px;">
                    {{ csrf_field() }}
                    <button type="button" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors">Import</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            $('#pImportToNest').select2();
            $('#pImportToNestUrl').select2();
        });
    </script>
@endsection
