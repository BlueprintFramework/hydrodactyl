<?php

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => 'Falha no login',
        'success' => 'Entrou no painel',
        'password-reset' => 'Senha redefinida',
        'reset-password' => 'Solicitou a redefinição de senha',
        'checkpoint' => 'Autenticação em duas etapas solicitada',
        'recovery-token' => 'Usou um código de recuperação da autenticação em duas etapas',
        'token' => 'Concluiu a autenticação em duas etapas',
        'ip-blocked' => 'Bloqueou uma requisição de endereço IP não listado para :identifier',
        'sftp' => [
            'fail' => 'Falha no login SFTP',
        ],
    ],
    'backup' => [
        'bulk_delete' => 'Excluiu :backup_count backups',
        'create' => 'Criou o backup :backup_name',
        'delete' => 'Excluiu o backup :backup_name',
        'delete_all' => 'Excluiu todos os :backup_count backups',
        'download' => 'Baixou o backup :backup_name',
        'lock' => 'Alterou o bloqueio do backup :backup_name',
        'rename' => 'Renomeou o backup de :old_name para :new_name',
        'restore' => 'Restaurou o backup :backup_name',
    ],
    'event' => [
        'password-reset' => 'Solicitou uma redefinição de senha',
    ],
    'job' => [
        'cancel' => 'Cancelou o trabalho :job_id',
        'create' => 'Criou um trabalho do tipo :job_type (:job_id)',
    ],
    'setup' => [
        'admin-created' => 'Criou a primeira conta de administrador pelo processo de configuração',
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Alterou o e-mail de :old para :new',
            'password-changed' => 'Alterou a senha',
        ],
        'api-key' => [
            'create' => 'Criou a chave de API :identifier',
            'delete' => 'Excluiu a chave de API :identifier',
        ],
        'ssh-key' => [
            'create' => 'Adicionou a chave SSH :fingerprint à conta',
            'delete' => 'Removeu a chave SSH :fingerprint da conta',
        ],
        'two-factor' => [
            'create' => 'Ativou a autenticação em duas etapas',
            'delete' => 'Desativou a autenticação em duas etapas',
        ],
    ],
    'server' => [
        'reinstall' => 'Reinstalou o servidor',
        'console' => [
            'command' => 'Executou :command no servidor',
        ],
        'power' => [
            'start' => 'Iniciou o servidor',
            'stop' => 'Parou o servidor',
            'restart' => 'Reiniciou o servidor',
            'kill' => 'Encerrou à força o processo do servidor',
        ],
        'backup' => [
            'download' => 'Baixou o backup :name',
            'delete' => 'Excluiu o backup :name',
            'restore' => 'Restaurou o backup :name (arquivos excluídos: :truncate)',
            'restore-complete' => 'Concluiu a restauração do backup :name',
            'restore-failed' => 'Falha ao concluir a restauração do backup :name',
            'start' => 'Iniciou um novo backup :name',
            'complete' => 'Marcou o backup :name como concluído',
            'fail' => 'Marcou o backup :name como malsucedido',
            'lock' => 'Bloqueou o backup :name',
            'unlock' => 'Desbloqueou o backup :name',
            'delete_all' => 'Excluiu todos os :count backups',
            'bulk_delete' => 'Excluiu :count backups',
            'software-change' => 'Criou o backup :backup_name para a troca de software',
        ],
        'database' => [
            'create' => 'Criou o banco de dados :name',
            'rotate-password' => 'Redefiniu a senha do banco de dados :name',
            'delete' => 'Excluiu o banco de dados :name',
        ],
        'file' => [
            'compress_one' => 'Compactou :directory:file',
            'compress_other' => 'Compactou :count arquivos em :directory',
            'read' => 'Visualizou o conteúdo de :file',
            'copy' => 'Criou uma cópia de :file',
            'create-directory' => 'Criou a pasta :directory:name',
            'decompress' => 'Descompactou :files em :directory',
            'delete_one' => 'Excluiu :directory:files.0',
            'delete_other' => 'Excluiu :count arquivos em :directory',
            'download' => 'Baixou :file',
            'pull' => 'Baixou um arquivo remoto de :url para :directory',
            'rename_one' => 'Renomeou :directory:files.0.from para :directory:files.0.to',
            'rename_other' => 'Renomeou :count arquivos em :directory',
            'write' => 'Gravou novo conteúdo em :file',
            'upload' => 'Iniciou o envio de um arquivo',
            'uploaded' => 'Enviou :directory:file',
            'compress' => 'Compactou :count arquivos em :directory',
            'delete' => 'Excluiu :count arquivos em :directory',
            'delete-trash' => 'Excluiu permanentemente :count arquivos da lixeira',
            'rename' => 'Renomeou :count arquivos em :directory',
            'restore-trash' => 'Restaurou :count arquivos da lixeira',
            'trash' => 'Moveu :count arquivos para a lixeira',
        ],
        'mod' => [
            'install' => 'Instalou um mod',
        ],
        'modrinth' => [
            'install' => 'Instalou o mod :project (:version)',
            'install-modpack' => 'Instalou o modpack :project_title (:version)',
            'uninstall' => 'Desinstalou o mod :project',
            'update' => 'Atualizou o mod :project para :version',
            'update-all' => 'Atualizou :count mods',
        ],
        'sftp' => [
            'denied' => 'Bloqueou o acesso SFTP por falta de permissão',
            'create' => 'Criou :count arquivos via SFTP',
            'create-directory' => 'Criou :count pastas via SFTP',
            'delete' => 'Excluiu :count arquivos via SFTP',
            'rename' => 'Renomeou ou moveu :count arquivos via SFTP',
            'write' => 'Modificou :count arquivos via SFTP',
            'create_one' => 'Criou :files.0',
            'create_other' => 'Criou :count novos arquivos',
            'write_one' => 'Modificou o conteúdo de :files.0',
            'write_other' => 'Modificou o conteúdo de :count arquivos',
            'delete_one' => 'Excluiu :files.0',
            'delete_other' => 'Excluiu :count arquivos',
            'create-directory_one' => 'Criou a pasta :files.0',
            'create-directory_other' => 'Criou :count pastas',
            'rename_one' => 'Renomeou :files.0.from para :files.0.to',
            'rename_other' => 'Renomeou ou moveu :count arquivos',
        ],
        'allocation' => [
            'create' => 'Adicionou :allocation ao servidor',
            'notes' => 'Atualizou as observações de :allocation de :old para :new',
            'primary' => 'Definiu :allocation como a alocação principal do servidor',
            'delete' => 'Excluiu a alocação :allocation',
        ],
        'schedule' => [
            'create' => 'Criou o agendamento :name',
            'update' => 'Atualizou o agendamento :name',
            'execute' => 'Executou manualmente o agendamento :name',
            'delete' => 'Excluiu o agendamento :name',
        ],
        'task' => [
            'create' => 'Criou uma tarefa :action para o agendamento :name',
            'update' => 'Atualizou a tarefa :action do agendamento :name',
            'delete' => 'Excluiu uma tarefa do agendamento :name',
        ],
        'settings' => [
            'rename' => 'Renomeou o servidor de :old para :new',
            'description' => 'Alterou a descrição do servidor de :old para :new',
            'egg' => 'Alterou o egg do servidor de :original_egg_id para :new_egg_id',
            'egg-preview' => 'Visualizou uma prévia de troca para o egg :preview_egg_id',
        ],
        'software' => [
            'change-queued' => 'Colocou na fila uma troca de software do egg :from_egg para :to_egg',
            'change-started' => 'Iniciou uma troca de software do egg :from_egg para :to_egg',
            'changed' => 'Concluiu a troca de software',
            'change-failed' => 'Falha na troca de software: :error',
        ],
        'startup' => [
            'edit' => 'Alterou a variável :variable de :old para :new',
            'image' => 'Atualizou a imagem Docker do servidor de :old para :new',
            'command' => 'Alterou o comando de inicialização de :old para :new',
            'image-reverted' => 'Reverteu a imagem Docker de :old para :new',
        ],
        'subuser' => [
            'create' => 'Adicionou :email como subusuário',
            'update' => 'Atualizou as permissões de subusuário de :email',
            'delete' => 'Removeu :email como subusuário',
        ],
        'files' => [
            'software-change-wipe' => 'Excluiu :files_deleted arquivos para a troca de software',
        ],
        'subdomain' => [
            'deleted-egg-change' => 'Excluiu o subdomínio :subdomain por incompatibilidade com o novo egg',
        ],
    ],
];
