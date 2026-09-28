@extends('layouts.admin')

@section('title')
    {!! __('admin/eggs.new.title') !!}
@endsection

@section('content-header')
    <h1>{{ __('admin/eggs.new.heading') }}<small>{{ __('admin/eggs.new.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nests') }}">{{ __('admin/navigation.sidebar.nests') }}</a></li>
        <li class="active">{{ __('admin/eggs.new.heading') }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nests.egg.new') }}" method="POST">
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
                                <label for="pNestId" class="form-label">{{ __('admin/eggs.new.associated_nest') }}</label>
                                <div>
                                    <select name="nest_id" id="pNestId">
                                        @foreach($nests as $nest)
                                            <option value="{{ $nest->id }}" {{ old('nest_id') != $nest->id ?: 'selected' }}>{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                        @endforeach
                                    </select>
                                    <p class="text-muted small">{{ __('admin/eggs.new.associated_nest_help') }}</p>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="pName" class="form-label">{{ __('strings.name') }}</label>
                                <input type="text" id="pName" name="name" value="{{ old('name') }}" class="form-control" />
                                <p class="text-muted small">{{ __('admin/eggs.new.name_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pDescription" class="form-label">{{ __('admin/eggs.new.description') }}</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="8">{{ old('description') }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.new.description_help') }}</p>
                            </div>
                            <div class="form-group">
                                <div class="checkbox checkbox-primary no-margin-bottom">
                                    <input id="pForceOutgoingIp" name="force_outgoing_ip" type="checkbox" value="1" {{ \Pterodactyl\Helpers\Utilities::checked('force_outgoing_ip', 0) }} />
                                    <label for="pForceOutgoingIp" class="strong">{{ __('admin/eggs.new.force_outgoing_ip') }}</label>
                                    <p class="text-muted small">
                                        {!! __('admin/eggs.new.force_outgoing_ip_help') !!}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pDockerImage" class="control-label">{{ __('admin/eggs.new.docker_images') }}</label>
                                <textarea id="pDockerImages" name="docker_images" rows="4" placeholder="quay.io/pterodactyl/service" class="form-control">{{ old('docker_images') }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.new.docker_images_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pStartup" class="control-label">{{ __('admin/eggs.new.startup_command') }}</label>
                                <textarea id="pStartup" name="startup" class="form-control" rows="10">{{ old('startup') }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.new.startup_command_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigFeatures" class="control-label">{{ __('admin/eggs.new.features') }}</label>
                                <div>
                                    <select class="form-control" name="features[]" id="pConfigFeatures" multiple>
                                    </select>
                                    <p class="text-muted small">{{ __('admin/eggs.new.features_help') }}</p>
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
                    <h3 class="box-title">{{ __('admin/eggs.new.process_management') }}</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-xs-12">
                            <div class="alert alert-warning">
                                <p>{{ __('admin/eggs.new.fields_required_notice') }}</p>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pConfigFrom" class="form-label">{{ __('admin/eggs.new.copy_settings_from') }}</label>
                                <select name="config_from" id="pConfigFrom" class="form-control">
                                    <option value="">{{ __('strings.none') }}</option>
                                </select>
                                <p class="text-muted small">{{ __('admin/eggs.new.copy_settings_from_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigStop" class="form-label">{{ __('admin/eggs.new.stop_command') }}</label>
                                <input type="text" id="pConfigStop" name="config_stop" class="form-control" value="{{ old('config_stop') }}" />
                                <p class="text-muted small">{!! __('admin/eggs.new.stop_command_help') !!}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigLogs" class="form-label">{{ __('admin/eggs.new.log_configuration') }}</label>
                                <textarea data-action="handle-tabs" id="pConfigLogs" name="config_logs" class="form-control" rows="6">{{ old('config_logs') }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.new.log_configuration_help') }}</p>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label for="pConfigFiles" class="form-label">{{ __('admin/eggs.new.configuration_files') }}</label>
                                <textarea data-action="handle-tabs" id="pConfigFiles" name="config_files" class="form-control" rows="6">{{ old('config_files') }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.new.configuration_files_help') }}</p>
                            </div>
                            <div class="form-group">
                                <label for="pConfigStartup" class="form-label">{{ __('admin/eggs.new.start_configuration') }}</label>
                                <textarea data-action="handle-tabs" id="pConfigStartup" name="config_startup" class="form-control" rows="6">{{ old('config_startup') }}</textarea>
                                <p class="text-muted small">{{ __('admin/eggs.new.start_configuration_help') }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-success btn-sm pull-right">{{ __('strings.create') }}</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    <script>
    $(document).ready(function() {
        $('#pNestId').select2().change();
        $('#pConfigFrom').select2();
    });
    $('#pNestId').on('change', function (event) {
        $('#pConfigFrom').html('<option value="">' + @js(__('strings.none')) + '</option>').select2({
            data: $.map(_.get(Hydrodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                return {
                    id: item.id,
                    text: item.name + ' <' + item.author + '>',
                };
            }),
        });
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
