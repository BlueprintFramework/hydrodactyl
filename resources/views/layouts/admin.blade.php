<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{ config('app.name', 'Panel') }} - @yield('title')</title>
  <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
  <meta name="_token" content="{{ csrf_token() }}">

  @php
    $_favType = config('app.logo.type');
    $_favVal = config('app.logo.value');
    if ($_favType === 'upload' && $_favVal && Storage::disk('public')->exists($_favVal)) {
      $_favUrl = url('storage/' . $_favVal);
    } elseif ($_favType === 'link' && $_favVal) {
      $_favUrl = $_favVal;
    } else {
      $_favUrl = null;
    }
  @endphp
  @if($_favUrl)
  <link rel="icon" href="{{ $_favUrl }}" />
  <link rel="apple-touch-icon" href="{{ $_favUrl }}" />
  @else
  <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
  <link rel="shortcut icon" href="/favicons/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
  @endif
  <meta name="apple-mobile-web-app-title" content="Hydrodactyl" />
  <link rel="manifest" href="/favicons/site.webmanifest" />

  <meta name="theme-color" content="#000000">
  <meta name="darkreader-lock">

  @include('layouts.scripts')

  @section('scripts')
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
  @if(file_exists(public_path('build/manifest.json')))
  @vite('resources/scripts/admin/index.tsx')
  @endif
  {!! Theme::css('vendor/select2/select2.min.css?t={cache-version}') !!}
  {!! Theme::css('vendor/bootstrap/bootstrap.min.css?t={cache-version}') !!}
  {!! Theme::css('vendor/adminlte/admin.min.css?t={cache-version}') !!}
  {!! Theme::css('vendor/adminlte/colors/skin-blue.min.css?t={cache-version}') !!}
  {!! Theme::css('vendor/sweetalert/sweetalert.min.css?t={cache-version}') !!}
  {!! Theme::css('vendor/animate/animate.min.css?t={cache-version}') !!}
  {!! Theme::css('css/pterodactyl.css?t={cache-version}') !!}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

  <!--[if lt IE 9]>
            <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
            <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
            <![endif]-->
  @show
</head>

<body class="hold-transition skin-blue fixed sidebar-mini">
  <div class="wrapper">
    <header class="main-header">
      <a href="{{ route('index') }}" class="logo">
        @php
          $logoType = config('app.logo.type');
          $logoValue = config('app.logo.value');
        @endphp
        <span class="logo-mini">
          @if($logoType === 'upload' && $logoValue && Storage::disk('public')->exists($logoValue))
            <img src="{{ url('storage/' . $logoValue) }}" alt="{{ config('app.name', 'Panel') }}" style="max-height:30px;vertical-align:middle;">
          @elseif($logoType === 'link' && $logoValue)
            <img src="{{ $logoValue }}" alt="{{ config('app.name', 'Panel') }}" style="max-height:30px;vertical-align:middle;">
          @else
            <svg width="30" height="28" viewBox="0 0 100 92" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
                <path d="M35.1293 92L39.2242 59.3897L44.8276 60.4695L14.2241 81.2019L0 57.0141L32.7586 45.3521V47.7277L0 33.4742L14.2241 8.85446L45.6896 33.2582L39.2242 34.1221L34.4828 0H65.5172L61.4225 33.9061L56.681 32.8263L85.7759 8.85446L100 33.4742L66.1638 47.7277V45.5681L99.569 57.0141L85.3448 81.2019L57.5431 59.3897H61.638L66.1638 92H35.1293Z" fill="#52A9FF" />
            </svg>
          @endif
        </span>
        <span class="logo-lg">
          @if($logoType === 'upload' && $logoValue && Storage::disk('public')->exists($logoValue))
            <img src="{{ url('storage/' . $logoValue) }}" alt="" style="max-height:30px;vertical-align:middle;margin-right:6px;">
          @elseif($logoType === 'link' && $logoValue)
            <img src="{{ $logoValue }}" alt="" style="max-height:30px;vertical-align:middle;margin-right:6px;">
          @else
            <svg width="30" height="28" viewBox="0 0 100 92" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:6px;">
                <path d="M35.1293 92L39.2242 59.3897L44.8276 60.4695L14.2241 81.2019L0 57.0141L32.7586 45.3521V47.7277L0 33.4742L14.2241 8.85446L45.6896 33.2582L39.2242 34.1221L34.4828 0H65.5172L61.4225 33.9061L56.681 32.8263L85.7759 8.85446L100 33.4742L66.1638 47.7277V45.5681L99.569 57.0141L85.3448 81.2019L57.5431 59.3897H61.638L66.1638 92H35.1293Z" fill="#52A9FF" />
            </svg>
          @endif
          <b>{{ config('app.name', 'Hydrodactyl') }}</b>
        </span>
      </a>
      <nav class="navbar navbar-static-top">
        <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
          <span class="sr-only">{{ __('admin/navigation.sidebar.toggle_navigation') }}</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </a>
        <div class="navbar-custom-menu">
          <ul class="nav navbar-nav">
            <li class="user-menu">
              <a href="{{ route('account') }}">

                <span class="hidden-xs">{{ Auth::user()->name_first }} {{ Auth::user()->name_last }}</span>
              </a>
            </li>
            <li>
            <li><a href="{{ route('index') }}" data-toggle="tooltip" data-placement="bottom"
                title="{{ __('admin/navigation.exit_admin_control') }}"><i class="fa fa-server"></i></a></li>
            </li>
            <li>
            <li><a href="{{ route('auth.logout') }}" id="logoutButton" data-toggle="tooltip" data-placement="bottom"
                title="{{ __('admin/navigation.logout') }}"><i class="fa fa-sign-out"></i></a></li>
            </li>
          </ul>
        </div>
      </nav>
    </header>
    <aside class="main-sidebar">
      <section class="sidebar">
        <ul class="sidebar-menu">
          <li class="header">{{ __('admin/navigation.sidebar.basic_administration') }}</li>
          <li class="{{ Route::currentRouteName() !== 'admin.index' ?: 'active' }}">
            <a href="{{ route('admin.index') }}">
              <i class="bi bi-house-fill"></i> <span>{{ __('admin/navigation.sidebar.overview') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.settings') ?: 'active' }}">
            <a href="{{ route('admin.settings')}}">
              <i class="bi bi-gear-fill"></i> <span>{{ __('admin/navigation.sidebar.settings') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.api') ?: 'active' }}">
            <a href="{{ route('admin.api.index')}}">
              <i class="bi bi-globe"></i> <span>{{ __('admin/navigation.sidebar.application_api') }}</span>
            </a>
          </li>
          <li class="header">{{ __('admin/navigation.sidebar.management') }}</li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.databases') ?: 'active' }}">
            <a href="{{ route('admin.databases') }}">
              <i class="bi bi-database-fill"></i> <span>{{ __('admin/navigation.sidebar.databases') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.buckets') ?: 'active' }}">
            <a href="{{ route('admin.buckets') }}">
              <i class="bi bi-bucket-fill"></i> <span>{{ __('admin/navigation.sidebar.s3_buckets') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.locations') ?: 'active' }}">
            <a href="{{ route('admin.locations') }}">
              <i class="bi bi-globe-americas"></i> <span>{{ __('admin/navigation.sidebar.locations') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.nodes') ?: 'active' }}">
            <a href="{{ route('admin.nodes') }}">
              <i class="bi bi-hdd-fill"></i> <span>{{ __('admin/navigation.sidebar.nodes') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.servers') ?: 'active' }}">
            <a href="{{ route('admin.servers') }}">
              <i class="bi bi-hdd-stack-fill"></i> <span>{{ __('admin/navigation.sidebar.servers') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.users') ?: 'active' }}">
            <a href="{{ route('admin.users') }}">
              <i class="bi bi-people-fill"></i> <span>{{ __('admin/navigation.sidebar.users') }}</span>
            </a>
          </li>
          <li class="header">{{ __('admin/navigation.sidebar.service_management') }}</li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.mounts') ?: 'active' }}">
            <a href="{{ route('admin.mounts') }}">
              <i class="bi bi-magic"></i> <span>{{ __('admin/navigation.sidebar.mounts') }}</span>
            </a>
          </li>
          <li class="{{ !starts_with(Route::currentRouteName(), 'admin.nests') ?: 'active' }}">
            <a href="{{ route('admin.nests') }}">
              <i class="bi bi-egg-fill"></i> <span>{{ __('admin/navigation.sidebar.nests') }}</span>
            </a>
          </li>
        </ul>
      </section>
    </aside>
    <div class="content-wrapper">
      <section class="content-header">
        @yield('content-header')
      </section>
      <section class="content">
        <div class="row">
          <div class="col-xs-12">
            @if (count($errors) > 0)
              <div class="alert alert-danger">
                {{ __('admin/navigation.validation_error') }}<br><br>
                <ul>
                  @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                  @endforeach
                </ul>
              </div>
            @endif
            @foreach (Alert::getMessages() as $type => $messages)
              @foreach ($messages as $message)
                <div class="alert alert-{{ $type }} alert-dismissable" role="alert">
                  {!! $message !!}
                </div>
              @endforeach
            @endforeach
          </div>
        </div>
        @yield('content')
      </section>
    </div>
    <footer class="main-footer">
      <div class="pull-right small text-zinc" style="margin-right:10px;margin-top:-7px;">
        <strong><i class="fa fa-fw {{ $appIsGit ? 'fa-git-square' : 'fa-code-fork' }}"></i></strong>
        {{ $appVersion }}<br />
        <strong><i class="fa fa-fw fa-clock-o"></i></strong> {{ round(microtime(true) - LARAVEL_START, 3) }}s
      </div>
      {!! __('admin/navigation.copyright', ['year' => date('Y')]) !!}
    </footer>
  </div>
  @section('footer-scripts')
  @viteReactRefresh
  <script src="/js/keyboard.polyfill.js" type="application/javascript"></script>
  <script>keyboardeventKeyPolyfill.polyfill();</script>

  {!! Theme::js('vendor/jquery/jquery.min.js?t={cache-version}') !!}
  {!! Theme::js('vendor/sweetalert/sweetalert.min.js?t={cache-version}') !!}
  {!! Theme::js('vendor/bootstrap/bootstrap.min.js?t={cache-version}') !!}
  {!! Theme::js('vendor/slimscroll/jquery.slimscroll.min.js?t={cache-version}') !!}
  {!! Theme::js('vendor/adminlte/app.min.js?t={cache-version}') !!}
  {!! Theme::js('vendor/bootstrap-notify/bootstrap-notify.min.js?t={cache-version}') !!}
  {!! Theme::js('vendor/select2/select2.full.min.js?t={cache-version}') !!}
  {!! Theme::js('js/admin/functions.js?t={cache-version}') !!}
  <script src="/js/autocomplete.js" type="application/javascript"></script>

  @if(Auth::user()->root_admin)
    <script>
      $('#logoutButton').on('click', function (event) {
        event.preventDefault();

        var that = this;
        swal({
          title: @js(__('admin/navigation.logout_confirm_title')),
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d9534f',
          cancelButtonColor: '#d33',
          confirmButtonText: @js(__('admin/navigation.logout_confirm_button')),
        }, function () {
          $.ajax({
            type: 'POST',
            url: '{{ route('auth.logout') }}',
            data: {
              _token: '{{ csrf_token() }}'
            }, complete: function () {
              window.location.href = '{{route('auth.login')}}';
            }
          });
        });
      });
    </script>
  @endif

  <script>
    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    })
  </script>
  @show
</body>

</html>
