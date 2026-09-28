@extends('layouts.admin')

@section('title')
    {!! __('admin/eggs.scripts.title', ['name' => e($egg->name)]) !!}
@endsection

@section('content-header')
    <h1>{{ $egg->name }}<small>{{ __('admin/eggs.scripts.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nests') }}">{{ __('admin/navigation.sidebar.nests') }}</a></li>
        <li><a href="{{ route('admin.nests.view', $egg->nest->id) }}">{{ $egg->nest->name }}</a></li>
        <li><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ $egg->name }}</a></li>
        <li class="active">{{ $egg->name }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ __('strings.configuration') }}</a></li>
                <li><a href="{{ route('admin.nests.egg.variables', $egg->id) }}">{{ __('admin/eggs.scripts.tab_variables') }}</a></li>
                <li class="active"><a href="{{ route('admin.nests.egg.scripts', $egg->id) }}">{{ __('admin/eggs.scripts.install_script') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<form action="{{ route('admin.nests.egg.scripts', $egg->id) }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/eggs.scripts.install_script') }}</h3>
                </div>
                @if(! is_null($egg->copyFrom))
                    <div class="box-body">
                        <div class="callout callout-warning no-margin">
                            {!! __('admin/eggs.scripts.copy_notice', ['name' => e($egg->copyFrom->name), 'url' => route('admin.nests.egg.view', $egg->copyFrom->id)]) !!}
                        </div>
                    </div>
                @endif
                <div class="box-body no-padding">
                    <div id="editor_install"style="height:300px">{{ $egg->script_install }}</div>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="form-group col-sm-4">
                            <label class="control-label">{{ __('admin/eggs.scripts.copy_script_from') }}</label>
                            <select id="pCopyScriptFrom" name="copy_script_from">
                                <option value="">{{ __('strings.none') }}</option>
                                @foreach($copyFromOptions as $opt)
                                    <option value="{{ $opt->id }}" {{ $egg->copy_script_from !== $opt->id ?: 'selected' }}>{{ $opt->name }}</option>
                                @endforeach
                            </select>
                            <p class="text-muted small">{{ __('admin/eggs.scripts.copy_script_from_help') }}</p>
                        </div>
                        <div class="form-group col-sm-4">
                            <label class="control-label">{{ __('admin/eggs.scripts.script_container') }}</label>
                            <input type="text" name="script_container" class="form-control" value="{{ $egg->script_container }}" />
                            <p class="text-muted small">{{ __('admin/eggs.scripts.script_container_help') }}</p>
                        </div>
                        <div class="form-group col-sm-4">
                            <label class="control-label">{{ __('admin/eggs.scripts.script_entrypoint_command') }}</label>
                            <input type="text" name="script_entry" class="form-control" value="{{ $egg->script_entry }}" />
                            <p class="text-muted small">{{ __('admin/eggs.scripts.script_entrypoint_command_help') }}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-xs-12 text-muted">
                            {{ __('admin/eggs.scripts.rely_on_script') }}
                            @if(count($relyOnScript) > 0)
                                @foreach($relyOnScript as $rely)
                                    <a href="{{ route('admin.nests.egg.view', $rely->id) }}">
                                        <code>{{ $rely->name }}</code>@if(!$loop->last),&nbsp;@endif
                                    </a>
                                @endforeach
                            @else
                                <em>{{ __('admin/eggs.scripts.none') }}</em>
                            @endif
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <textarea name="script_install" class="hidden"></textarea>
                    <button type="submit" name="_method" value="PATCH" class="btn btn-primary btn-sm pull-right">{{ __('strings.save') }}</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/ace/ace.js') !!}
    {!! Theme::js('vendor/ace/ext-modelist.js') !!}
    <script>
    $(document).ready(function () {
        $('#pCopyScriptFrom').select2();

        const InstallEditor = ace.edit('editor_install');
        const Modelist = ace.require('ace/ext/modelist')

        InstallEditor.setTheme('ace/theme/chrome');
        InstallEditor.getSession().setMode('ace/mode/sh');
        InstallEditor.getSession().setUseWrapMode(true);
        InstallEditor.setShowPrintMargin(false);

        $('form').on('submit', function (e) {
            $('textarea[name="script_install"]').val(InstallEditor.getValue());
        });
    });
    </script>

@endsection
