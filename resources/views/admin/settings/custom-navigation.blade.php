@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'custom-navigation'])

@section('title')
  Custom Navigation
@endsection

@section('content-header')
  <h1>Custom Navigation<small>Configure custom sidebar links.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.settings') }}">Settings</a></li>
    <li class="active">Custom Navigation</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  @php
    $customNavItems = old('app:custom_nav_items', json_decode((string) config('app.custom_nav_items', '[]'), true) ?: []);
    $customNavIcons = [
      'link' => 'Link',
      'book' => 'Book',
      'globe' => 'Globe',
      'help' => 'Help',
      'home' => 'Home',
      'store' => 'Store',
      'discord' => 'Discord',
      'document' => 'Document',
      'terminal' => 'Terminal',
      'rocket' => 'Rocket',
    ];
  @endphp
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <div class="box box-primary">
        <div class="box-header with-border">
          <i class="fa fa-bars"></i> <h3 class="box-title" style="display:inline;">Custom Navigation Items</h3>
        </div>
        <form action="{{ route('admin.settings.custom-navigation') }}" method="POST">
          <div class="box-body">
            <div class="alert alert-info" style="margin-bottom:20px;">
              <i class="fa fa-flask"></i> <strong>Experimental:</strong> Custom Navigation Items is a new, experimental feature. Some aspects may change in future updates.
            </div>
            <p class="text-muted small">Add up to 3 custom links to display at the bottom of the sidebar.</p>

            @for($index = 0; $index < 3; $index++)
              @php
                $item = $customNavItems[$index] ?? [];
                $label = $item['label'] ?? '';
                $url = $item['url'] ?? '';
                $icon = $item['icon'] ?? 'link';
              @endphp
              <div class="row" style="margin-top:8px;">
                <div class="form-group col-md-4">
                  <label class="control-label">Item {{ $index + 1 }} Label</label>
                  <input type="text" class="form-control" name="app:custom_nav_items[{{ $index }}][label]" maxlength="32" value="{{ $label }}" placeholder="Documentation" />
                </div>
                <div class="form-group col-md-5">
                  <label class="control-label">Item {{ $index + 1 }} Link</label>
                  <input type="text" class="form-control" name="app:custom_nav_items[{{ $index }}][url]" maxlength="2048" value="{{ $url }}" placeholder="https://example.com or /account" />
                </div>
                <div class="form-group col-md-3">
                  <label class="control-label">Item {{ $index + 1 }} Icon</label>
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
            <button type="submit" class="btn btn-primary pull-right"><i class="fa fa-save"></i> Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
