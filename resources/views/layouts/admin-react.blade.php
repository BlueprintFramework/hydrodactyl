<!DOCTYPE html>
<html lang="en" style="background-color:#11100E;height:100%;width:100%;margin:0;padding:0;">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{ config('app.name', 'Panel') }} - @yield('title')</title>
  <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
  <meta name="_token" content="{{ csrf_token() }}">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <meta name="robots" content="noindex">

  @php
    $_favType = config('app.logo.type');
    $_favVal = config('app.logo.value');
    if ($_favType === 'upload' && $_favVal) {
      $_favUrl = url('storage/' . $_favVal);
    } elseif ($_favType === 'link' && $_favVal) {
      $_favUrl = $_favVal;
    } else {
      $_favUrl = null;
    }
  @endphp
  <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
  <link rel="shortcut icon" href="/favicons/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content="Hydrodactyl" />
  <link rel="manifest" href="/favicons/site.webmanifest" />
  @if($_favUrl)
  <link rel="icon" href="{{ $_favUrl }}" />
  <link rel="apple-touch-icon" href="{{ $_favUrl }}" />
  @endif

  <meta name="theme-color" content="#000000">
  <meta name="darkreader-lock">
  <style>
    @import url('https://fonts.bunny.net/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
  </style>

  @if(!is_null(Auth::user()))
    <script>
      window.HydrodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
    </script>
  @endif
  @if(!empty($siteConfiguration))
    <script>
      window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
    </script>
  @endif
  @if(Auth::guest() && !\Pterodactyl\Models\User::query()->exists())
    <script>window.SetupRequired = true;</script>
  @endif

  @yield('assets')

  @include('layouts.scripts')

  @viteReactRefresh
  @vite('resources/scripts/index.tsx')
</head>

<body style="background-color:#11100E;height:100%;width:100%;margin:0;padding:0;">
  <div data-hydrodactyl-app id="app"></div>
</body>

</html>
