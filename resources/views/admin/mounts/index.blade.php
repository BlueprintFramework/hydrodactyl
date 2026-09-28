
@extends('layouts.admin')

@section('title')
    {{ __('admin/navigation.sidebar.mounts') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/navigation.sidebar.mounts') }}<small>{{ __('admin/mounts.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/navigation.sidebar.mounts') }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="callout callout-info">
                <i class="fa fa-info-circle"></i> {!! __('admin/mounts.index.what_are_mounts') !!}
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/mounts.index.list') }}</h3>

                    <div class="box-tools">
                        <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newMountModal">{{ __('admin/mounts.index.create_new') }}</button>
                    </div>
                </div>

                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>{{ __('strings.id') }}</th>
                                <th>{{ __('strings.name') }}</th>
                                <th>{{ __('admin/mounts.index.source') }}</th>
                                <th>{{ __('admin/mounts.index.target') }}</th>
                                <th class="text-center">{{ __('admin/mounts.index.eggs') }}</th>
                                <th class="text-center">{{ __('admin/mounts.index.nodes') }}</th>
                                <th class="text-center">{{ __('strings.servers') }}</th>
                            </tr>

                            @foreach ($mounts as $mount)
                                <tr>
                                    <td><code>{{ $mount->id }}</code></td>
                                    <td><a href="{{ route('admin.mounts.view', $mount->id) }}">{{ $mount->name }}</a></td>
                                    <td><code>{{ $mount->source }}</code></td>
                                    <td><code>{{ $mount->target }}</code></td>
                                    <td class="text-center">{{ $mount->eggs_count }}</td>
                                    <td class="text-center">{{ $mount->nodes_count }}</td>
                                    <td class="text-center">{{ $mount->servers_count }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="newMountModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.mounts') }}" method="POST">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}">
                            <span aria-hidden="true" style="color: #FFFFFF">&times;</span>
                        </button>

                        <h4 class="modal-title">{{ __('admin/mounts.index.create_title') }}</h4>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="pName" class="form-label">{{ __('strings.name') }}</label>
                                <input type="text" id="pName" name="name" class="form-control" />
                                <p class="text-muted small">{{ __('admin/mounts.index.name_help') }}</p>
                            </div>

                            <div class="col-md-12">
                                <label for="pDescription" class="form-label">{{ __('admin/mounts.index.description') }}</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="4"></textarea>
                                <p class="text-muted small">{{ __('admin/mounts.index.description_help') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label for="pSource" class="form-label">{{ __('admin/mounts.index.source') }}</label>
                                <input type="text" id="pSource" name="source" class="form-control" />
                                <p class="text-muted small">{{ __('admin/mounts.index.source_help') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label for="pTarget" class="form-label">{{ __('admin/mounts.index.target') }}</label>
                                <input type="text" id="pTarget" name="target" class="form-control" />
                                <p class="text-muted small">{{ __('admin/mounts.index.target_help') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ __('strings.read_only') }}</label>

                                <div>
                                    <div class="radio radio-success radio-inline">
                                        <input type="radio" id="pReadOnlyFalse" name="read_only" value="0" checked>
                                        <label for="pReadOnlyFalse">{{ __('admin/mounts.index.false') }}</label>
                                    </div>

                                    <div class="radio radio-warning radio-inline">
                                        <input type="radio" id="pReadOnly" name="read_only" value="1">
                                        <label for="pReadOnly">{{ __('admin/mounts.index.true') }}</label>
                                    </div>
                                </div>

                                <p class="text-muted small">{{ __('admin/mounts.index.read_only_help') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ __('admin/mounts.index.user_mountable') }}</label>

                                <div>
                                    <div class="radio radio-success radio-inline">
                                        <input type="radio" id="pUserMountableFalse" name="user_mountable" value="0" checked>
                                        <label for="pUserMountableFalse">{{ __('admin/mounts.index.false') }}</label>
                                    </div>

                                    <div class="radio radio-warning radio-inline">
                                        <input type="radio" id="pUserMountable" name="user_mountable" value="1">
                                        <label for="pUserMountable">{{ __('admin/mounts.index.true') }}</label>
                                    </div>
                                </div>

                                <p class="text-muted small">{{ __('admin/mounts.index.user_mountable_help') }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        {!! csrf_field() !!}
                        <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">{{ __('strings.cancel') }}</button>
                        <button type="submit" class="btn btn-success btn-sm">{{ __('strings.create') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
