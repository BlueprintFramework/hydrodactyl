@extends('layouts.admin')

@section('title')
  {{ $node->name }}
@endsection

@section('content-header')
  <h1>{{ $node->name }}<small>{{ __('admin/node.view.index.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li><a href="{{ route('admin.nodes') }}">{{ __('admin/navigation.sidebar.nodes') }}</a></li>
    <li class="active">{{ $node->name }}</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
    <div class="nav-tabs-custom nav-tabs-floating">
      <ul class="nav nav-tabs">
      <li class="active"><a href="{{ route('admin.nodes.view', $node->id) }}">{{ __('admin/node.view.tabs.about') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ __('strings.settings') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ __('strings.configuration') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ __('admin/node.view.tabs.allocation') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ __('strings.servers') }}</a></li>
      </ul>
    </div>
    </div>
  </div>
  <div class="row">
    <div class="col-sm-8">
    <div class="row">
      <div class="col-xs-12">
      <div class="box box-primary">
        <div class="box-header with-border">
        <h3 class="box-title">{{ __('admin/node.view.index.information') }}</h3>
        </div>
        <div class="box-body table-responsive no-padding">
        <table class="table table-hover">
          <tr>
          <td>{{ __('admin/node.view.index.daemon_version') }}</td>
          <td><code data-attr="info-version"><i class="fa fa-refresh fa-fw fa-spin"></i></code> ({{ __('admin/node.view.index.latest') }}
            <code>{{ $version->getDaemon() }}</code>)
          </td>
          </tr>
          <tr>
          <td>{{ __('admin/node.view.index.system_information') }}</td>
          <td data-attr="info-system"><i class="fa fa-refresh fa-fw fa-spin"></i></td>
          </tr>
          <tr>
          <td>{{ __('admin/node.view.index.total_cpu_threads') }}</td>
          <td data-attr="info-cpus"><i class="fa fa-refresh fa-fw fa-spin"></i></td>
          </tr>
        </table>
        </div>
      </div>
      </div>
      @if ($node->description)
      <div class="col-xs-12">
      <div class="box box-default">
      <div class="box-header with-border">
      {{ __('admin/node.view.index.description') }}
      </div>
      <div class="box-body table-responsive">
      <pre>{{ $node->description }}</pre>
      </div>
      </div>
      </div>
    @endif
      <div class="col-xs-12">
      <div class="box box-danger">
        <div class="box-header with-border">
        <h3 class="box-title">{{ __('admin/node.view.index.delete_node') }}</h3>
        </div>
        <div class="box-body">
        <p class="no-margin">{{ __('admin/node.view.index.delete_warning') }}</p>
        </div>
        <div class="box-footer">
        <form action="{{ route('admin.nodes.view.delete', $node->id) }}" method="POST">
          {!! csrf_field() !!}
          {!! method_field('DELETE') !!}
          <button type="submit" class="btn btn-danger btn-sm pull-right" {{ ($node->servers_count < 1) ?: 'disabled' }}>{{ __('admin/node.view.index.delete_confirm') }}</button>
        </form>
        </div>
      </div>
      </div>
    </div>
    </div>
    <div class="col-sm-4">
    <div class="box box-primary">
      <div class="box-header with-border">
      <h3 class="box-title">{{ __('admin/node.view.index.at_a_glance') }}</h3>
      </div>
      <div class="box-body">
      <div class="row">
        @if($node->maintenance_mode)
      <div class="col-sm-12">
      <div class="info-box bg-orange">
        <span class="info-box-icon"><i class="ion ion-wrench"></i></span>
        <div class="info-box-content" style="padding: 23px 10px 0;">
        <span class="info-box-text">{{ __('admin/node.view.index.node_under') }}</span>
        <span class="info-box-number">{{ __('admin/node.view.index.maintenance') }}</span>
        </div>
      </div>
      </div>
      @endif
        @php
      $stats = app('Pterodactyl\Repositories\Eloquent\NodeRepository')->getUsageStatsRaw($node);
      $memoryPercent = ($stats['memory']['value'] / $stats['memory']['base_limit']) * 100;
      $diskPercent = ($stats['disk']['value'] / $stats['disk']['base_limit']) * 100;

      $memoryColor = $memoryPercent < 50 ? '#50af51' : ($memoryPercent < 70 ? '#e0a800' : '#d9534f');
      $diskColor = $diskPercent < 50 ? '#50af51' : ($diskPercent < 70 ? '#e0a800' : '#d9534f');

      $allocatedMemory = humanizeSize($stats['memory']['value'] * 1024 * 1024);
      $totalMemory = humanizeSize($stats['memory']['max'] * 1024 * 1024);
      $allocatedDisk = humanizeSize($stats['disk']['value'] * 1024 * 1024);
      $totalDisk = humanizeSize($stats['disk']['max'] * 1024 * 1024);
    @endphp
        <div class="col-sm-12">
        <div class="info-box bg-{{ $diskColor}}" style="background: {{ $diskColor }}">
          <span class="info-box-icon"><i class="ion ion-ios-folder-outline"></i></span>
          <div class="info-box-content" style="padding: 15px 10px 0;">
          <span class="info-box-text">{{ __('admin/node.view.index.disk_allocated') }}</span>
          <span class="info-box-number">
            {{ $allocatedDisk }} /
            {{ $totalDisk }}
          </span>
          <div class="progress">
            <div class="progress-bar" style="width: {{ $diskPercent}}%"></div>
          </div>
          </div>
        </div>
        </div>
        <div class="col-sm-12">
        <div class="info-box bg-{{ $memoryColor}}" style="background: {{ $memoryColor }}">
          <span class=" info-box-icon"><i class="ion ion-ios-barcode-outline"></i></span>
          <div class="info-box-content" style="padding: 15px 10px 0;">
          <span class="info-box-text">{{ __('admin/node.view.index.memory_allocated') }}</span>
          <span class="info-box-number">
            {{ humanizeSize($stats['memory']['value'] * 1024 * 1024) }} /
            {{ $totalMemory}}
          </span>
          <div class="progress">
            <div class="progress-bar" style="width: {{ $memoryPercent }}%"></div>
          </div>
          </div>
        </div>
        </div>
      </div>
      </div>
      <div class="col-sm-12">
      <div class="info-box bg-blue">
        <span class="info-box-icon"><i class="ion ion-social-buffer-outline"></i></span>
        <div class="info-box-content" style="padding: 23px 10px 0;">
        <span class="info-box-text">{{ __('admin/node.view.index.total_servers') }}</span>
        <span class="info-box-number">{{ $node->servers_count }}</span>
        </div>
      </div>
      </div>
    </div>
    </div>
  </div>
  </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
    }

    (function getInformation() {
    $.ajax({
      method: 'GET',
      url: '/admin/nodes/view/{{ $node->id }}/system-information',
      timeout: 5000,
    }).done(function (data) {
      $('[data-attr="info-version"]').html(escapeHtml(data.version));
      $('[data-attr="info-system"]').html(escapeHtml(data.system.type) + ' (' + escapeHtml(data.system.arch) + ') <code>' + escapeHtml(data.system.release) + '</code>');
      $('[data-attr="info-cpus"]').html(data.system.cpus);
    }).fail(function (jqXHR) {

    }).always(function () {
      setTimeout(getInformation, 10000);
    });
    })();
  </script>
@endsection
