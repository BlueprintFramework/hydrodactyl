<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class AccountCreated extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public User $user, public ?string $token = null)
    {
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(): MailMessage
    {
        $message = (new MailMessage())
            ->greeting(__('notifications.account_created.greeting', ['user' => $this->user->name]))
            ->line(__('notifications.account_created.created', ['app' => config('app.name')]))
            ->line(__('notifications.account_created.username', ['username' => $this->user->username]))
            ->line(__('notifications.account_created.email', ['email' => $this->user->email]));

        if (!is_null($this->token)) {
            return $message->action(__('notifications.account_created.action'), url('/auth/password/reset/' . $this->token . '?email=' . urlencode($this->user->email)));
        }

        return $message;
    }
}
