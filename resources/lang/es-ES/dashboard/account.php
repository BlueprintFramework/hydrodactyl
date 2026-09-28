<?php

return [
    'email' => [
        'title' => 'Actualiza tu correo electrónico',
        'updated' => 'Tu dirección de correo electrónico se ha actualizado.',
    ],
    'password' => [
        'title' => 'Cambia tu contraseña',
        'requirements' => 'Tu nueva contraseña debe tener al menos 8 caracteres.',
        'updated' => 'Tu contraseña se ha actualizado.',
    ],
    'two_factor' => [
        'button' => 'Configurar la autenticación en dos pasos',
        'disabled' => 'La autenticación en dos pasos se ha desactivado en tu cuenta. Ya no se te pedirá un token al iniciar sesión.',
        'enabled' => '¡La autenticación en dos pasos se ha activado en tu cuenta! A partir de ahora, al iniciar sesión, se te pedirá el código generado por tu dispositivo.',
        'invalid' => 'El token proporcionado no era válido.',
        'setup' => [
            'title' => 'Configurar la autenticación en dos pasos',
            'help' => '¿No puedes escanear el código? Introduce el código que aparece a continuación en tu aplicación:',
            'field' => 'Introduce el token',
        ],
        'disable' => [
            'title' => 'Desactivar la autenticación en dos pasos',
            'field' => 'Introduce el token',
        ],
    ],
];
