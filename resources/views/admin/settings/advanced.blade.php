@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
  Advanced Settings
@endsection

@section('content-header')
  <h1>Advanced Settings<small>Configure advanced settings for Pterodactyl.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Settings</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
    <form action="" method="POST">
      <div class="box box-primary">
      <div class="box-header with-border">
        <i class="fa fa-plug"></i> <h3 class="box-title" style="display:inline;">HTTP Connections</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Connection Timeout</label>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout"
            value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
          <p class="text-muted small" style="margin-top:4px;">Seconds to wait before timing out a connection attempt.</p>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Request Timeout</label>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout"
            value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
          <p class="text-muted small" style="margin-top:4px;">Seconds to wait before timing out an active request.</p>
        </div>
        </div>
      </div>
      </div>
      <div class="box box-primary">
      <div class="box-header with-border">
        <i class="fa fa-sitemap"></i> <h3 class="box-title" style="display:inline;">Automatic Allocation Creation</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-4">
          <label class="control-label">Status</label>
          <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
            <option value="false">Disabled</option>
            <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>Enabled</option>
          </select>
          <p class="text-muted small" style="margin-top:4px;">Let users automatically create allocations from the frontend.</p>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">Starting Port</label>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start"
            value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
          <p class="text-muted small" style="margin-top:4px;">First port in the allocatable range.</p>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">Ending Port</label>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end"
            value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
          <p class="text-muted small" style="margin-top:4px;">Last port in the allocatable range.</p>
        </div>
        </div>
      </div>
      </div>
      <div class="box box-primary">
      <div class="box-header with-border">
        <i class="fa fa-folder"></i> <h3 class="box-title" style="display:inline;">Server Groups</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Status</label>
          <select class="form-control" name="pterodactyl:client_features:groups:enabled">
            <option value="false">Disabled</option>
            <option value="true" @if(old('pterodactyl:client_features:groups:enabled', config('pterodactyl.client_features.groups.enabled'))) selected @endif>Enabled</option>
          </select>
          <p class="text-muted small" style="margin-top:4px;">Allow users to create server groups and organize their servers on the dashboard.</p>
        </div>
        </div>
      </div>
      <div class="box-footer">
        {{ csrf_field() }}
        <input type="hidden" name="_method" value="PATCH">
        <button type="submit" class="btn btn-primary pull-right"><i class="fa fa-save"></i> Save</button>
      </div>
      </div>
    </form>
    </div>
  </div>
@endsection