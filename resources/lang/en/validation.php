<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => 'The :attribute must be accepted.',
    'active_url' => 'The :attribute is not a valid URL.',
    'after' => 'The :attribute must be a date after :date.',
    'after_or_equal' => 'The :attribute must be a date after or equal to :date.',
    'alpha' => 'The :attribute may only contain letters.',
    'alpha_dash' => 'The :attribute may only contain letters, numbers, and dashes.',
    'alpha_num' => 'The :attribute may only contain letters and numbers.',
    'array' => 'The :attribute must be an array.',
    'before' => 'The :attribute must be a date before :date.',
    'before_or_equal' => 'The :attribute must be a date before or equal to :date.',
    'between' => [
        'numeric' => 'The :attribute must be between :min and :max.',
        'file' => 'The :attribute must be between :min and :max kilobytes.',
        'string' => 'The :attribute must be between :min and :max characters.',
        'array' => 'The :attribute must have between :min and :max items.',
    ],
    'boolean' => 'The :attribute field must be true or false.',
    'confirmed' => 'The :attribute confirmation does not match.',
    'date' => 'The :attribute is not a valid date.',
    'date_format' => 'The :attribute does not match the format :format.',
    'different' => 'The :attribute and :other must be different.',
    'digits' => 'The :attribute must be :digits digits.',
    'digits_between' => 'The :attribute must be between :min and :max digits.',
    'dimensions' => 'The :attribute has invalid image dimensions.',
    'distinct' => 'The :attribute field has a duplicate value.',
    'email' => 'The :attribute must be a valid email address.',
    'exists' => 'The selected :attribute is invalid.',
    'file' => 'The :attribute must be a file.',
    'filled' => 'The :attribute field is required.',
    'image' => 'The :attribute must be an image.',
    'in' => 'The selected :attribute is invalid.',
    'in_array' => 'The :attribute field does not exist in :other.',
    'integer' => 'The :attribute must be an integer.',
    'ip' => 'The :attribute must be a valid IP address.',
    'json' => 'The :attribute must be a valid JSON string.',
    'max' => [
        'numeric' => 'The :attribute may not be greater than :max.',
        'file' => 'The :attribute may not be greater than :max kilobytes.',
        'string' => 'The :attribute may not be greater than :max characters.',
        'array' => 'The :attribute may not have more than :max items.',
    ],
    'mimes' => 'The :attribute must be a file of type: :values.',
    'mimetypes' => 'The :attribute must be a file of type: :values.',
    'min' => [
        'numeric' => 'The :attribute must be at least :min.',
        'file' => 'The :attribute must be at least :min kilobytes.',
        'string' => 'The :attribute must be at least :min characters.',
        'array' => 'The :attribute must have at least :min items.',
    ],
    'not_in' => 'The selected :attribute is invalid.',
    'numeric' => 'The :attribute must be a number.',
    'present' => 'The :attribute field must be present.',
    'regex' => 'The :attribute format is invalid.',
    'required' => 'The :attribute field is required.',
    'required_if' => 'The :attribute field is required when :other is :value.',
    'required_unless' => 'The :attribute field is required unless :other is in :values.',
    'required_with' => 'The :attribute field is required when :values is present.',
    'required_with_all' => 'The :attribute field is required when :values is present.',
    'required_without' => 'The :attribute field is required when :values is not present.',
    'required_without_all' => 'The :attribute field is required when none of :values are present.',
    'same' => 'The :attribute and :other must match.',
    'size' => [
        'numeric' => 'The :attribute must be :size.',
        'file' => 'The :attribute must be :size kilobytes.',
        'string' => 'The :attribute must be :size characters.',
        'array' => 'The :attribute must contain :size items.',
    ],
    'string' => 'The :attribute must be a string.',
    'timezone' => 'The :attribute must be a valid zone.',
    'unique' => 'The :attribute has already been taken.',
    'uploaded' => 'The :attribute failed to upload.',
    'url' => 'The :attribute format is invalid.',

    'fqdn_ip_not_allowed' => 'The :attribute must not be an IP address when HTTPS is enabled.',
    'fqdn_resolution_failed' => 'The :attribute could not be resolved to a valid IP address.',
    'username_format' => 'The :attribute must start and end with alpha-numeric characters and
                contain only letters, numbers, dashes, underscores, and periods.',

    'json_api' => [
        'custom_nav_url_invalid' => 'The :attribute must be an HTTP(S) URL or internal path.',
        'database_unique' => 'The database name you have selected is already in use by this server.',
        'dns_access_key_id_required' => 'Access Key ID is required for Route53.',
        'dns_api_key_required' => 'Bunny.net API Access Key is required for Bunny.net.',
        'dns_api_token_required' => 'API token is required for Cloudflare.',
        'dns_config_required' => 'DNS configuration is required.',
        'dns_provider_invalid' => 'The selected DNS provider is not supported.',
        'dns_provider_required' => 'A DNS provider must be selected.',
        'dns_secret_access_key_required' => 'Secret Access Key is required for Route53.',
        'domain_name_format' => 'The domain name format is invalid.',
        'domain_name_required' => 'A domain name is required.',
        'domain_name_unique' => 'This domain is already configured.',
        'domain_not_available' => 'The selected domain is not available.',
        'logo_max' => 'The logo must not exceed 2MB in size.',
        'logo_mimes' => 'The logo must be a PNG, JPG, GIF, WEBP, or SVG file.',
        'logo_url_invalid' => 'The logo URL must be a valid URL.',
        'operation_id_required' => 'An operation ID is required.',
        'operation_id_uuid' => 'The operation ID must be a valid UUID.',
        'power_action_invalid' => 'The power action must be one of: start, stop, restart, kill.',
        'revert_docker_image_confirm' => 'You must confirm that you understand this action cannot be undone without administrator assistance.',
        'subdomain_invalid_characters' => 'Subdomain contains invalid characters.',
        'subdomain_reserved' => 'This subdomain is reserved and cannot be used.',
        'subdomain_taken' => 'This subdomain is already taken.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [
        'external_id' => 'Third Party Identifier',
        'name_first' => 'First Name',
        'name_last' => 'Last Name',
        'root_admin' => 'Root Administrator Status',
        'long' => 'Location Description',
        'short' => 'Location Identifier',
        'user' => 'User ID',
        'server_name' => 'Server Name',
        'add_allocations' => 'allocations to add',
        'remove_allocations' => 'allocations to remove',
        'add_allocation' => 'allocation to add',
        'remove_allocation' => 'allocation to remove',
        'feature_limits' => [
            'databases' => 'Database Limit',
            'allocations' => 'Allocation Limit',
            'backups' => 'Backup Limit',
            'backup_storage_mb' => 'Backup Storage Limit (MB)',
        ],
        'startup' => 'startup command',
        'memo' => 'Description',
        'app:name' => 'Company Name',
        'pterodactyl:auth:2fa_required' => 'Require 2-Factor Authentication',
        'app:locale' => 'Default Language',
        'pterodactyl:guzzle:timeout' => 'HTTP Request Timeout',
        'pterodactyl:guzzle:connect_timeout' => 'HTTP Connection Timeout',
        'pterodactyl:client_features:allocations:enabled' => 'Auto Create Allocations Enabled',
        'pterodactyl:client_features:allocations:range_start' => 'Starting Port',
        'pterodactyl:client_features:allocations:range_end' => 'Ending Port',
        'pterodactyl:client_features:groups:enabled' => 'Server Groups Enabled',
        'app:custom_nav_items' => [
            '*' => [
                'label' => 'Custom Nav Item Label',
                'url' => 'Custom Nav Item Link',
                'icon' => 'Custom Nav Item Icon',
            ],
        ],
        'pterodactyl:captcha:provider' => 'Captcha Provider',
        'pterodactyl:captcha:turnstile:site_key' => 'Turnstile Site Key',
        'pterodactyl:captcha:turnstile:secret_key' => 'Turnstile Secret Key',
        'pterodactyl:captcha:hcaptcha:site_key' => 'hCaptcha Site Key',
        'pterodactyl:captcha:hcaptcha:secret_key' => 'hCaptcha Secret Key',
        'pterodactyl:captcha:recaptcha:site_key' => 'reCAPTCHA Site Key',
        'pterodactyl:captcha:recaptcha:secret_key' => 'reCAPTCHA Secret Key',
        'pterodactyl:captcha:cap:site_key' => 'Cap Site Key',
        'pterodactyl:captcha:cap:secret_key' => 'Cap Secret Key',
        'pterodactyl:captcha:cap:server_url' => 'Cap Server URL',
        'domain_name' => 'domain name',
        'dns_provider' => 'DNS provider',
        'dns_config' => [
            'api_token' => 'API token',
            'access_key_id' => 'Access Key ID',
            'secret_access_key' => 'Secret Access Key',
            'region' => 'AWS Region',
            'hosted_zone_id' => 'Hosted Zone ID',
            'api_key' => 'Bunny.net API Access Key',
        ],
        'daemon_base' => 'Daemon Base Path',
        'upload_size' => 'File Upload Size Limit',
        'location_id' => 'Location',
        'public' => 'Node Visibility',
        'host' => 'Database Host Server ID',
        'remote' => 'Remote Connection String',
        'database' => 'Database Name',
        'logo_file' => 'Logo File',
        'logo_url' => 'Logo URL',
    ],

    // Internal validation logic for Pterodactyl
    'internal' => [
        'variable_value' => ':env variable',
        'invalid_password' => 'The password provided was invalid for this account.',
    ],
];
