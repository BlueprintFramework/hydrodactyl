<?php

return [
    'server_installed' => [
        'subject' => 'Server installiert',
        'greeting' => 'Hallo :user.',
        'installed' => 'Ihr Server wurde fertig installiert und steht Ihnen jetzt zur Verfügung.',
        'server_name' => 'Servername: :server',
        'action' => 'Anmelden und loslegen',
    ],
    'added_to_server' => [
        'subject' => 'Zum Server hinzugefügt',
        'greeting' => 'Hallo :user!',
        'added' => 'Sie wurden als Subbenutzer für den folgenden Server hinzugefügt und haben dadurch eine gewisse Kontrolle über den Server.',
        'server_name' => 'Servername: :server',
        'action' => 'Server besuchen',
    ],
    'removed_from_server' => [
        'subject' => 'Vom Server entfernt',
        'greeting' => 'Hallo :user.',
        'removed' => 'Sie wurden als Subbenutzer für den folgenden Server entfernt.',
        'server_name' => 'Servername: :server',
        'action' => 'Panel besuchen',
    ],
    'send_password_reset' => [
        'subject' => 'Passwort zurücksetzen',
        'line' => 'Sie erhalten diese E-Mail, weil wir eine Anfrage zum Zurücksetzen des Passworts für Ihr Konto erhalten haben.',
        'action' => 'Passwort zurücksetzen',
        'no_action' => 'Wenn Sie keine Passwortzurücksetzung angefordert haben, ist keine weitere Aktion erforderlich.',
    ],
    'account_created' => [
        'subject' => 'Konto erstellt',
        'greeting' => 'Hallo :user!',
        'created' => 'Sie erhalten diese E-Mail, weil für Sie ein Konto auf :app erstellt wurde.',
        'username' => 'Benutzername: :username',
        'email' => 'E-Mail: :email',
        'action' => 'Konto einrichten',
    ],
    'mail_tested' => [
        'subject' => 'Hydrodactyl Testnachricht',
        'greeting' => 'Hallo :user!',
        'line' => 'Dies ist ein Test des Hydrodactyl-Mail-Systems. Alles ist einsatzbereit!',
    ],
];
