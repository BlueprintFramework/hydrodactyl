@extends('layouts.admin')

@section('title')
    {{ __('admin/node.view.configuration.title', ['name' => $node->name]) }}
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>{{ __('admin/node.view.configuration.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nodes') }}">{{ __('admin/navigation.sidebar.nodes') }}</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">{{ __('strings.configuration') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
       <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ __('admin/node.view.tabs.about') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ __('strings.settings') }}</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ __('strings.configuration') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ __('admin/node.view.tabs.allocation') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ __('strings.servers') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-8">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/node.view.configuration.file') }}</h3>
            </div>
            <div class="box-body">
                <pre class="no-margin">{{ $node->getYamlConfiguration() }}</pre>
            </div>
            <div class="box-footer">
                <p class="no-margin">{!! __('admin/node.view.configuration.file_help') !!}</p>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/node.view.configuration.auto_deploy') }}</h3>
            </div>
            <div class="box-body">
                <p class="text-muted small">
                    {{ __('admin/node.view.configuration.auto_deploy_help') }}
                </p>
            </div>
            <div class="box-footer">
                <button type="button" id="configTokenBtn" class="btn btn-sm btn-default" style="width:100%;">{{ __('admin/node.view.configuration.generate_token') }}</button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#configTokenBtn').on('click', function (event) {
        $.ajax({
            method: 'POST',
            url: '{{ route('admin.nodes.view.configuration.token', $node->id) }}',
            headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
        }).done(function (data) {

            var commandTemplate = "{!! addslashes($node->getAutoDeploy("PLACEHOLDER_TOKEN")) !!}";
            var command = commandTemplate.replace('PLACEHOLDER_TOKEN', data.token);
            swal({
                type: 'success',
                title: @js(__('admin/node.view.configuration.token_created')),
                text: @js(__('admin/node.view.configuration.token_help')).replace(':command', command),
                html: true,
            })
        }).fail(function () {
            swal({
                title: @js(__('admin/node.view.configuration.error')),
                text: @js(__('admin/node.view.configuration.token_error')),
                type: 'error'
            });
        });
    });
    </script>
@endsection
