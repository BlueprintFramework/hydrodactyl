<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Introitus cessavit',
        'success' => 'Introitus successus',
        'password-reset' => 'Tessera restituta',
        'reset-password' => 'Restitutionem tesserae postulavit',
        'checkpoint' => 'Fides duabus clavibus postulata',
        'recovery-token' => 'Token recuperationis duarum clavium usus est',
        'token' => 'Problema duarum clavium solvit',
        'ip-blocked' => 'Postulatio ex inscriptione IP non descripta pro :identifier prohibita',
        'sftp' => [
            'fail' => 'Introitus SFTP cessavit',
        ],
    ],
    'backup' => [
        'bulk_delete' => ':backup_count exemplaria deleta',
        'create' => 'Exemplum :backup_name creatum',
        'delete' => 'Exemplum :backup_name deletum',
        'delete_all' => 'Omnia :backup_count exemplaria deleta',
        'download' => 'Exemplum :backup_name depromptum',
        'lock' => 'Clausura exemplari :backup_name commutata',
        'rename' => 'Exemplum :old_name in :new_name mutatum',
        'restore' => 'Exemplum :backup_name restitutum',
    ],
    'event' => [
        'password-reset' => 'Restitutionem tesserae postulavit',
    ],
    'job' => [
        'cancel' => 'Opus :job_id sublatum',
        'create' => 'Opus :job_type creatum (:job_id)',
    ],
    'setup' => [
        'admin-created' => 'Rationem administratoris primam per processum institutionis creavit',
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Epistulam electronicam ex :old in :new mutavit',
            'password-changed' => 'Tesseram mutavit',
        ],
        'api-key' => [
            'create' => 'Clavem API novam :identifier creavit',
            'delete' => 'Clavem API :identifier delevit',
        ],
        'ssh-key' => [
            'create' => 'Clavem SSH :fingerprint rationi adiecit',
            'delete' => 'Clavem SSH :fingerprint a ratione removit',
        ],
        'two-factor' => [
            'create' => 'Fidem duabus clavibus activavit',
            'delete' => 'Fidem duabus clavibus inactivam fecit',
        ],
    ],
    'server' => [
        'reinstall' => 'Serverum denuo installavit',
        'console' => [
            'command' => 'Mandatum :command in servero executum',
        ],
        'power' => [
            'start' => 'Server inchoatus est',
            'stop' => 'Server intermissus est',
            'restart' => 'Server denuo inchoatus est',
            'kill' => 'Processus serveri occisus est',
        ],
        'backup' => [
            'download' => 'Exemplum :name depromptum',
            'delete' => 'Exemplum :name deletum',
            'restore' => 'Exemplum :name restitutum (fasciculi deleti: :truncate)',
            'restore-complete' => 'Restitutio exemplaris :name peracta',
            'restore-failed' => 'Restitutio exemplaris :name perfici cessavit',
            'start' => 'Exemplum novum :name inchoatum',
            'complete' => 'Exemplum :name ut completum notatum',
            'fail' => 'Exemplum :name ut cessatum notatum',
            'lock' => 'Exemplum :name clausum',
            'unlock' => 'Exemplum :name apertum',
            'delete_all' => 'Omnia :count exemplaria deleta',
            'bulk_delete' => ':count exemplaria deleta',
            'software-change' => 'Exemplum mutationis programmatum :backup_name creatum',
        ],
        'database' => [
            'create' => 'Theca datorum nova :name creata',
            'rotate-password' => 'Tessera thecae datorum :name commutata',
            'delete' => 'Theca datorum :name deleta',
        ],
        'file' => [
            'compress_one' => 'Fasciculus :directory:file compressus',
            'compress_other' => ':count fasciculi in :directory compressi',
            'read' => 'Contenta fasciculi :file visa',
            'copy' => 'Exemplum fasciculi :file creatum',
            'create-directory' => 'Capsa :directory:name creata',
            'decompress' => ':files in :directory expansa',
            'delete_one' => 'Fasciculus :directory:files.0 deletus',
            'delete_other' => ':count fasciculi in :directory deleti',
            'download' => 'Fasciculus :file depromptus',
            'pull' => 'Fasciculus remotus ex :url in :directory depromptus',
            'rename_one' => ':directory:files.0.from in :directory:files.0.to mutatus',
            'rename_other' => ':count fasciculi in :directory mutati',
            'write' => 'Contentum novum in :file scriptum',
            'upload' => 'Immissio fasciculi coepta',
            'uploaded' => 'Fasciculus :directory:file immissus',
            'compress' => ':count fasciculi in :directory compressi',
            'delete' => ':count fasciculi in :directory deleti',
            'delete-trash' => ':count fasciculi e limo deleti',
            'rename' => ':count fasciculi in :directory mutati',
            'restore-trash' => ':count fasciculi e limo restituti',
            'trash' => ':count fasciculi in limum moti',
        ],
        'mod' => [
            'install' => 'Mod installatus',
        ],
        'modrinth' => [
            'install' => 'Mod :project (:version) installatus',
            'install-modpack' => 'Modpack :project_title (:version) installatus',
            'uninstall' => 'Mod :project deinstallatus',
            'update' => 'Mod :project in :version renovatus',
            'update-all' => ':count modi renovati',
        ],
        'sftp' => [
            'denied' => 'Accessus SFTP propter permissa prohibitus',
            'create' => ':count fasciculi per SFTP creati',
            'create-directory' => ':count capsae per SFTP creatae',
            'delete' => ':count fasciculi per SFTP deleti',
            'rename' => ':count fasciculi per SFTP mutati vel moti',
            'write' => ':count fasciculi per SFTP emendati',
            'create_one' => ':files.0 creatus',
            'create_other' => ':count fasciculi novi creati',
            'write_one' => 'Contenta :files.0 emendata',
            'write_other' => 'Contenta :count fasciculorum emendata',
            'delete_one' => ':files.0 deletus',
            'delete_other' => ':count fasciculi deleti',
            'create-directory_one' => 'Capsa :files.0 creata',
            'create-directory_other' => ':count capsae creatae',
            'rename_one' => ':files.0.from in :files.0.to mutatus',
            'rename_other' => ':count fasciculi mutati vel moti',
        ],
        'allocation' => [
            'create' => 'Attributio :allocation servero adiecta',
            'notes' => 'Adnotationes pro :allocation ex :old in :new renovatae',
            'primary' => 'Attributio :allocation ut primaria serveri constituta',
            'delete' => 'Attributio :allocation deleta',
        ],
        'schedule' => [
            'create' => 'Ordo temporum :name creatus',
            'update' => 'Ordo temporum :name renovatus',
            'execute' => 'Ordo temporum :name manu executus',
            'delete' => 'Ordo temporum :name deletus',
        ],
        'task' => [
            'create' => 'Munus novum :action pro ordine temporum :name creatum',
            'update' => 'Munus :action pro ordine temporum :name renovatum',
            'delete' => 'Munus pro ordine temporum :name deletum',
        ],
        'settings' => [
            'rename' => 'Nomen serveri ex :old in :new mutatum',
            'description' => 'Descriptio serveri ex :old in :new mutata',
            'egg' => 'Ovum serveri ex :original_egg_id in :new_egg_id mutatum',
            'egg-preview' => 'Mutatio ovi in :preview_egg_id praevisa',
        ],
        'software' => [
            'change-queued' => 'Mutatio programmatum ab ovo :from_egg in :to_egg in seriem addita',
            'change-started' => 'Mutatio programmatum ab ovo :from_egg in :to_egg incepta',
            'changed' => 'Mutatio programmatum peracta',
            'change-failed' => 'Mutatio programmatum cessavit: :error',
        ],
        'startup' => [
            'edit' => 'Variabilis :variable ex :old in :new mutata',
            'image' => 'Imago Docker serveri ex :old in :new renovata',
            'command' => 'Mandatum incipiendi ex :old in :new mutatum',
            'image-reverted' => 'Imago Docker ex :old in :new restituta',
        ],
        'subuser' => [
            'create' => ':email ut subusor adiectus',
            'update' => 'Permissa subusoris pro :email renovata',
            'delete' => ':email ut subusor remotus',
        ],
        'files' => [
            'software-change-wipe' => ':files_deleted fasciculi pro mutatione programmatum deleti',
        ],
        'subdomain' => [
            'deleted-egg-change' => 'Subdominium :subdomain deletum quia cum novo ovo non congruit',
        ],
    ],
];
