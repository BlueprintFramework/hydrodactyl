<?php

return [
    '400' => [
        'title' => 'Ungültige Anfrage',
        'message' => 'Der Server konnte die Anfrage nicht verarbeiten.',
    ],
    '401' => [
        'title' => 'Nicht autorisiert',
        'message' => 'Sie müssen angemeldet sein, um auf diese Ressource zuzugreifen.',
    ],
    '403' => [
        'title' => 'Zugriff verweigert',
        'message' => 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.',
    ],
    '404' => [
        'title' => 'Seite nicht gefunden',
        'message' => 'Die Seite, nach der Sie suchen, existiert nicht oder wurde verschoben.',
    ],
    '419' => [
        'title' => 'Seite abgelaufen',
        'message' => 'Ihre Sitzung ist abgelaufen. Aktualisieren Sie die Seite und versuchen Sie es erneut.',
    ],
    '429' => [
        'title' => 'Zu viele Anfragen',
        'message' => 'Sie haben zu viele Anfragen gestellt. Versuchen Sie es in einem Moment erneut.',
    ],
    '500' => [
        'title' => 'Serverfehler',
        'message' => 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    ],
    '503' => [
        'title' => 'Dienst nicht verfügbar',
        'message' => 'Der Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
    ],
    'back' => 'Zurück zum Panel',
];
