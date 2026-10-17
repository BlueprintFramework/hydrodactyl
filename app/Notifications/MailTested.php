<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MailTested extends Notification
{
    public function __construct(private User $user)
    {
    }

    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        return (new MailMessage())
            ->subject(__('notifications.mail_tested.subject'))
            ->greeting(__('notifications.mail_tested.greeting', ['user' => $this->user->name]))
            ->line(__('notifications.mail_tested.line'));
    }
}
