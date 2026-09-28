@extends('layouts.admin')

@section('title')
    {{ __('admin/server.view.build.title', ['server' => $server->name]) }}
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>{{ __('admin/server.view.build.description') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.servers') }}">{{ __('admin/navigation.sidebar.servers') }}</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">{{ __('admin/server.partials.navigation.build_configuration') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<div class="row">
    <form action="{{ route('admin.servers.view.build', $server->id) }}" method="POST">
        <div class="col-sm-5">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/server.view.build.resource_management') }}</h3>
                </div>
                <div class="box-body">
                <div class="form-group">
                        <label for="cpu" class="control-label">{{ __('admin/server.view.build.cpu_limit') }}</label>
                        <div class="input-group">
                            <input type="text" name="cpu" class="form-control" value="{{ old('cpu', $server->cpu) }}"/>
                            <span class="input-group-addon">%</span>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.cpu_limit_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="threads" class="control-label">{{ __('admin/server.view.build.cpu_pinning') }}</label>
                        <div>
                            <input type="text" name="threads" class="form-control" value="{{ old('threads', $server->threads) }}"/>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.cpu_pinning_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="memory" class="control-label">{{ __('admin/server.view.build.allocated_memory') }}</label>
                        <div class="input-group">
                            <input type="text" name="memory" data-multiplicator="true" class="form-control" value="{{ old('memory', $server->memory) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.memory_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="overhead_memory" class="control-label">{{ __('admin/server.view.build.overhead_memory') }}</label>
                        <div class="input-group">
                            <input type="text" name="overhead_memory" data-multiplicator="true" class="form-control" value="{{ old('overhead_memory', $server->overhead_memory) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.overhead_memory_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="swap" class="control-label">{{ __('admin/server.view.build.allocated_swap') }}</label>
                        <div class="input-group">
                            <input type="text" name="swap" data-multiplicator="true" class="form-control" value="{{ old('swap', $server->swap) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.swap_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="cpu" class="control-label">{{ __('admin/server.view.build.disk_space_limit') }}</label>
                        <div class="input-group">
                            <input type="text" name="disk" class="form-control" value="{{ old('disk', $server->disk) }}"/>
                            <span class="input-group-addon">MiB</span>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.disk_space_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="io" class="control-label">{{ __('admin/server.view.build.block_io_proportion') }}</label>
                        <div>
                            <input type="text" name="io" class="form-control" value="{{ old('io', $server->io) }}"/>
                        </div>
                        <p class="text-muted small">{!! __('admin/server.view.build.block_io_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="cpu" class="control-label">{{ __('admin/server.view.build.oom_killer') }}</label>
                        <div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pOomKillerEnabled" value="0" name="oom_disabled" @if(!$server->oom_disabled)checked @endif>
                                <label for="pOomKillerEnabled">{{ __('admin/server.view.build.enabled') }}</label>
                            </div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pOomKillerDisabled" value="1" name="oom_disabled" @if($server->oom_disabled)checked @endif>
                                <label for="pOomKillerDisabled">{{ __('admin/server.view.build.disabled') }}</label>
                            </div>
                            <p class="text-muted small">
                                {{ __('admin/server.view.build.oom_killer_help') }}
                            </p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="exclude_from_resource_calculation" class="control-label">{{ __('admin/server.view.build.resource_calculation') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pResourceCalcIncluded" value="0" name="exclude_from_resource_calculation" @if(!$server->exclude_from_resource_calculation)checked @endif>
                                <label for="pResourceCalcIncluded">{{ __('admin/server.view.build.included') }}</label>
                            </div>
                            <div class="radio radio-warning radio-inline">
                                <input type="radio" id="pResourceCalcExcluded" value="1" name="exclude_from_resource_calculation" @if($server->exclude_from_resource_calculation)checked @endif>
                                <label for="pResourceCalcExcluded">{{ __('admin/server.view.build.excluded') }}</label>
                            </div>
                            <p class="text-muted small">
                                {{ __('admin/server.view.build.resource_calculation_help') }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-7">
            <div class="row">
                <div class="col-xs-12">
                    <div class="box">
                        <div class="box-header with-border">
                            <h3 class="box-title">{{ __('admin/server.view.build.application_feature_limits') }}</h3>
                        </div>
                        <div class="box-body">
                            <div class="row">
                                <div class="form-group col-xs-6">
                                    <label for="database_limit" class="control-label">{{ __('admin/server.view.build.database_limit') }}</label>
                                    <div>
                                        <input type="text" name="database_limit" class="form-control" value="{{ old('database_limit', $server->database_limit) }}"/>
                                    </div>
                                    <p class="text-muted small">{{ __('admin/server.view.build.database_limit_help') }}</p>
                                </div>
                                <div class="form-group col-xs-6">
                                    <label for="allocation_limit" class="control-label">{{ __('admin/server.view.build.allocation_limit') }}</label>
                                    <div>
                                        <input type="text" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', $server->allocation_limit) }}"/>
                                    </div>
                                    <p class="text-muted small">{{ __('admin/server.view.build.allocation_limit_help') }}</p>
                                </div>
                                <div class="form-group col-xs-6">
                                    <label for="backup_limit" class="control-label">{{ __('admin/server.view.build.backup_limit') }}</label>
                                    <div>
                                        <input type="text" name="backup_limit" class="form-control" value="{{ old('backup_limit', $server->backup_limit) }}"/>
                                    </div>
                                    <p class="text-muted small">{{ __('admin/server.view.build.backup_limit_help') }}</p>
                                </div>
                                <div class="form-group col-xs-6">
                                    <label for="backup_storage_limit" class="control-label">{{ __('admin/server.view.build.backup_storage_limit') }}</label>
                                    <div class="input-group">
                                        <input type="text" name="backup_storage_limit" data-multiplicator="true" class="form-control" value="{{ old('backup_storage_limit', $server->backup_storage_limit) }}"/>
                                        <span class="input-group-addon">MiB</span>
                                    </div>
                                    <p class="text-muted small">{{ __('admin/server.view.build.backup_storage_limit_help') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xs-12">
                    <div class="box">
                        <div class="box-header with-border">
                            <h3 class="box-title">{{ __('admin/server.view.build.allocation_management') }}</h3>
                        </div>
                        <div class="box-body">
                            <div class="form-group">
                                <label for="pAllocation" class="control-label">{{ __('admin/server.view.build.game_port') }}</label>
                                <select id="pAllocation" name="allocation_id" class="form-control">
                                    @foreach ($assigned as $assignment)
                                        <option value="{{ $assignment->id }}"
                                            @if($assignment->id === $server->allocation_id)
                                                selected="selected"
                                            @endif
                                        >{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                    @endforeach
                                </select>
                                <p class="text-muted small">{{ __('admin/server.view.build.game_port_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pAddAllocations" class="control-label">{{ __('admin/server.view.build.assign_additional_ports') }}</label>
                                <div>
                                    <select name="add_allocations[]" class="form-control" multiple id="pAddAllocations">
                                        @foreach ($unassigned as $assignment)
                                            <option value="{{ $assignment->id }}">{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <p class="text-muted small">{{ __('admin/server.view.build.assign_additional_ports_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pRemoveAllocations" class="control-label">{{ __('admin/server.view.build.remove_additional_ports') }}</label>
                                <div>
                                    <select name="remove_allocations[]" class="form-control" multiple id="pRemoveAllocations">
                                        @foreach ($assigned as $assignment)
                                            <option value="{{ $assignment->id }}">{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <p class="text-muted small">{{ __('admin/server.view.build.remove_additional_ports_help') }}</p>
                            </div>
                        </div>
                        <div class="box-footer">
                            {!! csrf_field() !!}
                            <button type="submit" class="btn btn-primary pull-right">{{ __('admin/server.view.build.update_button') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#pAddAllocations').select2();
    $('#pRemoveAllocations').select2();
    $('#pAllocation').select2();
    </script>
@endsection
