@extends('templates/wrapper', [
    'css' => ['body' => 'bg-mocha-600'],
    'viteEntry' => 'resources/scripts/admin/index.tsx',
])

@section('container')
    <div data-hydrodactyl-app id="admin-app"></div>
@endsection
