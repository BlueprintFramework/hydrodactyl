@extends('layouts.admin')

@section('title')
    {!! __('admin/eggs.view.title', ['name' => e($egg->name)]) !!}
@endsection

@section('content-header')
    <h1>{{ $egg->name }}<small>{{ str_limit($egg->description, 50) }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nests') }}">{{ __('admin/navigation.sidebar.nests') }}</a></li>
        <li><a href="{{ route('admin.nests.view', $egg->nest->id) }}">{{ $egg->nest->name }}</a></li>
        <li class="active">{{ $egg->name }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li class="active"><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ __('strings.configuration') }}</a></li>
                <li><a href="{{ route('admin.nests.egg.variables', $egg->id) }}">{{ __('admin/eggs.view.tab_variables') }}</a></li>
                <li><a href="{{ route('admin.nests.egg.scripts', $egg->id) }}">{{ __('admin/eggs.view.tab_install_script') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<form action="{{ route('admin.nests.egg.view', $egg->id) }}" enctype="multipart/form-data" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-danger">
                <div class="box-body">
                    <div class="row">
                        <div class="col-xs-8">
                            <div class="form-group no-margin-bottom">
                                <label for="pName" class="control-label">{{ __('admin/eggs.view.egg_file') }}</label>
                                <div>
                                    <input type="file" name="import_file" class="form-control" style="border: 0;margin-left:-10px;" />
                                    <p class="text-muted small no-margin-bottom">{{ __('admin/eggs.view.egg_file_help') }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-xs-4">
                            {!! csrf_field() !!}
                            <button type="submit" name="_method" value="PUT" class="btn btn-sm btn-danger pull-right">{{ __('admin/eggs.view.update_egg') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>
<form action="{{ route('admin.nests.egg.view', $egg->id) }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('strings.configuration') }}</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pName" class="control-label">{{ __('strings.name') }} <span class="field-required"></span></label>
                                <input type="text" id="pName" name="name" value="{{ $egg->name }}" class="form-control" />
                                <p class="text-muted small">{{ __('admin/eggs.view.name_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pUuid" class="control-label">{{ __('admin/eggs.view.uuid') }}</label>
                                <input type="text" id="pUuid" readonly value="{{ $egg->uuid }}" class="form-control" />
                                <p class="text-muted small">{{ __('admin/eggs.view.uuid_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pAuthor" class="control-label">{{ __('admin/eggs.view.author') }}</label>
                                <input type="text" id="pAuthor" readonly value="{{ $egg->author }}" class="form-control" />
                                <p class="text-muted small">{{ __('admin/eggs.view.author_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pDockerImage" class="control-label">{{ __('admin/eggs.view.docker_images') }} <span class="field-required"></span></label>
                                <textarea id="pDockerImages" name="docker_images" class="form-control" rows="4">{{ implode(PHP_EOL, $images) }}</textarea>
                                <p class="text-muted small">
                                    {!! __('admin/eggs.view.docker_images_help') !!}
                                </p>
                            </div>
                            <div class="form-group">
                                <div class="checkbox checkbox-primary no-margin-bottom">
                                    <input id="pForceOutgoingIp" name="force_outgoing_ip" type="checkbox" value="1" @if($egg->force_outgoing_ip) checked @endif />
                                    <label for="pForceOutgoingIp" class="strong">{{ __('admin/eggs.view.force_outgoing_ip') }}</label>
                                    <p class="text-muted small">
                                        {!! __('admin/eggs.view.force_outgoing_ip_help') !!}
                                    </p>
                                </div>
                            </div>

                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pDescription" class="control-label">{{ __('admin/eggs.view.description') }}</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="8">{{ $egg->description }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.view.description_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pStartup" class="control-label">{{ __('admin/eggs.view.startup_command') }} <span class="field-required"></span></label>
                                <textarea id="pStartup" name="startup" class="form-control" rows="8">{{ $egg->startup }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.view.startup_command_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigFeatures" class="control-label">{{ __('admin/eggs.view.features') }}</label>
                                <div>
                                    <select class="form-control" name="features[]" id="pConfigFeatures" multiple>
                                        @foreach(($egg->features ?? []) as $feature)
                                            <option value="{{ $feature }}" selected>{{ $feature }}</option>
                                        @endforeach
                                    </select>
                                    <p class="text-muted small">{{ __('admin/eggs.view.features_help') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/eggs.view.process_management') }}</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-xs-12">
                            <div class="alert alert-warning">
                                <p>{{ __('admin/eggs.view.process_warning') }}</p>
                                <p>{{ __('admin/eggs.view.fields_required_notice') }}</p>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pConfigFrom" class="form-label">{{ __('admin/eggs.view.copy_settings_from') }}</label>
                                <select name="config_from" id="pConfigFrom" class="form-control">
                                    <option value="">{{ __('strings.none') }}</option>
                                    @foreach($egg->nest->eggs as $o)
                                        <option value="{{ $o->id }}" {{ ($egg->config_from !== $o->id) ?: 'selected' }}>{{ $o->name }} &lt;{{ $o->author }}&gt;</option>
                                    @endforeach
                                </select>
                                <p class="text-muted small">{{ __('admin/eggs.view.copy_settings_from_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigStop" class="form-label">{{ __('admin/eggs.view.stop_command') }}</label>
                                <input type="text" id="pConfigStop" name="config_stop" class="form-control" value="{{ $egg->config_stop }}" />
                                <p class="text-muted small">{!! __('admin/eggs.view.stop_command_help') !!}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigLogs" class="form-label">{{ __('admin/eggs.view.log_configuration') }}</label>
                                <textarea data-action="handle-tabs" id="pConfigLogs" name="config_logs" class="form-control" rows="6">{{ ! is_null($egg->config_logs) ? json_encode(json_decode($egg->config_logs), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '' }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.view.log_configuration_help') }}</p>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pConfigFiles" class="form-label">{{ __('admin/eggs.view.configuration_files') }}</label>
                                <textarea data-action="handle-tabs" id="pConfigFiles" name="config_files" class="form-control" rows="6">{{ ! is_null($egg->config_files) ? json_encode(json_decode($egg->config_files), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '' }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.view.configuration_files_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigStartup" class="form-label">{{ __('admin/eggs.view.start_configuration') }}</label>
                                <textarea data-action="handle-tabs" id="pConfigStartup" name="config_startup" class="form-control" rows="6">{{ ! is_null($egg->config_startup) ? json_encode(json_decode($egg->config_startup), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '' }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.view.start_configuration_help') }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" name="_method" value="PATCH" class="btn btn-primary btn-sm pull-right">{{ __('strings.save') }}</button>
                    <a href="{{ route('admin.nests.egg.export', $egg->id) }}" class="btn btn-sm btn-info pull-right" style="margin-right:10px;">{{ __('admin/eggs.view.export') }}</a>
                    <button id="deleteButton" type="submit" name="_method" value="DELETE" class="btn btn-danger btn-sm muted muted-hover">
                        <i class="fa fa-trash-o"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#pConfigFrom').select2();
    $('#deleteButton').on('mouseenter', function (event) {
        $(this).find('i').html(@js(__('admin/eggs.view.delete_js')));
    }).on('mouseleave', function (event) {
        $(this).find('i').html('');
    });
    $('textarea[data-action="handle-tabs"]').on('keydown', function(event) {
        if (event.keyCode === 9) {
            event.preventDefault();

            var curPos = $(this)[0].selectionStart;
            var prepend = $(this).val().substr(0, curPos);
            var append = $(this).val().substr(curPos);

            $(this).val(prepend + '    ' + append);
        }
    });
    $('#pConfigFeatures').select2({
        tags: true,
        selectOnClose: false,
        tokenSeparators: [',', ' '],
    });
    </script>
@endsection
