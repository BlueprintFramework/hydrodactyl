@extends('layouts.admin')

@section('title')
    {{ __('admin/s3.view.delete.title', ['name' => $s3->name]) }}
@endsection

@section('content-header')
    <h1>{{ $s3->name }}<small>{{ __('admin/s3.view.delete.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.buckets') }}">{{ __('admin/s3.configurations') }}</a></li>
        <li><a href="{{ route('admin.buckets.view', $s3->id) }}">{{ $s3->name }}</a></li>
        <li class="active">{{ __('admin/s3.view.nav.delete') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.s3.partials.navigation')
<div class="row">
    <div class="col-md-6">
        <div class="box box-danger">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/s3.view.delete.box_title') }}</h3>
            </div>
            <div class="box-body">
                <p>{{ __('admin/s3.view.delete.warning') }}</p>
                @if($s3->servers_count > 0)
                    <div class="callout callout-danger">
                        <p>{!! __('admin/s3.view.delete.in_use', ['count' => $s3->servers_count]) !!}</p>
                    </div>
                @else
                    <p class="text-danger small">{{ __('admin/s3.view.delete.irreversible_help') }}</p>
                @endif
            </div>
            <div class="box-footer">
                <form id="deleteform" action="{{ route('admin.buckets.view.delete', $s3->id) }}" method="POST">
                    @csrf
                    @method('DELETE')
                    <button id="deletebtn" class="btn btn-danger" {{ $s3->servers_count > 0 ? 'disabled' : '' }}>
                        {{ __('admin/s3.view.delete.button') }}
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    @if($s3->servers_count === 0)
    <script>
    $('#deletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: @js(__('admin/s3.view.delete.confirm')),
            showCancelButton: true,
            confirmButtonText: @js(__('strings.delete')),
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#deleteform').submit()
        });
    });
    </script>
    @endif
@endsection
