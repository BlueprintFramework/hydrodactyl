<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex">
        <title>{{ config('app.name', 'Panel') }} — {{ trans('errors.' . $code . '.title') }}</title>
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
        @else
            <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
        @endif
        <style>
            :root {
                color-scheme: dark;
            }
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                background-color: #11100e;
                color: #f5f0ea;
                font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 24px;
            }
            .card {
                background-color: #1a1815;
                border: 1px solid #2e2a24;
                border-radius: 16px;
                padding: 48px 40px;
                max-width: 480px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
            }
            .code {
                font-size: 64px;
                font-weight: 800;
                letter-spacing: -0.04em;
                color: #52a9ff;
                line-height: 1;
            }
            h1 {
                font-size: 20px;
                font-weight: 600;
                margin-top: 16px;
            }
            p {
                color: #b8b0a4;
                font-size: 14px;
                line-height: 1.6;
                margin-top: 8px;
            }
            a {
                display: inline-block;
                margin-top: 28px;
                background-color: #52a9ff;
                color: #11100e;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 10px;
                padding: 10px 20px;
                transition: opacity 0.15s ease;
            }
            a:hover {
                opacity: 0.85;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="code">{{ $code }}</div>
            <h1>{{ trans('errors.' . $code . '.title') }}</h1>
            <p>{{ trans('errors.' . $code . '.message') }}</p>
            <a href="{{ url('/') }}">{{ trans('errors.back') }}</a>
        </div>
    </body>
</html>
