@extends('layouts.admin')

@section('title')
  {{ __('admin/node.view.settings.title', ['name' => $node->name]) }}
@endsection

@section('content-header')
  <h1>{{ $node->name }}<small>{{ __('admin/node.view.settings.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li><a href="{{ route('admin.nodes') }}">{{ __('admin/navigation.sidebar.nodes') }}</a></li>
    <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
    <li class="active">{{ __('strings.settings') }}</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
    <div class="nav-tabs-custom nav-tabs-floating">
      <ul class="nav nav-tabs">
      <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ __('admin/node.view.tabs.about') }}</a></li>
      <li class="active"><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ __('strings.settings') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ __('strings.configuration') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ __('admin/node.view.tabs.allocation') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ __('strings.servers') }}</a></li>
      </ul>
    </div>
    </div>
  </div>
  <form action="{{ route('admin.nodes.view.settings', $node->id) }}" method="POST">
    <div class="row">
    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ __('strings.settings') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-xs-12">
        <label for="name" class="control-label">{{ __('admin/node.view.settings.node_name') }}</label>
        <div>
          <input type="text" autocomplete="off" name="name" class="form-control"
          value="{{ old('name', $node->name) }}" />
          <p class="text-muted"><small>{!! __('admin/node.view.settings.name_help') !!}</small></p>
        </div>
        </div>
        <div class="form-group col-xs-12">
        <label for="description" class="control-label">{{ __('admin/node.view.settings.description') }}</label>
        <div>
          <textarea name="description" id="description" rows="4"
          class="form-control">{{ $node->description }}</textarea>
        </div>
        </div>
        <div class="form-group col-xs-12">
        <label for="name" class="control-label">{{ __('admin/node.view.settings.location') }}</label>
        <div>
          <select name="location_id" class="form-control">
          @foreach($locations as $location)
                <option value="{{ $location->id }}" {{ (old('location_id', $node->location_id) === $location->id) ? 'selected' : '' }}>{{ $location->long }} ({{ $location->short }})</option>
          @endforeach
          </select>
        </div>
        <label for="pDaemonType" class="form-label">{{ __('admin/node.view.settings.daemon') }}</label>
        <div>
        <select name="daemonType" id="pDaemonType" class="form-control">
            @foreach($daemonTypes as $daemon)
                <option value="{{ $daemon }}" {{ $daemon == old('daemon_type', $node->daemonType) ? 'selected' : '' }}>{{ $daemon }}</option>
            @endforeach
        </select>
        </div>
        <label for="public" class="control-label">{{ __('admin/node.view.settings.allow_automatic_allocation') }} <sup><a data-toggle="tooltip"
            data-placement="top" title="{{ __('admin/node.view.settings.allow_automatic_allocation_tooltip') }}">?</a></sup></label>
        <div>
          <input type="radio" name="public" value="1" {{ (old('public', $node->public)) ? 'checked' : '' }}
          id="public_1" checked> <label for="public_1" style="padding-left:5px;">{{ __('strings.yes') }}</label><br />
          <input type="radio" name="public" value="0" {{ (old('public', $node->public)) ? '' : 'checked' }}
          id="public_0"> <label for="public_0" style="padding-left:5px;">{{ __('strings.no') }}</label>
        </div>
        <label for="public" class="control-label">{{ __('admin/node.view.settings.domain_by_alias') }} <sup><a data-toggle="tooltip"
            data-placement="top" title="{{ __('admin/node.view.settings.domain_by_alias_tooltip') }}">?</a></sup></label>
        <div>
          <input type="radio" name="trust_alias" value="1" {{ (old('trustalias', $node->trust_alias)) ? 'checked' : '' }}
          id="trust_alias_1" checked> <label for="public_1" style="padding-left:5px;">{{ __('strings.yes') }}</label><br />
          <input type="radio" name="trust_alias" value="0" {{ (old('trustalias', $node->trust_alias)) ? '' : 'checked' }}
          id="trust_alias_0"> <label for="trustalias_0" style="padding-left:5px;">{{ __('strings.no') }}</label>
        </div>
        </div>
        <div class="form-group col-xs-12">
        <label for="fqdn" class="control-label">{{ __('admin/node.view.settings.public_fqdn') }}</label>
        <div>
          <input type="text" autocomplete="off" name="fqdn" class="form-control"
          value="{{ old('fqdn', $node->fqdn) }}" />
        </div>
        <p class="text-muted">
          <small>
          {!! __('admin/node.view.settings.fqdn_help', ['daemon' => e($node->daemonType)]) !!}
          <a tabindex="0" data-toggle="popover" data-trigger="focus" title="{{ __('admin/node.view.settings.fqdn_tooltip_title') }}"
            data-content="{{ __('admin/node.view.settings.fqdn_tooltip_content') }}">{{ __('admin/node.view.settings.why') }}</a>
          </small>
        </p>
        </div>
        <div class="form-group col-xs-12">
        <label for="internal_fqdn" class="control-label">
          {{ __('admin/node.view.settings.internal_fqdn') }}
          <strong>({{ __('strings.optional') }})</strong>
        </label>
        <div>
          <input type="text" autocomplete="off" name="internal_fqdn" class="form-control"
          value="{{ old('internal_fqdn', $node->internal_fqdn) }}" />
        </div>
        <p class="text-muted">
          <small>
          {!! __('admin/node.view.settings.internal_fqdn_help', ['daemon' => e($node->daemonType)]) !!}
          </small>
        </p>
        </div>
        <div class="form-group col-xs-12">
        <label class="form-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span>
          {{ __('admin/node.view.settings.communicate_over_ssl') }}</label>
        <div>
          <div class="radio radio-success radio-inline">
          <input type="radio" id="pSSLTrue" value="https" name="scheme" {{ (old('scheme', $node->scheme) === 'https') ? 'checked' : '' }}>
          <label for="pSSLTrue"> {{ __('admin/node.view.settings.use_ssl') }}</label>
          </div>
          <div class="radio radio-danger radio-inline">
          <input type="radio" id="pSSLFalse" value="http" name="scheme" {{ (old('scheme', $node->scheme) !== 'https') ? 'checked' : '' }}>
          <label for="pSSLFalse"> {{ __('admin/node.view.settings.use_http') }}</label>
          </div>
        </div>
        <p class="text-muted small">{{ __('admin/node.view.settings.ssl_help') }}</p>
        </div>
        <div class="form-group col-xs-12">
        <label class="form-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span> {{ __('admin/node.view.settings.behind_proxy') }}</label>
        <div>
          <div class="radio radio-success radio-inline">
          <input type="radio" id="pProxyFalse" value="0" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == false) ? 'checked' : '' }}>
          <label for="pProxyFalse"> {{ __('admin/node.view.settings.not_behind_proxy') }} </label>
          </div>
          <div class="radio radio-info radio-inline">
          <input type="radio" id="pProxyTrue" value="1" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == true) ? 'checked' : '' }}>
          <label for="pProxyTrue"> {{ __('admin/node.view.settings.behind_proxy') }} </label>
          </div>
        </div>
        <p class="text-muted small">{{ __('admin/node.view.settings.behind_proxy_help') }}</p>
        </div>
        <div class="form-group col-xs-12">
        <label class="form-label"><span class="label label-warning"><i class="fa fa-wrench"></i></span> {{ __('admin/node.view.settings.maintenance_mode') }}</label>
        <div>
          <div class="radio radio-success radio-inline">
          <input type="radio" id="pMaintenanceFalse" value="0" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == false) ? 'checked' : '' }}>
          <label for="pMaintenanceFalse"> {{ __('admin/node.view.settings.disabled') }}</label>
          </div>
          <div class="radio radio-warning radio-inline">
          <input type="radio" id="pMaintenanceTrue" value="1" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == true) ? 'checked' : '' }}>
          <label for="pMaintenanceTrue"> {{ __('admin/node.view.settings.enabled') }}</label>
          </div>
        </div>
        <p class="text-muted small">{{ __('admin/node.view.settings.maintenance_help') }}</p>
        </div>
      </div>
      </div>
    </div>
    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ __('admin/node.view.settings.allocation_limits') }}</h3>
      </div>
      <div class="box-body row">
        <div class="col-xs-12">
        <div class="row">
          <div class="form-group col-xs-6">
          <label for="memory" class="control-label">{{ __('admin/node.view.settings.total_memory') }}</label>
          <div class="input-group">
            <input type="text" name="memory" class="form-control" data-multiplicator="true"
            value="{{ old('memory', $node->memory) }}" />
            <span class="input-group-addon">MiB</span>
          </div>
          </div>
          <div class="form-group col-xs-6">
          <label for="memory_overallocate" class="control-label">{{ __('admin/node.view.settings.overallocate') }}</label>
          <div class="input-group">
            <input type="text" name="memory_overallocate" class="form-control"
            value="{{ old('memory_overallocate', $node->memory_overallocate) }}" />
            <span class="input-group-addon">%</span>
          </div>
          </div>
        </div>
        <p class="text-muted small">{{ __('admin/node.view.settings.memory_help') }}</p>
        </div>
        <div class="col-xs-12">
        <div class="row">
          <div class="form-group col-xs-6">
          <label for="disk" class="control-label">{{ __('admin/node.view.settings.disk_space') }}</label>
          <div class="input-group">
            <input type="text" name="disk" class="form-control" data-multiplicator="true"
            value="{{ old('disk', $node->disk) }}" />
            <span class="input-group-addon">MiB</span>
          </div>
          </div>
          <div class="form-group col-xs-6">
          <label for="disk_overallocate" class="control-label">{{ __('admin/node.view.settings.overallocate') }}</label>
          <div class="input-group">
            <input type="text" name="disk_overallocate" class="form-control"
            value="{{ old('disk_overallocate', $node->disk_overallocate) }}" />
            <span class="input-group-addon">%</span>
          </div>
          </div>
        </div>
        <p class="text-muted small">{{ __('admin/node.view.settings.disk_help') }}</p>
        </div>
      </div>
      </div>
    </div>
    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ __('admin/node.view.settings.general_configuration') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-xs-12">
        <label for="disk_overallocate" class="control-label">{{ __('admin/node.view.settings.max_upload_size') }}</label>
        <div class="input-group">
          <input type="text" name="upload_size" class="form-control"
          value="{{ old('upload_size', $node->upload_size) }}" />
          <span class="input-group-addon">MiB</span>
        </div>
        <p class="text-muted"><small>{{ __('admin/node.view.settings.upload_size_help') }}</small></p>
        </div>
        <div class="col-xs-12">
        <div class="row">
          <div class="form-group col-md-6">
          <label for="daemonListen" class="control-label"><span class="label label-warning"><i
              class="fa fa-power-off"></i></span> {{ __('admin/node.view.settings.daemon_port') }}</label>
          <div>
            <input type="text" name="daemonListen" class="form-control"
            value="{{ old('daemonListen', $node->daemonListen) }}" />
          </div>
          </div>
          <div class="form-group col-md-6">
          <label for="daemonSFTP" class="control-label"><span class="label label-warning"><i
              class="fa fa-power-off"></i></span> {{ __('admin/node.view.settings.daemon_sftp_port') }}</label>
          <div>
            <input type="text" name="daemonSFTP" class="form-control"
            value="{{ old('daemonSFTP', $node->daemonSFTP) }}" />
          </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
          <p class="text-muted"><small>{!! __('admin/node.view.settings.daemon_sftp_help') !!}</small></p>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ __('admin/node.view.settings.backup_config') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-xs-12">
        <label for="pBackupDisk" class="form-label">{{ __('admin/node.view.settings.backup_disk') }}</label>
        <div>
        <select name="backupDisk" id="pBackupDisk" class="form-control">
            <!-- Populated via Script-->
        </select>
        </div>
        </div>
        <div class="form-group col-xs-12" id="pS3BucketGroup" style="{{ \Pterodactyl\Enums\Daemon\Adapters::requiresS3Bucket(old('backupDisk', $node->backupDisk)) ? '' : 'display: none;' }}">
        <label for="pS3Bucket" class="form-label">{{ __('admin/node.view.settings.s3_bucket') }}</label>
        <div>
        <select name="bucket" id="pS3Bucket" class="form-control">
            <option value="">{{ __('admin/node.view.settings.none_option') }}</option>
            @foreach($s3Buckets as $s3)
                <option value="{{ $s3->id }}" {{ old('bucket', $node->bucket) == $s3->id ? 'selected' : '' }}>
                    {{ $s3->name }} ({{ $s3->bucket_name }})
                </option>
            @endforeach
        </select>
        </div>
        <p class="text-muted small">{{ __('admin/node.view.settings.s3_bucket_help') }}</p>
        </div>
      </div>
      </div>
    </div>

    <div class="col-xs-12">
      <div class="box box-primary">
      <div class="box-header with-border">
        <h3 class="box-title">{{ __('admin/node.view.settings.save_settings') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-sm-6">
        <div>
          <input type="checkbox" name="reset_secret" id="reset_secret" /> <label for="reset_secret"
          class="control-label">{{ __('admin/node.view.settings.reset_master_key') }}</label>
        </div>
        <p class="text-muted"><small>{{ __('admin/node.view.settings.reset_master_key_help') }}</small></p>
        </div>
      </div>
      <div class="box-footer">
        {!! method_field('PATCH') !!}
        {!! csrf_field() !!}
        <button type="submit" class="btn btn-primary pull-right">{{ __('admin/node.view.settings.save_changes') }}</button>
      </div>
      </div>
    </div>
    </div>
  </form>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            const daemonSelect = document.getElementById('pDaemonType');
            const backupDiskSelect = document.getElementById('pBackupDisk');

            const s3Types = ['s3', 'rustic_s3'];

            function updateBackupDisks() {
                const daemonValue = daemonSelect.value;
                const disks = {!! json_encode($backupDisks ?? []) !!}[daemonValue] || [];

                backupDiskSelect.innerHTML = '';

                disks.forEach(disk => {
                    const option = document.createElement('option');
                    option.value = disk;
                    option.textContent = disk;

                    if (disk === '{{ old("backupDisk", $node->backupDisk) }}') {
                        option.selected = true;
                    }

                    backupDiskSelect.appendChild(option);
                });

                updateS3Visibility();
            }

            function updateS3Visibility() {
                const s3Group = document.getElementById('pS3BucketGroup');
                if (s3Group) {
                    s3Group.style.display = s3Types.includes(backupDiskSelect.value) ? '' : 'none';
                }
            }

            updateBackupDisks();

            daemonSelect.addEventListener('change', updateBackupDisks);
            backupDiskSelect.addEventListener('change', updateS3Visibility);

            $('[data-toggle="popover"]').popover({
                placement: 'auto'
            });

            $('select[name="location_id"]').select2();
        });
    </script>
@endsection
