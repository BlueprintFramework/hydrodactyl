<?php

return [
    'sign_in' => 'Iniciar sesión',
    'go_to_login' => 'Ir al inicio de sesión',
    'failed' => 'No se encontró ninguna cuenta que coincida con esas credenciales.',

    'forgot_password' => [
        'label' => '¿Has olvidado tu contraseña?',
        'label_help' => 'Introduce la dirección de correo electrónico de tu cuenta para recibir instrucciones sobre cómo restablecer tu contraseña.',
        'button' => 'Recuperar cuenta',
    ],

    'reset_password' => [
        'button' => 'Restablecer e iniciar sesión',
    ],

    'two_factor' => [
        'label' => 'Token de autenticación en dos pasos',
        'label_help' => 'Esta cuenta requiere una segunda capa de autenticación para continuar. Introduce el código generado por tu dispositivo para completar este inicio de sesión.',
        'checkpoint_failed' => 'El token de autenticación en dos pasos no era válido.',
    ],

    'throttle' => 'Demasiados intentos de inicio de sesión. Vuelve a intentarlo en :seconds segundos.',
    'password_requirements' => 'La contraseña debe tener al menos 8 caracteres y ser única para este sitio.',
    '2fa_must_be_enabled' => 'El administrador ha exigido que la autenticación en dos pasos esté activada en tu cuenta para poder usar el panel.',
];
