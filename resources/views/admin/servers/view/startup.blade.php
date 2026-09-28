@extends('layouts.admin')

@section('title')
    {{ __('admin/server.view.startup.title', ['server' => $server->name]) }}
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>{{ __('admin/server.view.startup.description') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.servers') }}">{{ __('admin/navigation.sidebar.servers') }}</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">{{ __('admin/server.partials.navigation.startup') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<form action="{{ route('admin.servers.view.startup', $server->id) }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/server.view.startup.startup_command_modification') }}</h3>
                </div>
                <div class="box-body">
                    <label for="pStartup" class="form-label">{{ __('admin/server.view.startup.startup_command') }}</label>
                    <input id="pStartup" name="startup" class="form-control" type="text" value="{{ old('startup', $server->startup) }}" />
                    <p class="small text-muted">{!! __('admin/server.view.startup.startup_command_help') !!}</p>
                </div>
                <div class="box-body">
                    <label for="pDefaultStartupCommand" class="form-label">{{ __('admin/server.view.startup.default_start_command') }}</label>
                    <input id="pDefaultStartupCommand" class="form-control" type="text" readonly />
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary btn-sm pull-right">{{ __('admin/server.view.startup.save_modifications') }}</button>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/server.view.startup.service_configuration') }}</h3>
                </div>
                <div class="box-body row">
                    <div class="col-xs-12">
                        <p class="small text-danger">
                            {{ __('admin/server.view.startup.service_notice') }}
                        </p>
                        <p class="small text-danger">
                            {!! __('admin/server.view.startup.destructive_notice') !!}
                        </p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="pNestId">{{ __('admin/server.view.startup.nest') }}</label>
                        <select name="nest_id" id="pNestId" class="form-control">
                            @foreach($nests as $nest)
                                <option value="{{ $nest->id }}"
                                    @if($nest->id === $server->nest_id)
                                        selected
                                    @endif
                                >{{ $nest->name }}</option>
                            @endforeach
                        </select>
                        <p class="small text-muted no-margin">{{ __('admin/server.view.startup.nest_help') }}</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="pEggId">{{ __('admin/server.view.startup.egg') }}</label>
                        <select name="egg_id" id="pEggId" class="form-control"></select>
                        <p class="small text-muted no-margin">{{ __('admin/server.view.startup.egg_help') }}</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input id="pSkipScripting" name="skip_scripts" type="checkbox" value="1" @if($server->skip_scripts) checked @endif />
                            <label for="pSkipScripting" class="strong">{{ __('admin/server.view.startup.skip_egg_install_script') }}</label>
                        </div>
                        <p class="small text-muted no-margin">{{ __('admin/server.view.startup.skip_egg_install_script_help') }}</p>
                    </div>
                </div>
            </div>
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/server.view.startup.docker_image_configuration') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pDockerImage">{{ __('admin/server.view.startup.image') }}</label>
                        <select id="pDockerImage" name="docker_image" class="form-control"></select>
                        <input id="pDockerImageCustom" name="custom_docker_image" value="{{ old('custom_docker_image') }}" class="form-control" placeholder="{{ __('admin/server.view.startup.custom_image_placeholder') }}" style="margin-top:1rem"/>
                        <p class="small text-muted no-margin">{{ __('admin/server.view.startup.docker_image_help') }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="row" id="appendVariablesTo"></div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    <script>
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    $(document).ready(function () {
        $('#pEggId').select2({placeholder: @js(__('admin/server.view.startup.select_nest_egg'))}).on('change', function () {
            var selectedEgg = _.isNull($(this).val()) ? $(this).find('option').first().val() : $(this).val();
            var parentChain = _.get(Hydrodactyl.nests, $("#pNestId").val());
            var objectChain = _.get(parentChain, 'eggs.' + selectedEgg);

            const images = _.get(objectChain, 'docker_images', [])
            $('#pDockerImage').html('');
            const keys = Object.keys(images);
            for (let i = 0; i < keys.length; i++) {
                let opt = document.createElement('option');
                opt.value = images[keys[i]];
                opt.innerText = keys[i] + " (" + images[keys[i]] + ")";
                if (objectChain.id === parseInt(Hydrodactyl.server.egg_id) && Hydrodactyl.server.image == opt.value) {
                    opt.selected = true
                }
                $('#pDockerImage').append(opt);
            }
            $('#pDockerImage').on('change', function () {
                $('#pDockerImageCustom').val('');
            })

            if (objectChain.id === parseInt(Hydrodactyl.server.egg_id)) {
                if ($('#pDockerImage').val() != Hydrodactyl.server.image) {
                    $('#pDockerImageCustom').val(Hydrodactyl.server.image);
                }
            }

            if (!_.get(objectChain, 'startup', false)) {
                $('#pDefaultStartupCommand').val(_.get(parentChain, 'startup', @js(__('admin/server.view.startup.startup_not_defined'))));
            } else {
                $('#pDefaultStartupCommand').val(_.get(objectChain, 'startup'));
            }

            $('#appendVariablesTo').html('');
            $.each(_.get(objectChain, 'variables', []), function (i, item) {
                var setValue = _.get(Hydrodactyl.server_variables, item.env_variable, item.default_value);
                var isRequired = (item.required === 1) ? '<span class="label label-danger">' + @js(__('strings.required')) + '</span> ' : '';
                var dataAppend = ' \
                    <div class="col-xs-12"> \
                        <div class="box"> \
                            <div class="box-header with-border"> \
                                <h3 class="box-title">' + isRequired + escapeHtml(item.name) + '</h3> \
                            </div> \
                            <div class="box-body"> \
                                <input name="environment[' + escapeHtml(item.env_variable) + ']" class="form-control" type="text" id="egg_variable_' + escapeHtml(item.env_variable) + '" /> \
                                <p class="no-margin small text-muted">' + escapeHtml(item.description) + '</p> \
                            </div> \
                            <div class="box-footer"> \
                                <p class="no-margin text-muted small"><strong>' + @js(__('admin/server.view.startup.startup_command_variable')) + '</strong> <code>' + escapeHtml(item.env_variable) + '</code></p> \
                                <p class="no-margin text-muted small"><strong>' + @js(__('admin/server.view.startup.input_rules')) + '</strong> <code>' + escapeHtml(item.rules) + '</code></p> \
                            </div> \
                        </div> \
                    </div>';
                $('#appendVariablesTo').append(dataAppend).find('#egg_variable_' + item.env_variable).val(setValue);
            });
        });

        $('#pNestId').select2({placeholder: @js(__('admin/server.view.startup.select_nest'))}).on('change', function () {
            $('#pEggId').html('').select2({
                data: $.map(_.get(Hydrodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                    return {
                        id: item.id,
                        text: item.name,
                    };
                }),
            });

            if (_.isObject(_.get(Hydrodactyl.nests, $(this).val() + '.eggs.' + Hydrodactyl.server.egg_id))) {
                $('#pEggId').val(Hydrodactyl.server.egg_id);
            }

            $('#pEggId').change();
        }).change();
    });
    </script>
@endsection
