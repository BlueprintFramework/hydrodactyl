<?php

namespace Pterodactyl\Providers;

use Pterodactyl\Listeners\Auth\AuthenticationListener;
use Pterodactyl\Events\Server\Installed as ServerInstalledEvent;
use Pterodactyl\Notifications\ServerInstalled as ServerInstalledNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     */
    protected $listen = [
        ServerInstalledEvent::class => [ServerInstalledNotification::class],
    ];

    protected $subscribe = [
        AuthenticationListener::class,
    ];

    /**
     * Register any events for your application.
     *
     * Observer registrations for User, Server, Subuser, Allocation, Egg,
     * EggVariable, and SessionActivity are handled by ObserverServiceProvider.
     */
    public function boot(): void
    {
        parent::boot();
    }
}
