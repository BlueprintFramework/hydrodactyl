<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AT Protocol OAuth client
    |--------------------------------------------------------------------------
    |
    | The panel acts as a confidential AT Protocol OAuth client so it can write
    | DNS zone records into an account's repository. The client_id is derived
    | from the application URL, which must be a public HTTPS address so PDS
    | instances can fetch the client metadata document and redirect back.
    |
    */

    // The OAuth scopes the client may request. "atproto" is mandatory; the repo
    // scope grants create/update/delete on the Marque DNS collection.
    'scope' => env('ATPROTO_OAUTH_SCOPE', 'atproto repo:at.marque.dns'),

    // Human readable name shown on the authorization screen.
    'client_name' => env('ATPROTO_OAUTH_CLIENT_NAME', 'Hydrodactyl'),

    // Paths served by the panel. The full URLs are built from APP_URL.
    'metadata_path' => '/oauth/client-metadata.json',
    'redirect_path' => '/oauth/callback',

    // Where the client's confidential authentication key is stored.
    'client_key_setting' => 'atproto.oauth.client_key',

    'timeout' => 30,
    'connect_timeout' => 10,
];
