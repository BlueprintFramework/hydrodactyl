<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Relying Party
    |--------------------------------------------------------------------------
    |
    | Passkeys are bound to the panel's domain. In production this should be
    | the same host users visit, for example "panel.example.com". Set
    | PASSKEYS_RELYING_PARTY_ID when the panel is accessed through a different
    | hostname than APP_URL.
    |
    */

    'relying_party_id' => env(
        'PASSKEYS_RELYING_PARTY_ID',
        parse_url((string) config('app.url'), PHP_URL_HOST),
    ),

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | These are the browser origins allowed to complete a WebAuthn ceremony.
    | Keep this in sync with the URL users actually open, including a
    | non-default port if one is used.
    |
    */

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('PASSKEYS_ALLOWED_ORIGINS', (string) config('app.url'))),
    ))),

    /*
    |--------------------------------------------------------------------------
    | User Handle Secret
    |--------------------------------------------------------------------------
    |
    | Protects the stable, opaque user handle stored on authenticators. This
    | must remain stable across deployments; changing it invalidates existing
    | passkey user handles.
    |
    */

    'user_handle_secret' => env('PASSKEYS_USER_HANDLE_SECRET', config('app.key')),

    'timeout' => (int) env('PASSKEYS_TIMEOUT', 60000),

    'guard' => 'web',

    // The panel registers the routes itself so passkey sign-in can pass
    // through the existing TOTP checkpoint. Block the package's own login
    // routes as a second line of defence if discovery order ever changes.
    'middleware' => ['web', Pterodactyl\Http\Middleware\BlockPackagePasskeyLogin::class],

    'management_middleware' => ['auth'],

    'throttle' => null,

    'redirect' => '/',
];
