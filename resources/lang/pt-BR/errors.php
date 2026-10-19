<?php

return [
    '400' => [
        'title' => 'Requisição inválida',
        'message' => 'O servidor não conseguiu processar a requisição.',
    ],
    '401' => [
        'title' => 'Não autorizado',
        'message' => 'Você precisa entrar para acessar este recurso.',
    ],
    '403' => [
        'title' => 'Acesso negado',
        'message' => 'Você não tem permissão para acessar este recurso.',
    ],
    '404' => [
        'title' => 'Página não encontrada',
        'message' => 'A página que você procura não existe ou foi movida.',
    ],
    '419' => [
        'title' => 'Página expirada',
        'message' => 'Sua sessão expirou. Atualize a página e tente novamente.',
    ],
    '429' => [
        'title' => 'Muitas requisições',
        'message' => 'Você fez muitas requisições. Tente novamente em alguns instantes.',
    ],
    '500' => [
        'title' => 'Erro no servidor',
        'message' => 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    ],
    '503' => [
        'title' => 'Serviço indisponível',
        'message' => 'O serviço está temporariamente indisponível. Tente novamente mais tarde.',
    ],
    'back' => 'Voltar ao painel',
];
