<?php

return [
    'location' => [
        'no_location_found' => 'No s\'ha pogut localitzar cap registre que coincideixi amb el codi curt proporcionat.',
        'ask_short' => 'Codi curt de la ubicació',
        'ask_long' => 'Descripció de la ubicació',
        'created' => 'S\'ha creat correctament una ubicació nova (:name) amb l\'ID :id.',
        'deleted' => 'S\'ha eliminat correctament la ubicació sol·licitada.',
    ],
    'user' => [
        'search_users' => 'Introdueix un nom d\'usuari, un ID d\'usuari o una adreça de correu electrònic',
        'select_search_user' => 'ID de l\'usuari que cal eliminar (introdueix \'0\' per tornar a cercar)',
        'deleted' => 'Usuari eliminat correctament del panell.',
        'confirm_delete' => 'Segur que vols eliminar aquest usuari del panell?',
        'no_users_found' => 'No s\'ha trobat cap usuari per al terme de cerca proporcionat.',
        'multiple_found' => 'S\'han trobat diversos comptes per a l\'usuari proporcionat; no es pot eliminar cap usuari a causa del paràmetre --no-interaction.',
        'ask_admin' => 'Aquest usuari és administrador?',
        'ask_email' => 'Adreça de correu electrònic',
        'ask_username' => 'Nom d\'usuari',
        'ask_name_first' => 'Nom',
        'ask_name_last' => 'Cognoms',
        'ask_password' => 'Contrasenya',
        'ask_password_tip' => 'Si vols crear un compte amb una contrasenya aleatòria enviada per correu electrònic a l\'usuari, torna a executar aquesta ordre (CTRL+C) i passa el paràmetre `--no-password`.',
        'ask_password_help' => 'Les contrasenyes han de tenir com a mínim 8 caràcters i contenir com a mínim una lletra majúscula i un número.',
        '2fa_help_text' => [
            'Aquesta ordre desactivarà l\'autenticació de doble factor del compte d\'un usuari si està activada. Només s\'hauria d\'utilitzar com a ordre de recuperació de compte si l\'usuari no pot accedir al seu compte.',
            'Si no és això el que volies fer, prem CTRL+C per sortir d\'aquest procés.',
        ],
        '2fa_disabled' => 'S\'ha desactivat l\'autenticació de doble factor per a :email.',
    ],
    'schedule' => [
        'output_line' => 'S\'està enviant la feina per a la primera tasca de `:schedule` (:hash).',
    ],
    'maintenance' => [
        'deleting_service_backup' => 'S\'està eliminant el fitxer de còpia de seguretat del servei :file.',
    ],
    'server' => [
        'rebuild_failed' => 'La sol·licitud de reconstrucció de ":name" (#:id) al node ":node" ha fallat amb l\'error: :message',
        'reinstall' => [
            'failed' => 'La sol·licitud de reinstal·lació de ":name" (#:id) al node ":node" ha fallat amb l\'error: :message',
            'confirm' => 'Estàs a punt de reinstal·lar un grup de servidors. Vols continuar?',
        ],
        'power' => [
            'confirm' => 'Estàs a punt d\'executar una acció de :action a :count servidors. Vols continuar?',
            'action_failed' => 'La sol·licitud d\'acció d\'alimentació per a ":name" (#:id) al node ":node" ha fallat amb l\'error: :message',
        ],
    ],
    'environment' => [
        'mail' => [
            'ask_smtp_host' => 'Servidor SMTP (p. ex. smtp.gmail.com)',
            'ask_smtp_port' => 'Port SMTP',
            'ask_smtp_username' => 'Nom d\'usuari SMTP',
            'ask_smtp_password' => 'Contrasenya SMTP',
            'ask_mailgun_domain' => 'Domini de Mailgun',
            'ask_mailgun_endpoint' => 'Punt de connexió de Mailgun',
            'ask_mailgun_secret' => 'Secret de Mailgun',
            'ask_mandrill_secret' => 'Secret de Mandrill',
            'ask_postmark_username' => 'Clau d\'API de Postmark',
            'ask_driver' => 'Quin controlador s\'hauria d\'utilitzar per enviar correus electrònics?',
            'ask_mail_from' => 'Adreça de correu electrònic des de la qual s\'han d\'originar els correus',
            'ask_mail_name' => 'Nom que hauria d\'aparèixer com a remitent dels correus',
            'ask_encryption' => 'Mètode de xifratge que cal utilitzar',
        ],
    ],
];
