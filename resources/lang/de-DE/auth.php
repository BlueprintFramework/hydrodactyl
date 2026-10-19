<?php

return [
    'sign_in' => 'Anmelden',
    'go_to_login' => 'Zur Anmeldung',
    'failed' => 'Es wurde kein Konto mit diesen Zugangsdaten gefunden.',

    'forgot_password' => [
        'label' => 'Passwort vergessen?',
        'label_help' => 'Geben Sie die E-Mail-Adresse Ihres Kontos ein, um Anweisungen zum Zurücksetzen Ihres Passworts zu erhalten.',
        'button' => 'Konto wiederherstellen',
    ],

    'reset_password' => [
        'button' => 'Zurücksetzen und anmelden',
    ],

    'two_factor' => [
        'label' => '2-Faktor-Token',
        'label_help' => 'Dieses Konto erfordert eine zweite Authentifizierungsebene, um fortzufahren. Bitte geben Sie den von Ihrem Gerät erzeugten Code ein, um diese Anmeldung abzuschließen.',
        'checkpoint_failed' => 'Das Token der Zwei-Faktor-Authentifizierung war ungültig.',
        'recovery_token_invalid' => 'Das angegebene Wiederherstellungstoken ist nicht gültig.',
    ],

    'throttle' => 'Zu viele Anmeldeversuche. Bitte versuchen Sie es in :seconds Sekunden erneut.',
    'password_requirements' => 'Das Passwort muss mindestens 8 Zeichen lang sein und sollte einzigartig für diese Website sein.',
    '2fa_must_be_enabled' => 'Der Administrator hat für die Nutzung des Panels die Aktivierung der Zwei-Faktor-Authentifizierung für Ihr Konto verpflichtend gemacht.',
];
