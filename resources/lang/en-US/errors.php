<?php

return [
    '400' => [
        'title' => 'Bad Request',
        'message' => 'The server could not process the request.',
    ],
    '401' => [
        'title' => 'Unauthorized',
        'message' => 'You need to sign in to access this resource.',
    ],
    '403' => [
        'title' => 'Forbidden',
        'message' => 'You do not have permission to access this resource.',
    ],
    '404' => [
        'title' => 'Page Not Found',
        'message' => 'The page you are looking for does not exist or has been moved.',
    ],
    '419' => [
        'title' => 'Page Expired',
        'message' => 'Your session has expired. Refresh the page and try again.',
    ],
    '429' => [
        'title' => 'Too Many Requests',
        'message' => 'You have made too many requests. Try again in a few moments.',
    ],
    '500' => [
        'title' => 'Server Error',
        'message' => 'An unexpected error occurred. Please try again later.',
    ],
    '503' => [
        'title' => 'Service Unavailable',
        'message' => 'The service is temporarily unavailable. Please try again later.',
    ],
    'back' => 'Return to the panel',
];
