@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'domains'])

@section('title')
  {{ __('admin/domains.create.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/domains.create.title') }}<small>{{ __('admin/domains.create.description') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.settings') }}">Settings</a></li>
    <li><a href="{{ route('admin.settings.domains.index') }}">{{ __('admin/domains.breadcrumb_domains') }}</a></li>
    <li class="active">{{ __('admin/domains.create.title') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <form action="{{ route('admin.settings.domains.store') }}" method="POST" id="domain-form">
        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/domains.domain_information') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label for="name" class="control-label">{{ __('admin/domains.domain_name') }} <span class="field-required"></span></label>
                <div>
                  <input type="text" name="name" id="name" class="form-control" value="{{ old('name') }}"
                    placeholder="example.com" required />
                  <p class="text-muted small">{{ __('admin/domains.domain_name_help') }}</p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label for="dns_provider" class="control-label">{{ __('admin/domains.dns_provider') }} <span class="field-required"></span></label>
                <div>
                  <select name="dns_provider" id="dns_provider" class="form-control" required>
                    <option value="">{{ __('admin/domains.select_provider') }}</option>
                    @foreach($providers as $key => $provider)
                      <option value="{{ $key }}" @if(old('dns_provider') === $key) selected @endif>
                        {{ $provider['name'] }}
                      </option>
                    @endforeach
                  </select>
                  <p class="text-muted small">{{ __('admin/domains.dns_provider_help') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="dns-config-box" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/domains.provider_configuration') }}</h3>
          </div>
          <div class="box-body" id="dns-config-content">
            <!-- Dynamic content will be loaded here -->
          </div>
        </div>

        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">{{ __('admin/domains.additional_settings') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/domains.status') }}</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    <label class="btn btn-outline-primary @if(old('is_active', true)) active @endif">
                      <input type="radio" name="is_active" value="1" @if(old('is_active', true)) checked @endif> {{ __('admin/domains.active') }}
                    </label>
                    <label class="btn btn-outline-primary @if(!old('is_active', true)) active @endif">
                      <input type="radio" name="is_active" value="0" @if(!old('is_active', true)) checked @endif> {{ __('admin/domains.inactive') }}
                    </label>
                  </div>
                  <p class="text-muted small">{{ __('admin/domains.status_help') }}</p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ __('admin/domains.default_domain') }}</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    <label class="btn btn-outline-primary @if(old('is_default', false)) active @endif">
                      <input type="radio" name="is_default" value="1" @if(old('is_default', false)) checked @endif> {{ __('strings.yes') }}
                    </label>
                    <label class="btn btn-outline-primary @if(!old('is_default', false)) active @endif">
                      <input type="radio" name="is_default" value="0" @if(!old('is_default', false)) checked @endif> {{ __('strings.no') }}
                    </label>
                  </div>
                  <p class="text-muted small">{{ __('admin/domains.default_help') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box box-primary">
          <div class="box-footer">
            {{ csrf_field() }}
            <button type="button" id="test-connection" class="btn btn-sm btn-info" disabled>
              <i class="fa fa-refresh fa-spin" style="display: none;"></i> {{ __('admin/domains.test_connection') }}
            </button>
            <a href="{{ route('admin.settings.domains.index') }}" class="btn btn-sm btn-default">{{ __('strings.cancel') }}</a>
            <button type="submit" class="btn btn-sm btn-success pull-right">{{ __('admin/domains.create.title') }}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function () {
      const $providerSelect = $('#dns_provider');
      const $configBox = $('#dns-config-box');
      const $configContent = $('#dns-config-content');
      const $testButton = $('#test-connection');
      const $form = $('#domain-form');

      // Handle provider selection
      $providerSelect.change(function () {
        const provider = $(this).val();

        if (provider) {
          loadProviderConfig(provider);
          $testButton.prop('disabled', false);
        } else {
          $configBox.hide();
          $testButton.prop('disabled', true);
        }
      });

      // Test connection
      $testButton.click(function () {
        const $button = $(this);
        const $spinner = $button.find('.fa-spin');

        // Gather form data
        const formData = {
          dns_provider: $providerSelect.val(),
          dns_config: {}
        };

        // Collect DNS config fields
        $configContent.find('input').each(function () {
          const name = $(this).attr('name');
          if (name && name.startsWith('dns_config[')) {
            const key = name.replace('dns_config[', '').replace(']', '');
            formData.dns_config[key] = $(this).val();
          }
        });

        $button.prop('disabled', true);
        $spinner.show();

        $.post('{{ route('admin.settings.domains.test-connection') }}', {
          _token: '{{ csrf_token() }}',
          ...formData
        })
          .done(function (response) {
            if (response.success) {
              swal({
                type: 'success',
                title: @js(__('admin/domains.connection_successful_title')),
                text: response.message
              });
            } else {
              swal({
                type: 'error',
                title: @js(__('admin/domains.connection_failed_title')),
                text: response.message
              });
            }
          })
          .fail(function (xhr) {
            const response = xhr.responseJSON || {};
            swal({
              type: 'error',
              title: @js(__('admin/domains.connection_failed_title')),
              text: response.message || @js(__('admin/domains.unexpected_error'))
            });
          })
          .always(function () {
            $button.prop('disabled', false);
            $spinner.hide();
          });
      });

      // Load provider configuration
      function loadProviderConfig(provider) {
        $.get(`{{ route('admin.settings.domains.provider-schema', ':provider') }}`.replace(':provider', provider))
          .done(function (response) {
            if (response.success) {
              renderConfigForm(response.schema);
              $configBox.show();
            }
          })
          .fail(function () {
            $configBox.hide();
          });
      }

      // Render configuration form
      function renderConfigForm(schema) {
        let html = '<div class="row">';

        Object.keys(schema).forEach(function (key) {
          const field = schema[key];
          const oldValue = `{{ old('dns_config.${key}') }}`.replace('${key}', key);

          html += `
                          <div class="form-group col-md-6">
                            <label for="dns_config_${key}" class="control-label">
                              ${field.description || key} 
                              ${field.required ? '<span class="field-required"></span>' : ''}
                            </label>
                            <div>
                              <input type="${field.sensitive ? 'password' : 'text'}" 
                                     name="dns_config[${key}]" 
                                     id="dns_config_${key}" 
                                     class="form-control" 
                                     value="${oldValue}"
                                     ${field.required ? 'required' : ''} />
                            </div>
                          </div>
                        `;
        });

        html += '</div>';
        $configContent.html(html);
      }

      // Trigger change if provider is pre-selected
      if ($providerSelect.val()) {
        $providerSelect.trigger('change');
      }
    });
  </script>
@endsection
