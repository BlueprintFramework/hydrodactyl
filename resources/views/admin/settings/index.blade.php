@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'basic'])

@section('title')
  Settings
@endsection

@section('content-header')
  <h1>Panel Settings<small>Configure Pterodactyl to your liking.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Settings</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <div class="box box-primary">
        <div class="box-header with-border">
          <i class="fa fa-cog"></i> <h3 class="box-title" style="display:inline;">General Settings</h3>
        </div>
        <form action="{{ route('admin.settings') }}" method="POST">
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">Company Name</label>
                <input type="text" class="form-control" name="app:name"
                  value="{{ old('app:name', config('app.name')) }}" />
                <p class="text-muted small" style="margin-top:4px;">Displayed throughout the panel and in outgoing emails.</p>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">Default Language</label>
                <select name="app:locale" class="form-control">
                  @foreach($languages as $key => $value)
                    <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                  @endforeach
                </select>
                <p class="text-muted small" style="margin-top:4px;">Default language for UI components.</p>
              </div>
            </div>
            <div class="row" style="margin-top:8px;">
              <div class="form-group col-md-12">
                <label class="control-label">Require 2-Factor Authentication</label>
                <div style="display:flex;gap:4px;margin-top:4px;">
                  @php
                    $level = old('pterodactyl:auth:2fa_required', config('pterodactyl.auth.2fa_required'));
                  @endphp
                  <label class="btn btn-outline-primary @if ($level == 0) active @endif" style="flex:1;border-radius:4px;">
                    <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="0" @if ($level == 0) checked @endif> Not Required
                  </label>
                  <label class="btn btn-outline-primary @if ($level == 1) active @endif" style="flex:1;border-radius:4px;">
                    <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="1" @if ($level == 1) checked @endif> Admin Only
                  </label>
                  <label class="btn btn-outline-primary @if ($level == 2) active @endif" style="flex:1;border-radius:4px;">
                    <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="2" @if ($level == 2) checked @endif> All Users
                  </label>
                </div>
                <p class="text-muted small" style="margin-top:4px;">Accounts in the selected group must have 2FA enabled to use the panel.</p>
              </div>
            </div>

          </div>
          <div class="box-footer">
            {!! csrf_field() !!}
            <input type="hidden" name="_method" value="PATCH">
            <button type="submit" class="btn btn-primary pull-right"><i class="fa fa-save"></i> Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
