<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Foundation\Application;

class LanguageMiddleware
{
    /**
     * LanguageMiddleware constructor.
     */
    public function __construct(private Application $app)
    {
    }

    /**
     * Handle an incoming request and set the user's preferred language.
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        $user = $request->user();
        $this->app->setLocale($user?->language ?? config('app.locale', 'en'));

        return $next($request);
    }
}
