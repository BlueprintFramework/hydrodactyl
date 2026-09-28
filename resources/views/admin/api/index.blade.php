@extends('layouts.admin')

@section('title')
    {{ __('admin/navigation.sidebar.application_api') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/navigation.sidebar.application_api') }}<small>{{ __('admin/api.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/navigation.sidebar.application_api') }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/api.index.credentials_list') }}</h3>
                    <div class="box-tools">
                        <a href="{{ route('admin.api.new') }}" class="btn btn-sm btn-primary">{{ __('admin/api.index.create_new') }}</a>
                    </div>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tr>
                            <th>{{ __('admin/api.index.key') }}</th>
                            <th>{{ __('strings.memo') }}</th>
                            <th>{{ __('strings.last_used') }}</th>
                            <th>{{ __('strings.created') }}</th>
                            <th></th>
                        </tr>
                        @foreach($keys as $key)
                            <tr>
                                <td><code>{{ $key->identifier }}{{ decrypt($key->token) }}</code></td>
                                <td>{{ $key->memo }}</td>
                                <td>
                                    @if(!is_null($key->last_used_at))
                                        {{ $key->last_used_at->format('M j, Y g:i A') }}
                                    @else
                                        &mdash;
                                    @endif
                                </td>
                                    <td>{{ $key->created_at->format('M j, Y g:i A') }}</td>
                                <td>
                                    <a href="#" data-action="revoke-key" data-attr="{{ $key->identifier }}">
                                        <i class="fa fa-trash-o text-danger"></i>
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            $('[data-action="revoke-key"]').click(function (event) {
                var self = $(this);
                event.preventDefault();
                swal({
                    type: 'error',
                    title: @js(__('admin/api.index.revoke_title')),
                    text: @js(__('admin/api.index.revoke_text')),
                    showCancelButton: true,
                    allowOutsideClick: true,
                    closeOnConfirm: false,
                    confirmButtonText: @js(__('strings.revoke')),
                    confirmButtonColor: '#d9534f',
                    showLoaderOnConfirm: true
                }, function () {
                    $.ajax({
                        method: 'DELETE',
                        url: '/admin/api/revoke/' + self.data('attr'),
                        headers: {
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        }
                    }).done(function () {
                        swal({
                            type: 'success',
                            title: '',
                            text: @js(__('admin/api.index.revoked'))
                        });
                        self.parent().parent().slideUp();
                    }).fail(function (jqXHR) {
                        console.error(jqXHR);
                        swal({
                            type: 'error',
                            title: @js(__('admin/api.index.whoops')),
                            text: @js(__('admin/api.index.revoke_error'))
                        });
                    });
                });
            });
        });
    </script>
@endsection
