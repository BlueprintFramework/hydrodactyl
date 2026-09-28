<?php

return [
    'exceptions' => [
        'user_has_servers' => 'Cannot delete a user with active servers attached to their account. Please delete their servers before continuing.',
    ],
    'index' => [
        'can_access' => 'Can Access',
        'can_access_tooltip' => 'Servers that this user can access because they are marked as a subuser.',
        'create_new' => 'Create New',
        'list' => 'User List',
        'servers_owned' => 'Servers Owned',
        'servers_owned_tooltip' => 'Servers that this user is marked as the owner of.',
        'subtitle' => 'All registered users on the system.',
        'title' => 'List Users',
    ],
    'notices' => [
        'account_created' => 'Account has been created successfully.',
        'account_updated' => 'Account has been successfully updated.',
    ],
];
