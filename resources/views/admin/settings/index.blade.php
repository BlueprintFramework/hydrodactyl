@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'basic'])

@section('title')
  Settings
@endsection

@section('content-header')
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Panel Settings
        <small class="text-gray-500 ml-2">Configure Pterodactyl to your liking.</small>
      </h1>
    </div>
    <ol class="flex items-center space-x-2 text-sm text-gray-500">
      <li><a href="{{ route('admin.index') }}" class="text-blue-400 hover:text-blue-300">Admin</a></li>
      <li><span class="mx-1">/</span></li>
      <li class="text-gray-400">Settings</li>
    </ol>
  </div>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="max-w-3xl mx-auto mt-6">
    <div class="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-800 flex items-center space-x-2">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">General Settings</h3>
      </div>
      <form action="{{ route('admin.depr.settings') }}" method="POST">
        <div class="p-5 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
              <input type="text" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                name="app:name" value="{{ old('app:name', config('app.name')) }}" />
              <p class="text-xs text-gray-600 mt-1">Displayed throughout the panel and in outgoing emails.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Default Language</label>
              <select name="app:locale" class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
                @foreach($languages as $key => $value)
                  <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                @endforeach
              </select>
              <p class="text-xs text-gray-600 mt-1">Default language for UI components.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-3">Require 2-Factor Authentication</label>
            @php
              $level = old('pterodactyl:auth:2fa_required', config('pterodactyl.auth.2fa_required'));
            @endphp
            <div class="flex gap-2">
              @foreach([
                [0, 'Not Required', '2FA is optional for all users.'],
                [1, 'Admin Only', 'Only administrators must have 2FA enabled.'],
                [2, 'All Users', 'Every account must have 2FA enabled.'],
              ] as [$val, $label, $desc])
                <label class="flex-1 cursor-pointer">
                  <input type="radio" name="pterodactyl:auth:2fa_required" value="{{ $val }}" {{ $level == $val ? 'checked' : '' }} class="hidden peer">
                  <div class="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-center peer-checked:border-blue-500 peer-checked:bg-blue-900/20 transition-colors">
                    <div class="text-sm font-medium {{ $level == $val ? 'text-blue-400' : 'text-gray-300' }}">{{ $label }}</div>
                    <div class="text-xs text-gray-600 mt-1">{{ $desc }}</div>
                  </div>
                </label>
              @endforeach
            </div>
            <p class="text-xs text-gray-600 mt-2">Accounts in the selected group must have 2FA enabled to use the panel.</p>
          </div>
        </div>
        <div class="px-5 py-4 border-t border-gray-800 flex justify-end">
          {!! csrf_field() !!}
          <input type="hidden" name="_method" value="PATCH">
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium transition-colors">
            <svg class="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  </div>
@endsection
