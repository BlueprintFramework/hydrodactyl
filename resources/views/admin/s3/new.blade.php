@extends('layouts.admin')

@section('title')
    {{ __('admin/s3.new.title') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/s3.new.create_bucket') }}<small>{{ __('admin/s3.new.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.buckets') }}">{{ __('admin/s3.new.buckets') }}</a></li>
        <li class="active">{{ __('admin/s3.new.create_bucket') }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.buckets') }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/s3.new.bucket_details') }}</h3>
                </div>

                <div class="box-body row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="name">{{ __('admin/s3.new.bucket_name') }}</label>
                            <input type="text" class="form-control" id="name" name="name" value="{{ old('name') }}" placeholder="{{ __('admin/s3.new.bucket_name') }}" required>
                            <p class="small text-muted no-margin">{{ __('admin/s3.new.bucket_name_help') }}</p>
                        </div>

                        <div class="form-group">
                            <label for="bucket_name">{{ __('admin/s3.new.s3_bucket_name') }}</label>
                            <input type="text" class="form-control" id="bucket_name" name="bucket_name" value="{{ old('bucket_name') }}" placeholder="my-bucket" required>
                            <p class="small text-muted no-margin">{{ __('admin/s3.new.s3_bucket_name_help') }}</p>
                        </div>

                        <div class="form-group">
                            <label for="endpoint">{{ __('admin/s3.new.endpoint') }}</label>
                            <input type="text" class="form-control" id="endpoint" name="endpoint" value="{{ old('endpoint') }}" placeholder="https://s3.amazonaws.com">
                            <p class="small text-muted no-margin">{{ __('admin/s3.new.endpoint_help') }}</p>
                        </div>
                        <div class="form-group">
                            <label for="region">{{ __('admin/s3.new.region') }}</label>
                            <input type="text" class="form-control" id="region" name="region" value="{{ old('region', 'us-east-1') }}" placeholder="us-east-1">
                            <p class="small text-muted no-margin">{!! __('admin/s3.new.region_help') !!}</p>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="description">{{ __('admin/s3.new.description') }}</label>
                            <textarea id="description" name="description" rows="3" class="form-control">{{ old('description') }}</textarea>
                            <p class="text-muted small">{{ __('admin/s3.new.description_help') }}</p>
                        </div>

                        <div class="form-group">
                            <label for="access_key">{{ __('admin/s3.new.access_key') }}</label>
                            <input type="text" class="form-control" id="access_key" name="access_key" value="{{ old('access_key') }}" placeholder="{{ __('admin/s3.new.access_key') }}" required>
                            <p class="small text-muted no-margin">{{ __('admin/s3.new.access_key_help') }}</p>
                        </div>

                        <div class="form-group">
                            <label for="secret_key">{{ __('admin/s3.new.secret_key') }}</label>
                            <input type="password" class="form-control" id="secret_key" name="secret_key" value="{{ old('secret_key') }}" placeholder="{{ __('admin/s3.new.secret_key') }}" required>
                            <p class="small text-muted no-margin">{{ __('admin/s3.new.secret_key_help') }}</p>
                        </div>
                    </div>
                </div>

                <div class="box-body">
                    <div class="form-group">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input type="hidden" name="use_path_style_endpoint" value="0" />
                            <input id="use_path_style_endpoint" name="use_path_style_endpoint" type="checkbox" value="1" {{ old('use_path_style_endpoint') ? 'checked' : '' }} />
                            <label for="use_path_style_endpoint" class="strong">{{ __('admin/s3.new.path_style_label') }}</label>
                        </div>
                        <p class="small text-muted no-margin">{{ __('admin/s3.new.path_style_help') }}</p>
                    </div>

                    <div class="form-group">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input type="hidden" name="enabled" value="0" />
                            <input id="enabled" name="enabled" type="checkbox" value="1" {{ old('enabled', true) ? 'checked' : '' }} />
                            <label for="enabled" class="strong">{{ __('admin/s3.new.enabled') }}</label>
                        </div>
                        <p class="small text-muted no-margin">{{ __('admin/s3.new.enabled_help') }}</p>
                    </div>
                </div>

                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="button" id="test-connection" class="btn btn-sm btn-info">
                        <i class="fa fa-refresh fa-spin" style="display: none;"></i> {{ __('admin/s3.new.test_connection') }}
                    </button>
                    <input type="submit" class="btn btn-success pull-right" value="{{ __('admin/s3.new.create_bucket') }}" />
                </div>
            </div>
        </div>
    </div>
</form>
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
            access_key: $('#access_key').val(),
            secret_key: $('#secret_key').val(),
            endpoint: $('#endpoint').val(),
            region: $('#region').val(),
            bucket_name: $('#bucket_name').val(),
            use_path_style_endpoint: $('#use_path_style_endpoint').is(':checked') ? '1' : '0',
        })
        .done(function (response) {
            swal({ type: 'success', title: @js(__('admin/s3.new.success')), text: response.message });
        })
        .fail(function (xhr) {
            const response = xhr.responseJSON || {};
            const message = response.message || xhr.responseText || (@js(__('admin/s3.new.request_failed_prefix')) + xhr.status + @js(__('admin/s3.new.request_failed_suffix')));
            swal({ type: 'error', title: @js(__('admin/s3.new.connection_failed')), text: message });
        })
        .always(function () {
            $button.prop('disabled', false);
            $spinner.hide();
        });
    });
    </script>
@endsection
