<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Inicio de sesión fallido',
        'success' => 'Inició sesión',
        'password-reset' => 'Contraseña restablecida',
        'reset-password' => 'Solicitó restablecer la contraseña',
        'checkpoint' => 'Se solicitó la autenticación en dos pasos',
        'recovery-token' => 'Usó un token de recuperación de la autenticación en dos pasos',
        'token' => 'Resolvió el desafío de autenticación en dos pasos',
        'ip-blocked' => 'Se bloqueó una solicitud desde una dirección IP no listada para :identifier',
        'sftp' => [
            'fail' => 'Inicio de sesión SFTP fallido',
        ],
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Cambió el correo electrónico de :old a :new',
            'password-changed' => 'Cambió la contraseña',
        ],
        'api-key' => [
            'create' => 'Creó una nueva clave de API :identifier',
            'delete' => 'Eliminó la clave de API :identifier',
        ],
        'ssh-key' => [
            'create' => 'Añadió la clave SSH :fingerprint a la cuenta',
            'delete' => 'Eliminó la clave SSH :fingerprint de la cuenta',
        ],
        'two-factor' => [
            'create' => 'Activó la autenticación en dos pasos',
            'delete' => 'Desactivó la autenticación en dos pasos',
        ],
    ],
    'server' => [
        'reinstall' => 'Reinstaló el servidor',
        'console' => [
            'command' => 'Ejecutó ":command" en el servidor',
        ],
        'power' => [
            'start' => 'Inició el servidor',
            'stop' => 'Detuvo el servidor',
            'restart' => 'Reinició el servidor',
            'kill' => 'Forzó la detención del proceso del servidor',
        ],
        'backup' => [
            'download' => 'Descargó la copia de seguridad :name',
            'delete' => 'Eliminó la copia de seguridad :name',
            'restore' => 'Restauró la copia de seguridad :name (archivos eliminados: :truncate)',
            'restore-complete' => 'Completó la restauración de la copia de seguridad :name',
            'restore-failed' => 'No se pudo completar la restauración de la copia de seguridad :name',
            'start' => 'Inició una nueva copia de seguridad :name',
            'complete' => 'Marcó la copia de seguridad :name como completada',
            'fail' => 'Marcó la copia de seguridad :name como fallida',
            'lock' => 'Bloqueó la copia de seguridad :name',
            'unlock' => 'Desbloqueó la copia de seguridad :name',
        ],
        'database' => [
            'create' => 'Creó una nueva base de datos :name',
            'rotate-password' => 'Se rotó la contraseña de la base de datos :name',
            'delete' => 'Eliminó la base de datos :name',
        ],
        'file' => [
            'compress_one' => 'Comprimió :directory:file',
            'compress_other' => 'Comprimió :count archivos en :directory',
            'read' => 'Vio el contenido de :file',
            'copy' => 'Creó una copia de :file',
            'create-directory' => 'Creó el directorio :directory:name',
            'decompress' => 'Descomprimió :files en :directory',
            'delete_one' => 'Eliminó :directory:files.0',
            'delete_other' => 'Eliminó :count archivos en :directory',
            'download' => 'Descargó :file',
            'pull' => 'Descargó un archivo remoto de :url a :directory',
            'rename_one' => 'Renombró :directory:files.0.from a :directory:files.0.to',
            'rename_other' => 'Renombró :count archivos en :directory',
            'write' => 'Escribió contenido nuevo en :file',
            'upload' => 'Inició la subida de un archivo',
            'uploaded' => 'Subió :directory:file',
        ],
        'sftp' => [
            'denied' => 'Bloqueó el acceso SFTP debido a los permisos',
            'create_one' => 'Creó :files.0',
            'create_other' => 'Creó :count archivos nuevos',
            'write_one' => 'Modificó el contenido de :files.0',
            'write_other' => 'Modificó el contenido de :count archivos',
            'delete_one' => 'Eliminó :files.0',
            'delete_other' => 'Eliminó :count archivos',
            'create-directory_one' => 'Creó el directorio :files.0',
            'create-directory_other' => 'Creó :count directorios',
            'rename_one' => 'Renombró :files.0.from a :files.0.to',
            'rename_other' => 'Renombró o movió :count archivos',
        ],
        'allocation' => [
            'create' => 'Añadió :allocation al servidor',
            'notes' => 'Actualizó las notas de :allocation de ":old" a ":new"',
            'primary' => 'Estableció :allocation como la asignación principal del servidor',
            'delete' => 'Eliminó la asignación :allocation',
        ],
        'schedule' => [
            'create' => 'Creó la tarea programada :name',
            'update' => 'Actualizó la tarea programada :name',
            'execute' => 'Ejecutó manualmente la tarea programada :name',
            'delete' => 'Eliminó la tarea programada :name',
        ],
        'task' => [
            'create' => 'Creó una nueva tarea ":action" para la tarea programada :name',
            'update' => 'Actualizó la tarea ":action" para la tarea programada :name',
            'delete' => 'Eliminó una tarea de la tarea programada :name',
        ],
        'settings' => [
            'rename' => 'Renombró el servidor de :old a :new',
            'description' => 'Cambió la descripción del servidor de :old a :new',
        ],
        'startup' => [
            'edit' => 'Cambió la variable :variable de ":old" a ":new"',
            'image' => 'Actualizó la imagen de Docker del servidor de :old a :new',
        ],
        'subuser' => [
            'create' => 'Añadió :email como subusuario',
            'update' => 'Actualizó los permisos de subusuario de :email',
            'delete' => 'Eliminó :email como subusuario',
        ],
    ],
];
