@extends('layouts.admin')

@section('title')
    {{ __('admin/s3.index.title') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/s3.configurations') }}<small>{{ __('admin/s3.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/s3.breadcrumb') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/s3.index.bucket_list') }}</h3>
                <div class="box-tools search01">
                    <form action="{{ route('admin.buckets') }}" method="GET">
                        <div class="input-group input-group-sm">
                            <input type="text" name="filter[name]" class="form-control pull-right" value="{{ request()->input()['filter']['name'] ?? '' }}" placeholder="{{ __('admin/s3.index.search_placeholder') }}">
                            <div class="input-group-btn">
                                <button type="submit" class="btn btn-default"><i class="fa fa-search"></i></button>
                                <a href="{{ route('admin.buckets.new') }}"><button type="button" class="btn btn-sm btn-primary" style="border-radius: 0 3px 3px 0;margin-left:-1px;">{{ __('admin/s3.index.create_new') }}</button></a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th>{{ __('strings.id') }}</th>
                            <th>{{ __('strings.name') }}</th>
                            <th>{{ __('admin/s3.index.bucket_name') }}</th>
                            <th>{{ __('admin/s3.index.enabled') }}</th>
                            <th>{{ __('admin/s3.index.connected_servers') }}</th>
                        </tr>
                        @foreach ($buckets as $bucket)
                            <tr data-server="{{ $bucket->id }}">
                                <td><code>{{ $bucket->id }}</code></td>
                                <td><a href="{{ route('admin.buckets.view', $bucket->id) }}">{{ $bucket->name }}</a></td>
                                <td><code>{{ $bucket->bucket_name }}</code></td>
                                <td>
                                    @if($bucket->enabled)
                                        <span class="label label-success">{{ __('admin/s3.index.enabled') }}</span>
                                    @else
                                        <span class="label label-danger">{{ __('admin/s3.index.disabled') }}</span>
                                    @endif
                                </td>
                                <td>{{ $bucket->server_count }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
@endsection
