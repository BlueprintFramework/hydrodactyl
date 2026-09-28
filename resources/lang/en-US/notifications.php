<?php

return [
    'server_installed' => [
        'subject' => 'Server Installed',
        'greeting' => 'Hello :user.',
        'installed' => 'Your server has finished installing and is now ready for you to use.',
        'server_name' => 'Server Name: :server',
        'action' => 'Login and Begin Using',
    ],
    'added_to_server' => [
        'subject' => 'Added To Server',
        'greeting' => 'Hello :user!',
        'added' => 'You have been added as a subuser for the following server, allowing you certain control over the server.',
        'server_name' => 'Server Name: :server',
        'action' => 'Visit Server',
    ],
    'removed_from_server' => [
        'subject' => 'Removed From Server',
        'greeting' => 'Hello :user.',
        'removed' => 'You have been removed as a subuser for the following server.',
        'server_name' => 'Server Name: :server',
        'action' => 'Visit Panel',
    ],
    'send_password_reset' => [
        'subject' => 'Reset Password',
        'line' => 'You are receiving this email because we received a password reset request for your account.',
        'action' => 'Reset Password',
        'no_action' => 'If you did not request a password reset, no further action is required.',
    ],
    'account_created' => [
        'subject' => 'Account Created',
        'greeting' => 'Hello :user!',
        'created' => 'You are receiving this email because an account has been created for you on :app.',
        'username' => 'Username: :username',
        'email' => 'Email: :email',
        'action' => 'Setup Your Account',
    ],
    'mail_tested' => [
        'subject' => 'Hydrodactyl Test Message',
        'greeting' => 'Hello :user!',
        'line' => 'This is a test of the Hydrodactyl mail system. You\'re good to go!',
    ],
];
