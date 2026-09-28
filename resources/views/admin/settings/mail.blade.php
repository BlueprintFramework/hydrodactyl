@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'mail'])

@section('title')
  {{ __('admin/settings.mail.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/settings.mail.title') }}<small>{{ __('admin/settings.mail.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li class="active">{{ __('admin/navigation.breadcrumb.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      @if($disabled)
      <div class="box box-primary">
        <div class="box-header with-border">
          <i class="fa fa-envelope"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.mail.title') }}</h3>
        </div>
        <div class="box-body">
          <div class="alert alert-info no-margin-bottom">
            <i class="fa fa-info-circle"></i> {!! __('admin/settings.mail.driver_required') !!}
          </div>
        </div>
      </div>
      @else
      <div class="box box-primary">
        <div class="box-header with-border">
          <i class="fa fa-envelope"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.mail.smtp_settings') }}</h3>
        </div>
        <form>
        <div class="box-body">
          <div class="row">
            <div class="form-group col-md-6">
              <label class="control-label">{{ __('admin/settings.mail.smtp_host') }}</label>
              <input required type="text" class="form-control" name="mail:mailers:smtp:host"
                value="{{ old('mail:mailers:smtp:host', config('mail.mailers.smtp.host')) }}" />
              <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.mail.smtp_host_help') }}</p>
            </div>
            <div class="form-group col-md-3">
              <label class="control-label">{{ __('strings.port') }}</label>
              <input required type="number" class="form-control" name="mail:mailers:smtp:port"
                value="{{ old('mail:mailers:smtp:port', config('mail.mailers.smtp.port')) }}" />
              <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.mail.smtp_port_help') }}</p>
            </div>
            <div class="form-group col-md-3">
              <label class="control-label">{{ __('admin/settings.mail.encryption') }}</label>
              @php
                $encryption = old('mail:mailers:smtp:encryption', config('mail.mailers.smtp.encryption'));
              @endphp
              <select name="mail:mailers:smtp:encryption" class="form-control">
                <option value="" @if($encryption === '') selected @endif>{{ __('strings.none') }}</option>
                <option value="tls" @if($encryption === 'tls') selected @endif>TLS</option>
                <option value="ssl" @if($encryption === 'ssl') selected @endif>SSL</option>
              </select>
              <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.mail.encryption_help') }}</p>
            </div>
          </div>
          <div class="row">
            <div class="form-group col-md-6">
              <label class="control-label">{{ __('strings.username') }} <span class="field-optional"></span></label>
              <input type="text" class="form-control" name="mail:mailers:smtp:username"
                value="{{ old('mail:mailers:smtp:username', config('mail.mailers.smtp.username')) }}" />
              <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.mail.smtp_username_help') }}</p>
            </div>
            <div class="form-group col-md-6">
              <label class="control-label">{{ __('strings.password') }} <span class="field-optional"></span></label>
              <input type="password" class="form-control" name="mail:mailers:smtp:password" />
              <p class="text-muted small" style="margin-top:4px;">{!! __('admin/settings.mail.password_help') !!}</p>
            </div>
          </div>
          <hr />
          <div class="row">
            <div class="form-group col-md-6">
              <label class="control-label">{{ __('admin/settings.mail.from_address') }}</label>
              <input required type="email" class="form-control" name="mail:from:address"
                value="{{ old('mail:from:address', config('mail.from.address')) }}" />
              <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.mail.from_address_help') }}</p>
            </div>
            <div class="form-group col-md-6">
              <label class="control-label">{{ __('admin/settings.mail.from_name') }} <span class="field-optional"></span></label>
              <input type="text" class="form-control" name="mail:from:name"
                value="{{ old('mail:from:name', config('mail.from.name')) }}" />
              <p class="text-muted small" style="margin-top:4px;">{{ __('admin/settings.mail.from_name_help') }}</p>
            </div>
          </div>
        </div>
        <div class="box-footer">
          {{ csrf_field() }}
          <div class="pull-right" style="display:flex;gap:6px;">
            <button type="button" id="testButton" class="btn btn-success"><i class="fa fa-paper-plane"></i> {{ __('admin/settings.mail.test') }}</button>
            <button type="button" id="saveButton" class="btn btn-primary"><i class="fa fa-save"></i> {{ __('strings.save') }}</button>
          </div>
        </div>
        </form>
      </div>
      @endif
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent

  <script>
    function saveSettings() {
    return $.ajax({
      method: 'PATCH',
      url: '/admin/settings/mail',
      contentType: 'application/json',
      data: JSON.stringify({
      'mail:mailers:smtp:host': $('input[name="mail:mailers:smtp:host"]').val(),
      'mail:mailers:smtp:port': $('input[name="mail:mailers:smtp:port"]').val(),
      'mail:mailers:smtp:encryption': $('select[name="mail:mailers:smtp:encryption"]').val(),
      'mail:mailers:smtp:username': $('input[name="mail:mailers:smtp:username"]').val(),
      'mail:mailers:smtp:password': $('input[name="mail:mailers:smtp:password"]').val(),
      'mail:from:address': $('input[name="mail:from:address"]').val(),
      'mail:from:name': $('input[name="mail:from:name"]').val()
      }),
      headers: { 'X-CSRF-Token': $('input[name="_token"]').val() }
    }).fail(function (jqXHR) {
      showErrorDialog(jqXHR, @js(__('admin/settings.mail.verb_save')));
    });
    }

    function testSettings() {
    swal({
      type: 'info',
      title: @js(__('admin/settings.mail.test_mail_settings')),
      text: @js(__('admin/settings.mail.test_begin')),
      showCancelButton: true,
      confirmButtonText: @js(__('admin/settings.mail.test')),
      closeOnConfirm: false,
      showLoaderOnConfirm: true
    }, function () {
      $.ajax({
      method: 'POST',
      url: '/admin/settings/mail/test',
      headers: { 'X-CSRF-TOKEN': $('input[name="_token"]').val() }
      }).fail(function (jqXHR) {
      showErrorDialog(jqXHR, @js(__('admin/settings.mail.verb_test')));
      }).done(function () {
      swal({
        title: @js(__('admin/settings.mail.success')),
        text: @js(__('admin/settings.mail.test_sent')),
        type: 'success'
      });
      });
    });
    }

    function saveAndTestSettings() {
    saveSettings().done(testSettings);
    }

    function showErrorDialog(jqXHR, verb) {
    console.error(jqXHR);
    var errorText = '';
    if (!jqXHR.responseJSON) {
      errorText = jqXHR.responseText;
    } else if (jqXHR.responseJSON.error) {
      errorText = jqXHR.responseJSON.error;
    } else if (jqXHR.responseJSON.errors) {
      $.each(jqXHR.responseJSON.errors, function (i, v) {
      if (v.detail) {
        errorText += v.detail + ' ';
      }
      });
    }

    swal({
      title: @js(__('admin/settings.mail.whoops')),
      text: @js(__('admin/settings.mail.error_attempting_prefix')) + verb + @js(__('admin/settings.mail.error_attempting_suffix')) + errorText,
      type: 'error'
    });
    }

    $(document).ready(function () {
    $('#testButton').on('click', saveAndTestSettings);
    $('#saveButton').on('click', function () {
      saveSettings().done(function () {
      swal({
        title: @js(__('admin/settings.mail.success')),
        text: @js(__('admin/settings.mail.updated')),
        type: 'success'
      });
      });
    });
    });
  </script>
@endsection
