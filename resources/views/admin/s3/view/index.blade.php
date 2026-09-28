@extends('layouts.admin')

@section('title')
    {{ __('admin/s3.view.index.title', ['name' => $s3->name]) }}
@endsection

@section('content-header')
    <h1>{{ $s3->name }}<small>{{ str_limit($s3->description ?? '', 60) }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.buckets') }}">{{ __('admin/s3.configurations') }}</a></li>
        <li class="active">{{ $s3->name }}</li>
    </ol>
@endsection

@section('content')
@include('admin.s3.partials.navigation')

<div class="row">
    <div class="col-sm-8">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/s3.view.index.information') }}</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <td>{{ __('strings.id') }}</td>
                        <td><code>{{ $s3->id }}</code></td>
                    </tr>
                    <tr>
                        <td>{{ __('strings.name') }}</td>
                        <td>{{ $s3->name }}</td>
                    </tr>
                    <tr>
                        <td>{{ __('admin/s3.view.index.description') }}</td>
                        <td>{!! $s3->description ?? '<span class="label label-default">' . __('strings.none') . '</span>' !!}</td>
                    </tr>
                    <tr>
                        <td>{{ __('admin/s3.view.index.bucket_name') }}</td>
                        <td><code>{{ $s3->bucket_name }}</code></td>
                    </tr>
                    <tr>
                        <td>{{ __('admin/s3.view.index.endpoint') }}</td>
                        <td>
                            @if($s3->endpoint)
                                <code>{{ $s3->endpoint }}</code>
                            @else
                                <span class="label label-default">{{ __('admin/s3.view.index.default_aws') }}</span>
                            @endif
                        </td>
                    </tr>
                    <tr><td>{{ __('admin/s3.view.index.region') }}</td><td><code>{{ $s3->region ?: 'us-east-1' }}</code></td></tr>
                    <tr>
                        <td>{{ __('admin/s3.view.index.path_style') }}</td>
                        <td>
                            @if($s3->use_path_style_endpoint)
                                <span class="label label-success">{{ __('admin/s3.view.index.enabled') }}</span>
                            @else
                                <span class="label label-default">{{ __('admin/s3.view.index.disabled') }}</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td>{{ __('strings.status') }}</td>
                        <td>
                            @if($s3->enabled)
                                <span class="label label-success">{{ __('admin/s3.view.index.enabled') }}</span>
                            @else
                                <span class="label label-danger">{{ __('admin/s3.view.index.disabled') }}</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td>{{ __('strings.created') }}</td>
                        <td>{{ $s3->created_at->diffForHumans() }}</td>
                    </tr>
                    <tr>
                        <td>{{ __('admin/s3.view.index.updated') }}</td>
                        <td>{{ $s3->updated_at->diffForHumans() }}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>

    <div class="col-sm-4">
        <div class="box box-primary">
            <div class="box-body">
                <div class="small-box bg-zinc">
                    <div class="inner">
                        <h3>{{ $s3->servers_count ?? $s3->servers->count() }}</h3>
                        <p>{{ __('admin/s3.view.index.attached_servers') }}</p>
                    </div>
                    <div class="icon"><i class="fa fa-server"></i></div>
                    <a href="{{ route('admin.buckets.view.servers', $s3->id) }}" class="small-box-footer">
                        {{ __('admin/s3.view.index.view_servers') }} <i class="fa fa-arrow-circle-right"></i>
                    </a>
                </div>

                <div class="small-box bg-zinc">
                    <div class="inner">
                        <h3>{{ humanizeSize($storageUsed) }}</h3>
                        <p>{{ __('admin/s3.view.index.estimated_storage') }}</p>
                    </div>
                    <div class="icon"><i class="fa fa-cloud"></i></div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
