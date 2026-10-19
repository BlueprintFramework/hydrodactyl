<?php

return [
    'sign_in' => 'Entrar',
    'go_to_login' => 'Ir para o login',
    'failed' => 'Não foi encontrada nenhuma conta com essas credenciais.',

    'forgot_password' => [
        'label' => 'Esqueceu a senha?',
        'label_help' => 'Informe o e-mail da sua conta para receber instruções de redefinição de senha.',
        'button' => 'Recuperar conta',
    ],

    'reset_password' => [
        'button' => 'Redefinir e entrar',
    ],

    'two_factor' => [
        'label' => 'Código de autenticação em duas etapas',
        'label_help' => 'Esta conta exige uma segunda etapa de autenticação para continuar. Informe o código gerado pelo seu dispositivo para concluir o login.',
        'checkpoint_failed' => 'O código de autenticação em duas etapas é inválido.',
        'recovery_token_invalid' => 'O código de recuperação informado é inválido.',
    ],

    'throttle' => 'Muitas tentativas de login. Tente novamente em :seconds segundos.',
    'password_requirements' => 'A senha deve ter pelo menos 8 caracteres e ser exclusiva deste site.',
    '2fa_must_be_enabled' => 'O administrador exige que a autenticação em duas etapas esteja ativada na sua conta para usar o painel.',
];
