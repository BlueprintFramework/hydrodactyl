<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Anmeldung fehlgeschlagen',
        'success' => 'Angemeldet',
        'password-reset' => 'Passwort zurückgesetzt',
        'reset-password' => 'Passwortzurücksetzung angefordert',
        'checkpoint' => 'Zwei-Faktor-Authentifizierung angefordert',
        'recovery-token' => 'Zwei-Faktor-Wiederherstellungstoken verwendet',
        'token' => 'Zwei-Faktor-Challenge gelöst',
        'ip-blocked' => 'Anfrage von nicht gelisteter IP-Adresse für :identifier blockiert',
        'sftp' => [
            'fail' => 'SFTP-Anmeldung fehlgeschlagen',
        ],
    ],
    'backup' => [
        'bulk_delete' => ':backup_count Backups gelöscht',
        'create' => 'Backup :backup_name erstellt',
        'delete' => 'Backup :backup_name gelöscht',
        'delete_all' => 'Alle :backup_count Backups gelöscht',
        'download' => 'Backup :backup_name heruntergeladen',
        'lock' => 'Sperre für Backup :backup_name umgeschaltet',
        'rename' => 'Backup :old_name in :new_name umbenannt',
        'restore' => 'Backup :backup_name wiederhergestellt',
    ],
    'event' => [
        'password-reset' => 'Passwortzurücksetzung angefordert',
    ],
    'job' => [
        'cancel' => 'Job :job_id abgebrochen',
        'create' => 'Job vom Typ :job_type (:job_id) erstellt',
    ],
    'setup' => [
        'admin-created' => 'Erstes Administrator-Konto über den Einrichtungsablauf erstellt',
    ],
    'user' => [
        'account' => [
            'email-changed' => 'E-Mail-Adresse von :old zu :new geändert',
            'password-changed' => 'Passwort geändert',
        ],
        'api-key' => [
            'create' => 'Neuer API-Schlüssel :identifier erstellt',
            'delete' => 'API-Schlüssel :identifier gelöscht',
        ],
        'ssh-key' => [
            'create' => 'SSH-Schlüssel :fingerprint zum Konto hinzugefügt',
            'delete' => 'SSH-Schlüssel :fingerprint vom Konto entfernt',
        ],
        'two-factor' => [
            'create' => 'Zwei-Faktor-Authentifizierung aktiviert',
            'delete' => 'Zwei-Faktor-Authentifizierung deaktiviert',
        ],
    ],
    'server' => [
        'reinstall' => 'Server neu installiert',
        'console' => [
            'command' => ':command auf dem Server ausgeführt',
        ],
        'power' => [
            'start' => 'Server gestartet',
            'stop' => 'Server gestoppt',
            'restart' => 'Server neu gestartet',
            'kill' => 'Server-Prozess beendet',
        ],
        'backup' => [
            'download' => 'Backup :name heruntergeladen',
            'delete' => 'Backup :name gelöscht',
            'restore' => 'Backup :name wiederhergestellt (gelöschte Dateien: :truncate)',
            'restore-complete' => 'Wiederherstellung des Backups :name abgeschlossen',
            'restore-failed' => 'Wiederherstellung des Backups :name fehlgeschlagen',
            'start' => 'Neues Backup :name gestartet',
            'complete' => 'Backup :name als abgeschlossen markiert',
            'fail' => 'Backup :name als fehlgeschlagen markiert',
            'lock' => 'Backup :name gesperrt',
            'unlock' => 'Backup :name entsperrt',
            'delete_all' => 'Alle :count Backups gelöscht',
            'bulk_delete' => ':count Backups gelöscht',
            'software-change' => 'Backup für Softwarewechsel :backup_name erstellt',
        ],
        'database' => [
            'create' => 'Neue Datenbank :name erstellt',
            'rotate-password' => 'Passwort für Datenbank :name geändert',
            'delete' => 'Datenbank :name gelöscht',
        ],
        'file' => [
            'compress_one' => ':directory:file komprimiert',
            'compress_other' => ':count Dateien in :directory komprimiert',
            'read' => 'Inhalt von :file angesehen',
            'copy' => 'Kopie von :file erstellt',
            'create-directory' => 'Ordner :directory:name erstellt',
            'decompress' => ':files in :directory entpackt',
            'delete_one' => ':directory:files.0 gelöscht',
            'delete_other' => ':count Dateien in :directory gelöscht',
            'download' => ':file heruntergeladen',
            'pull' => 'Remote-Datei von :url nach :directory heruntergeladen',
            'rename_one' => ':directory:files.0.from in :directory:files.0.to umbenannt',
            'rename_other' => ':count Dateien in :directory umbenannt',
            'write' => 'Neuen Inhalt in :file geschrieben',
            'upload' => 'Datei-Upload gestartet',
            'uploaded' => ':directory:file hochgeladen',
            'compress' => ':count Dateien in :directory komprimiert',
            'delete' => ':count Dateien in :directory gelöscht',
            'delete-trash' => ':count Dateien endgültig aus dem Papierkorb gelöscht',
            'rename' => ':count Dateien in :directory umbenannt',
            'restore-trash' => ':count Dateien aus dem Papierkorb wiederhergestellt',
            'trash' => ':count Dateien in den Papierkorb verschoben',
        ],
        'mod' => [
            'install' => 'Mod installiert',
        ],
        'modrinth' => [
            'install' => 'Mod :project (:version) installiert',
            'install-modpack' => 'Modpack :project_title (:version) installiert',
            'uninstall' => 'Mod :project deinstalliert',
            'update' => 'Mod :project auf :version aktualisiert',
            'update-all' => ':count Mods aktualisiert',
        ],
        'sftp' => [
            'denied' => 'SFTP-Zugriff aufgrund von Berechtigungen blockiert',
            'create' => ':count Dateien über SFTP erstellt',
            'create-directory' => ':count Ordner über SFTP erstellt',
            'delete' => ':count Dateien über SFTP gelöscht',
            'rename' => ':count Dateien über SFTP umbenannt oder verschoben',
            'write' => ':count Dateien über SFTP geändert',
            'create_one' => ':files.0 erstellt',
            'create_other' => ':count neue Dateien erstellt',
            'write_one' => 'Inhalt von :files.0 geändert',
            'write_other' => 'Inhalt von :count Dateien geändert',
            'delete_one' => ':files.0 gelöscht',
            'delete_other' => ':count Dateien gelöscht',
            'create-directory_one' => 'Ordner :files.0 erstellt',
            'create-directory_other' => ':count Ordner erstellt',
            'rename_one' => ':files.0.from in :files.0.to umbenannt',
            'rename_other' => ':count Dateien umbenannt oder verschoben',
        ],
        'allocation' => [
            'create' => ':allocation zum Server hinzugefügt',
            'notes' => 'Notizen für :allocation von :old zu :new aktualisiert',
            'primary' => ':allocation als primäre Server-Belegung festgelegt',
            'delete' => 'Belegung :allocation gelöscht',
        ],
        'schedule' => [
            'create' => 'Zeitplan :name erstellt',
            'update' => 'Zeitplan :name aktualisiert',
            'execute' => 'Zeitplan :name manuell ausgeführt',
            'delete' => 'Zeitplan :name gelöscht',
        ],
        'task' => [
            'create' => 'Neue Aufgabe :action für den Zeitplan :name erstellt',
            'update' => 'Aufgabe :action für den Zeitplan :name aktualisiert',
            'delete' => 'Aufgabe für den Zeitplan :name gelöscht',
        ],
        'settings' => [
            'rename' => 'Server von :old in :new umbenannt',
            'description' => 'Serverbeschreibung von :old zu :new geändert',
            'egg' => 'Server-Egg von :original_egg_id zu :new_egg_id geändert',
            'egg-preview' => 'Vorschau eines Egg-Wechsels zu :preview_egg_id angezeigt',
        ],
        'software' => [
            'change-queued' => 'Softwarewechsel von Egg :from_egg auf :to_egg eingereiht',
            'change-started' => 'Softwarewechsel von Egg :from_egg auf :to_egg gestartet',
            'changed' => 'Softwarewechsel abgeschlossen',
            'change-failed' => 'Softwarewechsel fehlgeschlagen: :error',
        ],
        'startup' => [
            'edit' => 'Variable :variable von :old zu :new geändert',
            'image' => 'Docker-Image des Servers von :old zu :new aktualisiert',
            'command' => 'Startbefehl von :old zu :new geändert',
            'image-reverted' => 'Docker-Image von :old zu :new zurückgesetzt',
        ],
        'subuser' => [
            'create' => ':email als Subbenutzer hinzugefügt',
            'update' => 'Subbenutzer-Berechtigungen für :email aktualisiert',
            'delete' => ':email als Subbenutzer entfernt',
        ],
        'files' => [
            'software-change-wipe' => ':files_deleted Dateien für den Softwarewechsel gelöscht',
        ],
        'subdomain' => [
            'deleted-egg-change' => 'Subdomain :subdomain gelöscht, da sie mit dem neuen Egg nicht kompatibel ist',
        ],
    ],
];
