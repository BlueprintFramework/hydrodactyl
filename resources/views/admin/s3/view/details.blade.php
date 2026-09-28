@extends('layouts.admin')

@section('title')
    {{ __('admin/s3.view.details.title', ['name' => $s3->name]) }}
@endsection

@section('content-header')
    <h1>{{ $s3->name }}<small>{{ __('admin/s3.view.details.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.buckets') }}">{{ __('admin/s3.configurations') }}</a></li>
        <li><a href="{{ route('admin.buckets.view', $s3->id) }}">{{ $s3->name }}</a></li>
        <li class="active">{{ __('admin/s3.view.nav.details') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.s3.partials.navigation')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/s3.view.details.configuration') }}</h3>
            </div>
            <form action="{{ route('admin.buckets.view.details', $s3->id) }}" method="POST">
                <div class="box-body">
                    <div class="form-group">
                        <label for="name" class="control-label">{{ __('strings.name') }} <span class="field-required"></span></label>
                        <input type="text" name="name" value="{{ old('name', $s3->name) }}" class="form-control" required />
                        <p class="text-muted small">{{ __('admin/s3.view.details.name_help') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="description" class="control-label">{{ __('admin/s3.view.details.description') }}</label>
                        <textarea name="description" rows="3" class="form-control">{{ old('description', $s3->description) }}</textarea>
                        <p class="text-muted small">{{ __('admin/s3.view.details.description_help') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="access_key" class="control-label">{{ __('admin/s3.view.details.access_key') }} <span class="field-required"></span></label>
                        <input type="text" name="access_key" value="{{ old('access_key', $s3->access_key) }}" class="form-control" required />
                        <p class="text-muted small">{{ __('admin/s3.view.details.access_key_help') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="secret_key" class="control-label">{{ __('admin/s3.view.details.secret_key') }} <span class="field-required"></span></label>
                        <input type="password" name="secret_key" value="{{ old('secret_key', $s3->secret_key) }}" class="form-control" required />
                        <p class="text-muted small">{{ __('admin/s3.view.details.secret_key_help') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="endpoint" class="control-label">{{ __('admin/s3.view.details.endpoint') }}</label>
                        <input type="url" name="endpoint" value="{{ old('endpoint', $s3->endpoint) }}" class="form-control" />
                        <p class="text-muted small">{!! __('admin/s3.view.details.endpoint_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="region" class="control-label">{{ __('admin/s3.view.details.region') }}</label>
                        <input type="text" name="region" value="{{ old('region', $s3->region ?: 'us-east-1') }}" class="form-control" />
                        <p class="text-muted small">{!! __('admin/s3.view.details.region_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="bucket_name" class="control-label">{{ __('admin/s3.view.details.bucket_name') }} <span class="field-required"></span></label>
                        <input type="text" name="bucket_name" value="{{ old('bucket_name', $s3->bucket_name) }}" class="form-control" required />
                        <p class="text-muted small">{{ __('admin/s3.view.details.bucket_name_help') }}</p>
                    </div>
                    <div class="form-group">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input type="hidden" name="use_path_style_endpoint" value="0" />
                            <input id="use_path_style_endpoint" name="use_path_style_endpoint" type="checkbox" value="1" {{ ((int) old('use_path_style_endpoint', $s3->use_path_style_endpoint ? 1 : 0)) ? 'checked' : '' }} />
                            <label for="use_path_style_endpoint" class="strong">{{ __('admin/s3.view.details.path_style_label') }}</label>
                        </div>
                        <p class="text-muted small">{{ __('admin/s3.view.details.path_style_help') }}</p>
                    </div>
                    <div class="form-group">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input type="hidden" name="enabled" value="0" />
                            <input id="enabled" name="enabled" type="checkbox" value="1" {{ ((int) old('enabled', $s3->enabled ? 1 : 0)) ? 'checked' : '' }} />
                            <label for="enabled" class="strong">{{ __('admin/s3.view.details.enabled') }}</label>
                        </div>
                        <p class="text-muted small">{{ __('admin/s3.view.details.enabled_help') }}</p>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="button" id="test-connection" class="btn btn-sm btn-info">
                        <i class="fa fa-refresh fa-spin" style="display: none;"></i> {{ __('admin/s3.view.details.test_connection') }}
                    </button>
                    <button type="submit" class="btn btn-primary pull-right">{{ __('admin/s3.view.details.update') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#test-connection').click(function () {
        const $button = $(this);
        const $spinner = $button.find('.fa-spin');

        $button.prop('disabled', true);
        $spinner.show();

        $.post('{{ route('admin.buckets.test-connection') }}', {
            _token: '{{ csrf_token() }}',
            access_key: $('input[name="access_key"]').val(),
            secret_key: $('input[name="secret_key"]').val(),
            endpoint: $('input[name="endpoint"]').val(),
            region: $('input[name="region"]').val(),
            bucket_name: $('input[name="bucket_name"]').val(),
            use_path_style_endpoint: $('#use_path_style_endpoint').is(':checked') ? '1' : '0',
        })
        .done(function (response) {
            swal({ type: 'success', title: @js(__('admin/s3.view.details.success')), text: response.message });
        })
        .fail(function (xhr) {
            const response = xhr.responseJSON || {};
            const message = response.message || xhr.responseText || (@js(__('admin/s3.view.details.request_failed_prefix')) + xhr.status + @js(__('admin/s3.view.details.request_failed_suffix')));
            swal({ type: 'error', title: @js(__('admin/s3.view.details.connection_failed')), text: message });
        })
        .always(function () {
            $button.prop('disabled', false);
            $spinner.hide();
        });
    });
    </script>
@endsection
