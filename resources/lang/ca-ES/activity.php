<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Inici de sessió fallit',
        'success' => 'Ha iniciat sessió',
        'password-reset' => 'Contrasenya restablerta',
        'reset-password' => 'Ha sol·licitat restablir la contrasenya',
        'checkpoint' => 'S\'ha sol·licitat l\'autenticació de doble factor',
        'recovery-token' => 'Ha utilitzat un testimoni de recuperació del doble factor',
        'token' => 'Ha resolt el repte del doble factor',
        'ip-blocked' => 'S\'ha bloquejat una sol·licitud des d\'una adreça IP no llistada per a :identifier',
        'sftp' => [
            'fail' => 'Inici de sessió SFTP fallit',
        ],
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Ha canviat el correu electrònic de :old a :new',
            'password-changed' => 'Ha canviat la contrasenya',
        ],
        'api-key' => [
            'create' => 'Ha creat una clau d\'API nova :identifier',
            'delete' => 'Ha eliminat la clau d\'API :identifier',
        ],
        'ssh-key' => [
            'create' => 'Ha afegit la clau SSH :fingerprint al compte',
            'delete' => 'Ha eliminat la clau SSH :fingerprint del compte',
        ],
        'two-factor' => [
            'create' => 'Ha activat l\'autenticació de doble factor',
            'delete' => 'Ha desactivat l\'autenticació de doble factor',
        ],
    ],
    'server' => [
        'reinstall' => 'Ha reinstal·lat el servidor',
        'console' => [
            'command' => 'Ha executat ":command" al servidor',
        ],
        'power' => [
            'start' => 'Ha iniciat el servidor',
            'stop' => 'Ha aturat el servidor',
            'restart' => 'Ha reiniciat el servidor',
            'kill' => 'Ha forçat l\'aturada del procés del servidor',
        ],
        'backup' => [
            'download' => 'Ha descarregat la còpia de seguretat :name',
            'delete' => 'Ha eliminat la còpia de seguretat :name',
            'restore' => 'Ha restaurat la còpia de seguretat :name (fitxers eliminats: :truncate)',
            'restore-complete' => 'Ha completat la restauració de la còpia de seguretat :name',
            'restore-failed' => 'No s\'ha pogut completar la restauració de la còpia de seguretat :name',
            'start' => 'Ha iniciat una còpia de seguretat nova :name',
            'complete' => 'Ha marcat la còpia de seguretat :name com a completada',
            'fail' => 'Ha marcat la còpia de seguretat :name com a fallida',
            'lock' => 'Ha bloquejat la còpia de seguretat :name',
            'unlock' => 'Ha desbloquejat la còpia de seguretat :name',
        ],
        'database' => [
            'create' => 'Ha creat una base de dades nova :name',
            'rotate-password' => 'S\'ha renovat la contrasenya de la base de dades :name',
            'delete' => 'Ha eliminat la base de dades :name',
        ],
        'file' => [
            'compress_one' => 'Ha comprimit :directory:file',
            'compress_other' => 'Ha comprimit :count fitxers a :directory',
            'read' => 'Ha visualitzat el contingut de :file',
            'copy' => 'Ha creat una còpia de :file',
            'create-directory' => 'Ha creat el directori :directory:name',
            'decompress' => 'Ha descomprimit :files a :directory',
            'delete_one' => 'Ha eliminat :directory:files.0',
            'delete_other' => 'Ha eliminat :count fitxers a :directory',
            'download' => 'Ha descarregat :file',
            'pull' => 'Ha descarregat un fitxer remot de :url a :directory',
            'rename_one' => 'Ha canviat el nom de :directory:files.0.from a :directory:files.0.to',
            'rename_other' => 'Ha canviat el nom de :count fitxers a :directory',
            'write' => 'Ha escrit contingut nou a :file',
            'upload' => 'Ha iniciat la pujada d\'un fitxer',
            'uploaded' => 'Ha pujat :directory:file',
        ],
        'sftp' => [
            'denied' => 'Ha bloquejat l\'accés SFTP a causa dels permisos',
            'create_one' => 'Ha creat :files.0',
            'create_other' => 'Ha creat :count fitxers nous',
            'write_one' => 'Ha modificat el contingut de :files.0',
            'write_other' => 'Ha modificat el contingut de :count fitxers',
            'delete_one' => 'Ha eliminat :files.0',
            'delete_other' => 'Ha eliminat :count fitxers',
            'create-directory_one' => 'Ha creat el directori :files.0',
            'create-directory_other' => 'Ha creat :count directoris',
            'rename_one' => 'Ha canviat el nom de :files.0.from a :files.0.to',
            'rename_other' => 'Ha canviat el nom o mogut :count fitxers',
        ],
        'allocation' => [
            'create' => 'Ha afegit :allocation al servidor',
            'notes' => 'Ha actualitzat les notes de :allocation de ":old" a ":new"',
            'primary' => 'Ha establert :allocation com a assignació principal del servidor',
            'delete' => 'Ha eliminat l\'assignació :allocation',
        ],
        'schedule' => [
            'create' => 'Ha creat la programació :name',
            'update' => 'Ha actualitzat la programació :name',
            'execute' => 'Ha executat manualment la programació :name',
            'delete' => 'Ha eliminat la programació :name',
        ],
        'task' => [
            'create' => 'Ha creat una tasca nova ":action" per a la programació :name',
            'update' => 'Ha actualitzat la tasca ":action" de la programació :name',
            'delete' => 'Ha eliminat una tasca de la programació :name',
        ],
        'settings' => [
            'rename' => 'Ha canviat el nom del servidor de :old a :new',
            'description' => 'Ha canviat la descripció del servidor de :old a :new',
        ],
        'startup' => [
            'edit' => 'Ha canviat la variable :variable de ":old" a ":new"',
            'image' => 'Ha actualitzat la imatge de Docker del servidor de :old a :new',
        ],
        'subuser' => [
            'create' => 'Ha afegit :email com a subusuari',
            'update' => 'Ha actualitzat els permisos de subusuari de :email',
            'delete' => 'Ha eliminat :email com a subusuari',
        ],
    ],
];
