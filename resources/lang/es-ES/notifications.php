<?php

return [
    'server_installed' => [
        'subject' => 'Servidor instalado',
        'greeting' => 'Hola :user.',
        'installed' => 'Tu servidor ha terminado de instalarse y ya está listo para que lo uses.',
        'server_name' => 'Nombre del servidor: :server',
        'action' => 'Inicia sesión y comienza a usarlo',
    ],
    'added_to_server' => [
        'subject' => 'Añadido a un servidor',
        'greeting' => '¡Hola :user!',
        'added' => 'Se te ha añadido como subusuario del siguiente servidor, lo que te permite cierto control sobre él.',
        'server_name' => 'Nombre del servidor: :server',
        'action' => 'Visitar servidor',
    ],
    'removed_from_server' => [
        'subject' => 'Eliminado de un servidor',
        'greeting' => 'Hola :user.',
        'removed' => 'Se te ha eliminado como subusuario del siguiente servidor.',
        'server_name' => 'Nombre del servidor: :server',
        'action' => 'Visitar el Panel',
    ],
    'send_password_reset' => [
        'subject' => 'Restablecer contraseña',
        'line' => 'Recibes este correo electrónico porque hemos recibido una solicitud de restablecimiento de contraseña para tu cuenta.',
        'action' => 'Restablecer contraseña',
        'no_action' => 'Si no solicitaste un restablecimiento de contraseña, no es necesario que hagas nada más.',
    ],
    'account_created' => [
        'subject' => 'Cuenta creada',
        'greeting' => '¡Hola :user!',
        'created' => 'Recibes este correo electrónico porque se ha creado una cuenta para ti en :app.',
        'username' => 'Nombre de usuario: :username',
        'email' => 'Correo electrónico: :email',
        'action' => 'Configura tu cuenta',
    ],
    'mail_tested' => [
        'subject' => 'Mensaje de prueba de Hydrodactyl',
        'greeting' => '¡Hola :user!',
        'line' => 'Esta es una prueba del sistema de correo de Hydrodactyl. ¡Todo listo!',
    ],
];
