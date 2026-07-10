@extends('layouts.admin')

@section('title')
    Nests &rarr; {{ $nest->name }}
@endsection

@section('content-header')
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-100">{{ $nest->name }}
                <small class="text-gray-500 ml-2">{{ str_limit($nest->description, 50) }}</small>
            </h1>
        </div>
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
            <li><span class="mx-1">/</span></li>
            <li><a href="{{ route('admin.depr.nests') }}" class="text-blue-400 hover:text-blue-300">Nests</a></li>
            <li><span class="mx-1">/</span></li>
            <li class="text-gray-400">{{ $nest->name }}</li>
        </ol>
    </div>
@endsection

@section('content')
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <div>
        <form action="{{ route('admin.depr.nests.view', $nest->id) }}" method="POST">
            <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-800">
                    <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Nest Details</h3>
                </div>
                <div class="p-5 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Name <span class="text-red-400">*</span></label>
                        <input type="text" name="name" value="{{ $nest->name }}"
                               class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
                        <p class="text-xs text-gray-600 mt-1">A descriptive category name encompassing all options within the service.</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea name="description" rows="7"
                                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">{{ $nest->description }}</textarea>
                    </div>
                </div>
                <div class="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
                    {!! csrf_field() !!}
                    <button id="deleteButton" type="submit" name="_method" value="DELETE"
                            class="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors">
                        <svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        Delete Nest
                    </button>
                    <button type="submit" name="_method" value="PATCH"
                            class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </form>
    </div>

    <div class="space-y-4">
        <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-800">
                <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Nest Info</h3>
            </div>
            <div class="p-5 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Nest ID</label>
                    <input type="text" readonly class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed" value="{{ $nest->id }}" />
                    <p class="text-xs text-gray-600 mt-1">Used for identification internally and through the API.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Author</label>
                    <input type="text" readonly class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed" value="{{ $nest->author }}" />
                    <p class="text-xs text-gray-600 mt-1">Direct questions and issues to the author.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">UUID</label>
                    <input type="text" readonly class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed" value="{{ $nest->uuid }}" />
                    <p class="text-xs text-gray-600 mt-1">Assigned to all servers using this option.</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="mt-6">
    <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Nest Eggs</h3>
            <a href="{{ route('admin.depr.nests.egg.new') }}">
                <button type="button" class="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors">
                    + New Egg
                </button>
            </a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-gray-800 bg-gray-900/50">
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Servers</th>
                        <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($nest->eggs as $egg)
                        <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
                            <td class="px-5 py-3"><code class="text-blue-400">{{ $egg->id }}</code></td>
                            <td class="px-5 py-3">
                                <a href="{{ route('admin.depr.nests.egg.view', $egg->id) }}" class="text-blue-400 hover:text-blue-300 font-medium" title="{{ $egg->author }}">
                                    {{ $egg->name }}
                                </a>
                            </td>
                            <td class="px-5 py-3 text-gray-400 max-w-xs truncate">{{ $egg->description }}</td>
                            <td class="px-5 py-3 text-center text-gray-300"><code>{{ $egg->servers->count() }}</code></td>
                            <td class="px-5 py-3 text-center">
                                <a href="{{ route('admin.depr.nests.egg.export', ['egg' => $egg->id]) }}"
                                   class="text-gray-500 hover:text-blue-400 transition-colors"
                                   title="Export Egg">
                                    <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-5 py-12 text-center text-gray-500">
                                <p class="text-lg font-medium mb-1">No eggs in this nest</p>
                                <p class="text-sm">Create a new egg to get started.</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#deleteButton').on('mouseenter', function (event) {
            $(this).html('<svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Delete Nest');
        }).on('mouseleave', function (event) {
            $(this).html('<svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Delete Nest');
        });
    </script>
@endsection
