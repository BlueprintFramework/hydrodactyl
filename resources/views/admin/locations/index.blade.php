@extends('layouts.admin')

@section('title')
    {{ __('admin/navigation.sidebar.locations') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/navigation.sidebar.locations') }}<small>{{ __('admin/locations.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/navigation.sidebar.locations') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/locations.index.list') }}</h3>
                <div class="box-tools">
                    <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newLocationModal">{{ __('admin/locations.index.create_new') }}</button>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>{{ __('strings.id') }}</th>
                            <th>{{ __('admin/locations.index.short_code') }}</th>
                            <th>{{ __('admin/locations.index.description') }}</th>
                            <th class="text-center">{{ __('admin/locations.index.memory_alloc') }}</th>
                            <th class="text-center">{{ __('admin/locations.index.disk_alloc') }}</th>
                            <th class="text-center">{{ __('admin/locations.index.nodes') }}</th>
                            <th class="text-center">{{ __('strings.servers') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($locations as $location)
                            @php
                                $memoryColor = $location->memory_percent < 50 ? '#50af51' : ($location->memory_percent < 70 ? '#e0a800' : '#d9534f');
                                $diskColor = $location->disk_percent < 50 ? '#50af51' : ($location->disk_percent < 70 ? '#e0a800' : '#d9534f');
                            @endphp
                            <tr>
                                <td><code>{{ $location->id }}</code></td>
                                <td><a href="{{ route('admin.locations.view', $location->id) }}">{{ $location->short }}</a></td>
                                <td>{{ $location->long }}</td>
                                <td class="text-center" style="color: {{ $memoryColor }}" title="{{ __('admin/locations.index.allocated') }}: {{ humanizeSize($location->allocated_memory * 1024 * 1024) }} / {{ __('admin/locations.index.total') }}: {{ humanizeSize($location->total_memory * 1024 * 1024) }}">
                                    {{ round($location->memory_percent) }}%
                                </td>
                                <td class="text-center" style="color: {{ $diskColor }}" title="{{ __('admin/locations.index.allocated') }}: {{ humanizeSize($location->allocated_disk * 1024 * 1024) }} / {{ __('admin/locations.index.total') }}: {{ humanizeSize($location->total_disk * 1024 * 1024) }}">
                                    {{ round($location->disk_percent) }}%
                                </td>
                                <td class="text-center">{{ $location->nodes_count }}</td>
                                <td class="text-center">{{ $location->servers_count }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="newLocationModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.locations') }}" method="POST">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">{{ __('admin/locations.index.create_title') }}</h4>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12">
                            <label for="pShortModal" class="form-label">{{ __('admin/locations.index.short_code') }}</label>
                            <input type="text" name="short" id="pShortModal" class="form-control" />
                            <p class="text-muted small">{!! __('admin/locations.index.short_code_help') !!}</p>
                        </div>
                        <div class="col-md-12">
                            <label for="pLongModal" class="form-label">{{ __('admin/locations.index.description') }}</label>
                            <textarea name="long" id="pLongModal" class="form-control" rows="4"></textarea>
                            <p class="text-muted small">{{ __('admin/locations.index.description_help') }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">{{ __('strings.cancel') }}</button>
                    <button type="submit" class="btn btn-success btn-sm">{{ __('strings.create') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
