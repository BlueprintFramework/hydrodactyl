@section('settings::notice')
    @if(config('pterodactyl.load_environment_only', false))
        <div class="alert alert-danger">
            Your Panel is currently configured to read settings from the environment only. You will need to set <code>APP_ENVIRONMENT_ONLY=false</code> in your environment file in order to load settings dynamically.
        </div>
    @endif
@endsection
