@extends('layouts.admin')

@section('title')
    {{ __('admin/s3.view.servers.title', ['name' => $bucket->name]) }}
@endsection

@section('content-header')
    <h1>{{ $bucket->name }}<small>{{ __('admin/s3.view.servers.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.buckets') }}">{{ __('admin/s3.configurations') }}</a></li>
        <li><a href="{{ route('admin.buckets.view', $bucket->id) }}">{{ $bucket->name }}</a></li>
        <li class="active">{{ __('admin/s3.view.servers.breadcrumb') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.s3.partials.navigation')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/s3.view.servers.list') }}</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>{{ __('strings.id') }}</th>
                        <th>{{ __('admin/s3.view.servers.server_name') }}</th>
                        <th>{{ __('strings.owner') }}</th>
                        <th>{{ __('admin/s3.view.servers.service') }}</th>
                    </tr>
                    @foreach($servers as $server)
                        <tr>
                            <td><code>{{ $server->uuidShort }}</code></td>
                            <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                            <td><a href="{{ route('admin.users.view', $server->owner_id) }}">{{ $server->user->username ?? 'N/A' }}</a></td>
                            <td>{{ $server->nest->name ?? 'N/A' }} ({{ $server->egg->name ?? 'N/A' }})</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
