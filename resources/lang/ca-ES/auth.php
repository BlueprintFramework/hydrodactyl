<?php

return [
    'sign_in' => 'Inicia sessió',
    'go_to_login' => 'Ves a l\'inici de sessió',
    'failed' => 'No s\'ha trobat cap compte que coincideixi amb aquestes credencials.',

    'forgot_password' => [
        'label' => 'Has oblidat la contrasenya?',
        'label_help' => 'Introdueix l\'adreça de correu electrònic del teu compte per rebre instruccions sobre com restablir la contrasenya.',
        'button' => 'Recupera el compte',
    ],

    'reset_password' => [
        'button' => 'Restableix i inicia sessió',
    ],

    'two_factor' => [
        'label' => 'Testimoni de doble factor',
        'label_help' => 'Aquest compte requereix una segona capa d\'autenticació per continuar. Introdueix el codi generat pel teu dispositiu per completar aquest inici de sessió.',
        'checkpoint_failed' => 'El testimoni d\'autenticació de doble factor no era vàlid.',
    ],

    'throttle' => 'Massa intents d\'inici de sessió. Torna-ho a provar d\'aquí a :seconds segons.',
    'password_requirements' => 'La contrasenya ha de tenir com a mínim 8 caràcters i hauria de ser única per a aquest lloc.',
    '2fa_must_be_enabled' => 'L\'administrador ha exigit que l\'autenticació de doble factor estigui activada per al teu compte per poder utilitzar el panell.',
];
