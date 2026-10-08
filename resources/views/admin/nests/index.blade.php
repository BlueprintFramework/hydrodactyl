@extends('layouts.admin')

@section('title')
    {{ __('admin/nests.index.title') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/nests.index.title') }}<small>{{ __('admin/nests.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/nests.index.title') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="callout callout-warning">
            <i class="fa fa-warning"></i> {!! __('admin/nests.index.warning') !!}
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/nests.index.configured_nests') }}</h3>
                <div class="box-tools">
                    <a href="#" class="btn btn-sm btn-success" data-toggle="modal" data-target="#importServiceOptionModal" role="button"><i class="fa fa-upload"></i> {{ __('admin/nests.index.import_egg') }}</a>
                    <a href="#" class="btn btn-sm btn-success" data-toggle="modal" data-target="#importServiceOptionFromUrlModal" role="button"><i class="fa fa-upload"></i> {{ __('admin/nests.index.import_egg_from_url') }}</a>
                    <a href="{{ route('admin.nests.new') }}" class="btn btn-primary btn-sm">{{ __('admin/nests.index.create_new') }}</a>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>{{ __('strings.id') }}</th>
                        <th>{{ __('strings.name') }}</th>
                        <th>{{ __('admin/nests.index.table_description') }}</th>
                        <th class="text-center">{{ __('admin/nests.index.table_eggs') }}</th>
                        <th class="text-center">{{ __('strings.servers') }}</th>
                    </tr>
                    @foreach($nests as $nest)
                        <tr>
                            <td class="middle"><code>{{ $nest->id }}</code></td>
                            <td class="middle"><a href="{{ route('admin.nests.view', $nest->id) }}" data-toggle="tooltip" data-placement="right" title="{{ $nest->author }}">{{ $nest->name }}</a></td>
                            <td class="col-xs-6 middle">{{ $nest->description }}</td>
                            <td class="text-center middle">{{ $nest->eggs_count }}</td>
                            <td class="text-center middle">{{ $nest->servers_count }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ __('admin/nests.index.import_modal_title') }}</h4>
            </div>
            <form action="{{ route('admin.nests.egg.import') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="control-label" for="pImportFile">{{ __('admin/nests.index.egg_file') }} <span class="field-required">{{ __('strings.required') }}</span></label>
                        <div>
                            <input id="pImportFile" type="file" name="import_file" class="form-control" accept="application/json" />
                            <p class="small text-muted">{!! __('admin/nests.index.egg_file_help') !!}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="pImportToNest">{{ __('admin/nests.index.associated_nest') }} <span class="field-required">{{ __('strings.required') }}</span></label>
                        <div>
                            <select id="pImportToNest" name="import_to_nest">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <p class="small text-muted">{{ __('admin/nests.index.associated_nest_help') }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {{ csrf_field() }}
                    <button type="button" class="btn btn-default" data-dismiss="modal">{{ __('strings.cancel') }}</button>
                    <button type="submit" class="btn btn-primary">{{ __('admin/nests.index.import_button') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionFromUrlModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ __('admin/nests.index.import_modal_title') }}</h4>
            </div>
            <form action="{{ route('admin.nests.egg.import_url') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="control-label" for="pImportFile">{{ __('admin/nests.index.egg_url') }} <span class="field-required">{{ __('strings.required') }}</span></label>
                        <div>
                            <input id="pImportFile" type="url" name="import_file_url" class="form-control" accept="application/json" />
                            <p class="small text-muted">{{ __('admin/nests.index.egg_url_help') }}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="pImportToNest">{{ __('admin/nests.index.associated_nest') }} <span class="field-required">{{ __('strings.required') }}</span></label>
                        <div>
                            <select id="pImportToNest" name="import_to_nest">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <p class="small text-muted">{{ __('admin/nests.index.associated_nest_help') }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {{ csrf_field() }}
                    <button type="button" class="btn btn-default" data-dismiss="modal">{{ __('strings.cancel') }}</button>
                    <button type="submit" class="btn btn-primary">{{ __('admin/nests.index.import_button') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            $('#pImportToNest').select2();
        });
    </script>
@endsection
