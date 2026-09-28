@extends('layouts.admin')

@section('title')
    {!! __('admin/eggs.variables.title', ['name' => e($egg->name)]) !!}
@endsection

@section('content-header')
    <h1>{{ $egg->name }}<small>{{ __('admin/eggs.variables.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nests') }}">{{ __('admin/navigation.sidebar.nests') }}</a></li>
        <li><a href="{{ route('admin.nests.view', $egg->nest->id) }}">{{ $egg->nest->name }}</a></li>
        <li><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ $egg->name }}</a></li>
        <li class="active">{{ __('admin/eggs.variables.tab_variables') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ __('strings.configuration') }}</a></li>
                <li class="active"><a href="{{ route('admin.nests.egg.variables', $egg->id) }}">{{ __('admin/eggs.variables.tab_variables') }}</a></li>
                <li><a href="{{ route('admin.nests.egg.scripts', $egg->id) }}">{{ __('admin/eggs.variables.tab_install_script') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box no-border">
            <div class="box-body">
                <a href="#" class="btn btn-sm btn-success pull-right" data-toggle="modal" data-target="#newVariableModal">{{ __('admin/eggs.variables.create_new') }}</a>
            </div>
        </div>
    </div>
</div>
<div class="row">
    @foreach($egg->variables as $variable)
        <div class="col-sm-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ $variable->name }}</h3>
                </div>
                <form action="{{ route('admin.nests.egg.variables.edit', ['egg' => $egg->id, 'variable' => $variable->id]) }}" method="POST">
                    <div class="box-body">
                        <div class="form-group">
                            <label class="form-label">{{ __('strings.name') }}</label>
                            <input type="text" name="name" value="{{ $variable->name }}" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">{{ __('admin/eggs.variables.description') }}</label>
                            <textarea name="description" class="form-control" rows="3">{{ $variable->description }}</textarea>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="form-label">{{ __('admin/eggs.variables.environment_variable') }}</label>
                                <input type="text" name="env_variable" value="{{ $variable->env_variable }}" class="form-control" />
                            </div>
                            <div class="form-group col-md-6">
                                <label class="form-label">{{ __('admin/eggs.variables.default_value') }}</label>
                                <input type="text" name="default_value" value="{{ $variable->default_value }}" class="form-control" />
                            </div>
                            <div class="col-xs-12">
                                <p class="text-muted small">{!! __('admin/eggs.variables.access_help', ['variable' => e($variable->env_variable)]) !!}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{{ __('admin/eggs.variables.permissions') }}</label>
                            <select name="options[]" class="pOptions form-control" multiple>
                                <option value="user_viewable" {{ (! $variable->user_viewable) ?: 'selected' }}>{{ __('admin/eggs.variables.users_can_view') }}</option>
                                <option value="user_editable" {{ (! $variable->user_editable) ?: 'selected' }}>{{ __('admin/eggs.variables.users_can_edit') }}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{{ __('admin/eggs.variables.input_rules') }}</label>
                            <input type="text" name="rules" class="form-control" value="{{ $variable->rules }}" />
                            <p class="text-muted small">{!! __('admin/eggs.variables.input_rules_help') !!}</p>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button class="btn btn-sm btn-primary pull-right" name="_method" value="PATCH" type="submit">{{ __('strings.save') }}</button>
                        <button class="btn btn-sm btn-danger pull-left muted muted-hover" data-action="delete" name="_method" value="DELETE" type="submit"><i class="fa fa-trash-o"></i></button>
                    </div>
                </form>
            </div>
        </div>
    @endforeach
</div>
<div class="modal fade" id="newVariableModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ __('admin/eggs.variables.modal_title') }}</h4>
            </div>
            <form action="{{ route('admin.nests.egg.variables', $egg->id) }}" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="control-label">{{ __('strings.name') }} <span class="field-required"></span></label>
                        <input type="text" name="name" class="form-control" value="{{ old('name') }}"/>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ __('admin/eggs.variables.description') }}</label>
                        <textarea name="description" class="form-control" rows="3">{{ old('description') }}</textarea>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label class="control-label">{{ __('admin/eggs.variables.environment_variable') }} <span class="field-required"></span></label>
                            <input type="text" name="env_variable" class="form-control" value="{{ old('env_variable') }}" />
                        </div>
                        <div class="form-group col-md-6">
                            <label class="control-label">{{ __('admin/eggs.variables.default_value') }}</label>
                            <input type="text" name="default_value" class="form-control" value="{{ old('default_value') }}" />
                        </div>
                        <div class="col-xs-12">
                            <p class="text-muted small">{!! __('admin/eggs.variables.modal_access_help') !!}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ __('admin/eggs.variables.permissions') }}</label>
                        <select name="options[]" class="pOptions form-control" multiple>
                            <option value="user_viewable">{{ __('admin/eggs.variables.users_can_view') }}</option>
                            <option value="user_editable">{{ __('admin/eggs.variables.users_can_edit') }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ __('admin/eggs.variables.input_rules') }} <span class="field-required"></span></label>
                        <input type="text" name="rules" class="form-control" value="{{ old('rules', 'required|string|max:20') }}" placeholder="required|string|max:20" />
                        <p class="text-muted small">{!! __('admin/eggs.variables.input_rules_help') !!}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default pull-left" data-dismiss="modal">{{ __('strings.close') }}</button>
                    <button type="submit" class="btn btn-primary">{{ __('admin/eggs.variables.create_variable') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('.pOptions').select2();
        $('[data-action="delete"]').on('mouseenter', function (event) {
            $(this).find('i').html(@js(__('admin/eggs.variables.delete_js')));
        }).on('mouseleave', function (event) {
            $(this).find('i').html('');
        });
    </script>
@endsection
