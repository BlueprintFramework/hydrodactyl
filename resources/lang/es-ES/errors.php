<?php

return [
    '400' => [
        'title' => 'Solicitud incorrecta',
        'message' => 'El servidor no pudo procesar la solicitud.',
    ],
    '401' => [
        'title' => 'No autorizado',
        'message' => 'Necesitas iniciar sesión para acceder a este recurso.',
    ],
    '403' => [
        'title' => 'Acceso denegado',
        'message' => 'No tienes permiso para acceder a este recurso.',
    ],
    '404' => [
        'title' => 'Página no encontrada',
        'message' => 'La página que buscas no existe o se ha movido.',
    ],
    '419' => [
        'title' => 'Página expirada',
        'message' => 'Tu sesión ha caducado. Actualiza la página e inténtalo de nuevo.',
    ],
    '429' => [
        'title' => 'Demasiadas solicitudes',
        'message' => 'Has realizado demasiadas solicitudes. Inténtalo de nuevo en unos momentos.',
    ],
    '500' => [
        'title' => 'Error del servidor',
        'message' => 'Se ha producido un error inesperado. Vuelve a intentarlo más tarde.',
    ],
    '503' => [
        'title' => 'Servicio no disponible',
        'message' => 'El servicio no está disponible temporalmente. Vuelve a intentarlo más tarde.',
    ],
    'back' => 'Volver al panel',
];
