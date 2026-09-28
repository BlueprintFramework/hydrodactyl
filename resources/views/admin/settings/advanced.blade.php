@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
  {{ __('admin/settings.advanced.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/settings.advanced.title') }}<small>{{ __('admin/settings.advanced.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li class="active">{{ __('admin/navigation.breadcrumb.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
    <form action="" method="POST">
      <div class="box box-primary">
      <div class="box-header with-border">
        <i class="fa fa-plug"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.advanced.http_connections') }}</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">{{ __('admin/settings.advanced.connection_timeout') }}</label>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout"
            value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
          <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.advanced.connection_timeout_help') }}</p>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">{{ __('admin/settings.advanced.request_timeout') }}</label>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout"
            value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
          <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.advanced.request_timeout_help') }}</p>
        </div>
        </div>
      </div>
      </div>
      <div class="box box-primary">
      <div class="box-header with-border">
        <i class="fa fa-sitemap"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.advanced.automatic_allocation_creation') }}</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-4">
          <label class="control-label">{{ __('strings.status') }}</label>
          <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
            <option value="false">{{ __('admin/settings.advanced.disabled') }}</option>
            <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>{{ __('admin/settings.advanced.enabled') }}</option>
          </select>
          <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.advanced.automatic_allocation_creation_help') }}</p>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">{{ __('admin/settings.advanced.starting_port') }}</label>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start"
            value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
          <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.advanced.starting_port_help') }}</p>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">{{ __('admin/settings.advanced.ending_port') }}</label>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end"
            value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
          <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.advanced.ending_port_help') }}</p>
        </div>
        </div>
      </div>
      </div>
      <div class="box box-primary">
      <div class="box-header with-border">
        <i class="fa fa-folder"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.advanced.server_groups') }}</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">{{ __('strings.status') }}</label>
          <select class="form-control" name="pterodactyl:client_features:groups:enabled">
            <option value="false">{{ __('admin/settings.advanced.disabled') }}</option>
            <option value="true" @if(old('pterodactyl:client_features:groups:enabled', config('pterodactyl.client_features.groups.enabled'))) selected @endif>{{ __('admin/settings.advanced.enabled') }}</option>
          </select>
          <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.advanced.server_groups_help') }}</p>
        </div>
        </div>
      </div>
      <div class="box-footer">
        {{ csrf_field() }}
        <input type="hidden" name="_method" value="PATCH">
        <button type="submit" class="btn btn-primary pull-right"><i class="fa fa-save"></i> {{ __('strings.save') }}</button>
      </div>
      </div>
    </form>
    </div>
  </div>
@endsection
