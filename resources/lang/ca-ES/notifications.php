<?php

return [
    'server_installed' => [
        'subject' => 'Servidor instal·lat',
        'greeting' => 'Hola :user.',
        'installed' => 'El teu servidor ha acabat d\'instal·lar-se i ja està a punt perquè el facis servir.',
        'server_name' => 'Nom del servidor: :server',
        'action' => 'Inicia sessió i comença a utilitzar-lo',
    ],
    'added_to_server' => [
        'subject' => 'Afegit a un servidor',
        'greeting' => 'Hola :user!',
        'added' => 'T\'han afegit com a subusuari del servidor següent, la qual cosa et permet cert control sobre el servidor.',
        'server_name' => 'Nom del servidor: :server',
        'action' => 'Visita el servidor',
    ],
    'removed_from_server' => [
        'subject' => 'Eliminat d\'un servidor',
        'greeting' => 'Hola :user.',
        'removed' => 'T\'han eliminat com a subusuari del servidor següent.',
        'server_name' => 'Nom del servidor: :server',
        'action' => 'Visita el panell',
    ],
    'send_password_reset' => [
        'subject' => 'Restableix la contrasenya',
        'line' => 'Reps aquest correu electrònic perquè hem rebut una sol·licitud de restabliment de contrasenya per al teu compte.',
        'action' => 'Restableix la contrasenya',
        'no_action' => 'Si no has sol·licitat un restabliment de contrasenya, no cal fer cap acció addicional.',
    ],
    'account_created' => [
        'subject' => 'Compte creat',
        'greeting' => 'Hola :user!',
        'created' => 'Reps aquest correu electrònic perquè s\'ha creat un compte per a tu a :app.',
        'username' => 'Nom d\'usuari: :username',
        'email' => 'Correu electrònic: :email',
        'action' => 'Configura el teu compte',
    ],
    'mail_tested' => [
        'subject' => 'Missatge de prova de Hydrodactyl',
        'greeting' => 'Hola :user!',
        'line' => 'Aquesta és una prova del sistema de correu de Hydrodactyl. Tot a punt!',
    ],
];
