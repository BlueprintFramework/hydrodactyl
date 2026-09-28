@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'basic'])

@section('title')
  {{ __('admin/settings.index.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/settings.index.header') }}<small>{{ __('admin/settings.index.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li class="active">{{ __('admin/navigation.breadcrumb.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <div class="box box-primary">
        <div class="box-header with-border">
          <i class="fa fa-cog"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.index.general_settings') }}</h3>
        </div>
        <form action="{{ route('admin.settings') }}" method="POST">
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.index.company_name') }}</label>
                <input type="text" class="form-control" name="app:name"
                  value="{{ old('app:name', config('app.name')) }}" />
                <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.index.company_name_help') }}</p>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.index.default_language') }}</label>
                <select name="app:locale" class="form-control">
                  @foreach($languages as $key => $value)
                    <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                  @endforeach
                </select>
                <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.index.default_language_help') }}</p>
              </div>
            </div>
            <div class="row" style="margin-top:8px;">
              <div class="form-group col-md-12">
                <label class="control-label">{{ __('admin/settings.index.require_2fa') }}</label>
                <div style="display:flex;gap:4px;margin-top:4px;">
                  @php
                    $level = old('pterodactyl:auth:2fa_required', config('pterodactyl.auth.2fa_required'));
                  @endphp
                  <label class="btn btn-outline-primary @if ($level == 0) active @endif" style="flex:1;border-radius:4px;">
                    <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="0" @if ($level == 0) checked @endif> {{ __('admin/settings.index.2fa_not_required') }}
                  </label>
                  <label class="btn btn-outline-primary @if ($level == 1) active @endif" style="flex:1;border-radius:4px;">
                    <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="1" @if ($level == 1) checked @endif> {{ __('admin/settings.index.2fa_admin_only') }}
                  </label>
                  <label class="btn btn-outline-primary @if ($level == 2) active @endif" style="flex:1;border-radius:4px;">
                    <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="2" @if ($level == 2) checked @endif> {{ __('admin/settings.index.2fa_all_users') }}
                  </label>
                </div>
                <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.index.require_2fa_help') }}</p>
              </div>
            </div>

          </div>
          <div class="box-footer">
            {!! csrf_field() !!}
            <input type="hidden" name="_method" value="PATCH">
            <button type="submit" class="btn btn-primary pull-right"><i class="fa fa-save"></i> {{ __('strings.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
