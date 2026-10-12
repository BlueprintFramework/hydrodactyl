<?php

/*
|--------------------------------------------------------------------------
| Server Templates
|--------------------------------------------------------------------------
|
| Pre-configured resource/limit presets used by the admin "Create Server"
| wizard. Selecting a template fills in everything except the node, egg and
| other deployment-specific values, which default to the first available
| option. These are intentionally static for now; they can be moved into the
| database later without changing the shape consumed by the interface.
|
*/

return [
    'templates' => [
        [
            'id' => 'minimal',
            'name' => 'Minimal',
            'description' => 'A small server for testing or lightweight bots.',
            'memory' => 512,
            'overhead_memory' => 0,
            'swap' => 0,
            'disk' => 2048,
            'cpu' => 100,
            'threads' => null,
            'io' => 500,
            'database_limit' => 0,
            'allocation_limit' => 0,
            'backup_limit' => 1,
            'backup_storage_limit' => 1024,
            'oom_disabled' => true,
            'exclude_from_resource_calculation' => false,
            'skip_scripts' => false,
            'start_on_completion' => false,
        ],
        [
            'id' => 'standard',
            'name' => 'Standard',
            'description' => 'A balanced server suitable for most game servers.',
            'memory' => 2048,
            'overhead_memory' => 0,
            'swap' => 0,
            'disk' => 10240,
            'cpu' => 200,
            'threads' => null,
            'io' => 500,
            'database_limit' => 1,
            'allocation_limit' => 1,
            'backup_limit' => 2,
            'backup_storage_limit' => 5120,
            'oom_disabled' => true,
            'exclude_from_resource_calculation' => false,
            'skip_scripts' => false,
            'start_on_completion' => false,
        ],
        [
            'id' => 'performance',
            'name' => 'Performance',
            'description' => 'A high-resource server for demanding workloads.',
            'memory' => 8192,
            'overhead_memory' => 0,
            'swap' => 0,
            'disk' => 40960,
            'cpu' => 400,
            'threads' => null,
            'io' => 500,
            'database_limit' => 3,
            'allocation_limit' => 3,
            'backup_limit' => 5,
            'backup_storage_limit' => 20480,
            'oom_disabled' => true,
            'exclude_from_resource_calculation' => false,
            'skip_scripts' => false,
            'start_on_completion' => false,
        ],
    ],
];
