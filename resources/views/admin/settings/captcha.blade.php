@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'captcha'])

@section('title')
  {{ __('admin/settings.captcha.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/settings.captcha.title') }}<small>{{ __('admin/settings.captcha.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li class="active">{{ __('admin/navigation.breadcrumb.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <form action="{{ route('admin.settings.captcha') }}" method="POST">
        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/settings.captcha.provider_box') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-4">
                <label class="control-label">{{ __('admin/settings.captcha.provider') }}</label>
                <div>
                  <select name="pterodactyl:captcha:provider" class="form-control" id="captcha-provider">
                    @foreach($providers as $key => $name)
                      <option value="{{ $key }}" @if(old('pterodactyl:captcha:provider', config('pterodactyl.captcha.provider', 'none')) === $key) selected @endif>{{ $name }}</option>
                    @endforeach
                  </select>
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.provider_help') }}</small></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="turnstile-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/settings.captcha.turnstile.title') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.captcha.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:turnstile:site_key"
                    value="{{ old('pterodactyl:captcha:turnstile:site_key', config('pterodactyl.captcha.turnstile.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.turnstile.site_key_help') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.captcha.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:turnstile:secret_key"
                    value="{{ old('pterodactyl:captcha:turnstile:secret_key', config('pterodactyl.captcha.turnstile.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.turnstile.secret_key_help') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ __('admin/settings.captcha.setup_instructions') }}</strong>
                  <ol>
                    <li>{!! __('admin/settings.captcha.turnstile.step_1') !!}</li>
                    <li>{{ __('admin/settings.captcha.turnstile.step_2') }}</li>
                    <li>{{ __('admin/settings.captcha.turnstile.step_3') }}</li>
                    <li>{{ __('admin/settings.captcha.turnstile.step_4') }}</li>
                    <li>{{ __('admin/settings.captcha.turnstile.step_5') }}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="hcaptcha-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/settings.captcha.hcaptcha.title') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.captcha.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:hcaptcha:site_key"
                    value="{{ old('pterodactyl:captcha:hcaptcha:site_key', config('pterodactyl.captcha.hcaptcha.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.hcaptcha.site_key_help') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.captcha.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:hcaptcha:secret_key"
                    value="{{ old('pterodactyl:captcha:hcaptcha:secret_key', config('pterodactyl.captcha.hcaptcha.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.hcaptcha.secret_key_help') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ __('admin/settings.captcha.setup_instructions') }}</strong>
                  <ol>
                    <li>{!! __('admin/settings.captcha.hcaptcha.step_1') !!}</li>
                    <li>{{ __('admin/settings.captcha.hcaptcha.step_2') }}</li>
                    <li>{{ __('admin/settings.captcha.hcaptcha.step_3') }}</li>
                    <li>{{ __('admin/settings.captcha.hcaptcha.step_4') }}</li>
                    <li>{{ __('admin/settings.captcha.hcaptcha.step_5') }}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="recaptcha-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/settings.captcha.recaptcha.title') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.captcha.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:recaptcha:site_key"
                    value="{{ old('pterodactyl:captcha:recaptcha:site_key', config('pterodactyl.captcha.recaptcha.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.recaptcha.site_key_help') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/settings.captcha.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:recaptcha:secret_key"
                    value="{{ old('pterodactyl:captcha:recaptcha:secret_key', config('pterodactyl.captcha.recaptcha.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.recaptcha.secret_key_help') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ __('admin/settings.captcha.recaptcha.setup_instructions') }}</strong>
                  <ol>
                    <li>{!! __('admin/settings.captcha.recaptcha.step_1') !!}</li>
                    <li>{!! __('admin/settings.captcha.recaptcha.step_2') !!}</li>
                    <li>{{ __('admin/settings.captcha.recaptcha.step_3') }}</li>
                    <li>{{ __('admin/settings.captcha.recaptcha.step_4') }}</li>
                    <li>{{ __('admin/settings.captcha.recaptcha.step_5') }}</li>
                  </ol>
                  <p><strong>{{ __('admin/settings.captcha.recaptcha.note_label') }}</strong> {{ __('admin/settings.captcha.recaptcha.note') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div class="box" id="cap-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/settings.captcha.cap.title') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-4">
                <label class="control-label">{{ __('admin/settings.captcha.cap.server_url') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:cap:server_url"
                    value="{{ old('pterodactyl:captcha:cap:server_url', config('pterodactyl.captcha.cap.server_url', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.cap.server_url_help') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-4">
                <label class="control-label">{{ __('admin/settings.captcha.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:cap:site_key"
                    value="{{ old('pterodactyl:captcha:cap:site_key', config('pterodactyl.captcha.cap.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.cap.site_key_help') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-4">
                <label class="control-label">{{ __('admin/settings.captcha.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:cap:secret_key"
                    value="{{ old('pterodactyl:captcha:cap:secret_key', config('pterodactyl.captcha.cap.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ __('admin/settings.captcha.cap.secret_key_help') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ __('admin/settings.captcha.setup_instructions') }}</strong>
                  <ol>
                    <li>{!! __('admin/settings.captcha.cap.step_1') !!}</li>
                    <li>{{ __('admin/settings.captcha.cap.step_2') }}</li>
                    <li>{{ __('admin/settings.captcha.cap.step_3') }}</li>
                    <li>{{ __('admin/settings.captcha.cap.step_4') }}</li>
                    <li>{{ __('admin/settings.captcha.cap.step_5') }}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box box-primary">
          <div class="box-footer">
            {{ csrf_field() }}
            <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">{{ __('strings.save') }}</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const providerSelect = document.getElementById('captcha-provider');
      const turnstileSettings = document.getElementById('turnstile-settings');
      const hcaptchaSettings = document.getElementById('hcaptcha-settings');
      const recaptchaSettings = document.getElementById('recaptcha-settings');
      const capSettings = document.getElementById('cap-settings');

      function toggleSettings() {
        const provider = providerSelect.value;

        // Hide all provider-specific settings first
        turnstileSettings.style.display = 'none';
        hcaptchaSettings.style.display = 'none';
        recaptchaSettings.style.display = 'none';
        capSettings.style.display = 'none';

        if (provider === 'turnstile') {
          turnstileSettings.style.display = 'block';
        } else if (provider === 'hcaptcha') {
          hcaptchaSettings.style.display = 'block';
        } else if (provider === 'recaptcha') {
          recaptchaSettings.style.display = 'block';
        } else if (provider === 'cap') {
          capSettings.style.display = 'block';
        }
      }

      providerSelect.addEventListener('change', toggleSettings);

      // Initialize on page load with a small delay to ensure DOM is ready
      setTimeout(toggleSettings, 100);
    });
  </script>
@endsection
