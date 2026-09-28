@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'custom-navigation'])

@section('title')
  {{ __('admin/settings.custom_navigation.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/settings.custom_navigation.title') }}<small>{{ __('admin/settings.custom_navigation.subtitle') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li><a href="{{ route('admin.settings') }}">{{ __('admin/navigation.breadcrumb.settings') }}</a></li>
    <li class="active">{{ __('admin/settings.custom_navigation.title') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  @php
    $customNavItems = old('app:custom_nav_items', json_decode((string) config('app.custom_nav_items', '[]'), true) ?: []);
    $customNavIcons = [
      'link' => __('admin/settings.custom_navigation.icons.link'),
      'book' => __('admin/settings.custom_navigation.icons.book'),
      'globe' => __('admin/settings.custom_navigation.icons.globe'),
      'help' => __('admin/settings.custom_navigation.icons.help'),
      'home' => __('admin/settings.custom_navigation.icons.home'),
      'store' => __('admin/settings.custom_navigation.icons.store'),
      'discord' => __('admin/settings.custom_navigation.icons.discord'),
      'document' => __('admin/settings.custom_navigation.icons.document'),
      'terminal' => __('admin/settings.custom_navigation.icons.terminal'),
      'rocket' => __('admin/settings.custom_navigation.icons.rocket'),
    ];
  @endphp
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <div class="box box-primary">
        <div class="box-header with-border">
          <i class="fa fa-bars"></i> <h3 class="box-title" style="display:inline;">{{ __('admin/settings.custom_navigation.box_title') }}</h3>
        </div>
        <form action="{{ route('admin.settings.custom-navigation') }}" method="POST">
          <div class="box-body">
            <div class="alert alert-info" style="margin-bottom:20px;">
              <i class="fa fa-flask"></i> <strong>{{ __('admin/settings.custom_navigation.experimental') }}</strong> {{ __('admin/settings.custom_navigation.experimental_description') }}
            </div>
            <p class="text-muted small">{{ __('admin/settings.custom_navigation.add_links') }}</p>

            @for($index = 0; $index < 3; $index++)
              @php
                $item = $customNavItems[$index] ?? [];
                $label = $item['label'] ?? '';
                $url = $item['url'] ?? '';
                $icon = $item['icon'] ?? 'link';
              @endphp
              <div class="row" style="margin-top:8px;">
                <div class="form-group col-md-4">
                  <label class="control-label">{{ __('admin/settings.custom_navigation.item_label', ['number' => $index + 1]) }}</label>
                  <input type="text" class="form-control" name="app:custom_nav_items[{{ $index }}][label]" maxlength="32" value="{{ $label }}" placeholder="Documentation" />
                </div>
                <div class="form-group col-md-5">
                  <label class="control-label">{{ __('admin/settings.custom_navigation.item_link', ['number' => $index + 1]) }}</label>
                  <input type="text" class="form-control" name="app:custom_nav_items[{{ $index }}][url]" maxlength="2048" value="{{ $url }}" placeholder="https://example.com or /account" />
                </div>
                <div class="form-group col-md-3">
                  <label class="control-label">{{ __('admin/settings.custom_navigation.item_icon', ['number' => $index + 1]) }}</label>
                  <select name="app:custom_nav_items[{{ $index }}][icon]" class="form-control">
                    @foreach($customNavIcons as $value => $name)
                      <option value="{{ $value }}" @if($icon === $value) selected @endif>{{ $name }}</option>
                    @endforeach
                  </select>
                </div>
              </div>
            @endfor
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
