@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'domains'])

@section('title')
  {{ __('admin/domains.index_title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/domains.index_title') }}<small>{{ __('admin/domains.index_description') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.settings') }}">Settings</a></li>
    <li class="active">{{ __('admin/domains.breadcrumb_domains') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">{{ __('admin/domains.configured_domains') }}</h3>
          <div class="box-tools">
            <a href="{{ route('admin.settings.domains.create') }}" class="btn btn-sm btn-primary">{{ __('admin/domains.create_new') }}</a>
          </div>
        </div>
        <div class="box-body table-responsive no-padding">
          @if(count($domains) > 0)
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>{{ __('admin/domains.domain_name') }}</th>
                  <th>{{ __('admin/domains.dns_provider') }}</th>
                  <th>{{ __('admin/domains.status') }}</th>
                  <th>{{ __('admin/domains.default') }}</th>
                  <th>{{ __('admin/domains.subdomains') }}</th>
                  <th>{{ __('admin/domains.created_column') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @foreach($domains as $domain)
                  <tr>
                    <td><code>{{ $domain->name }}</code></td>
                    <td>
                      <span class="label label-primary">{{ ucfirst($domain->dns_provider) }}</span>
                    </td>
                    <td>
                      @if($domain->is_active)
                        <span class="label label-success">{{ __('admin/domains.active') }}</span>
                      @else
                        <span class="label label-danger">{{ __('admin/domains.inactive') }}</span>
                      @endif
                    </td>
                    <td>
                      @if($domain->is_default)
                        <span class="label label-info">{{ __('admin/domains.default') }}</span>
                      @endif
                    </td>
                    <td>
                      <span class="label label-default">{{ $domain->server_subdomains_count ?? 0 }}</span>
                    </td>
                    <td>{{ $domain->created_at->diffForHumans() }}</td>
                    <td class="text-center">
                      <a href="{{ route('admin.settings.domains.edit', $domain) }}" class="btn btn-xs btn-primary">{{ __('admin/domains.edit') }}</a>
                      @if($domain->server_subdomains_count == 0)
                        <form action="{{ route('admin.settings.domains.destroy', $domain) }}" method="POST" style="display: inline;" onsubmit="return confirm(@js(__('admin/domains.confirm_delete')))">
                          @csrf
                          @method('DELETE')
                          <button type="submit" class="btn btn-xs btn-danger">{{ __('admin/domains.delete') }}</button>
                        </form>
                      @endif
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @else
            <div class="text-center" style="padding: 50px;">
              <h4 class="text-muted">{{ __('admin/domains.no_domains') }}</h4>
              <p class="text-muted">
                {{ __('admin/domains.no_domains_description') }}<br>
                <a href="{{ route('admin.settings.domains.create') }}" class="btn btn-primary btn-sm" style="margin-top: 10px;">{{ __('admin/domains.create_first') }}</a>
              </p>
            </div>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function() {
      $('.btn-danger').click(function(e) {
        if (!confirm(@js(__('admin/domains.confirm_delete_js')))) {
          e.preventDefault();
          return false;
        }
      });
    });
  </script>
@endsection
