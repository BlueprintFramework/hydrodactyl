<?php

return [
    '400' => [
        'title' => 'Sol·licitud incorrecta',
        'message' => 'El servidor no ha pogut processar la sol·licitud.',
    ],
    '401' => [
        'title' => 'No autoritzat',
        'message' => "Has d'iniciar sessió per accedir a aquest recurs.",
    ],
    '403' => [
        'title' => 'Accés denegat',
        'message' => 'No tens permís per accedir a aquest recurs.',
    ],
    '404' => [
        'title' => 'Pàgina no trobada',
        'message' => "La pàgina que busques no existeix o s'ha mogut.",
    ],
    '419' => [
        'title' => 'Pàgina expirada',
        'message' => 'La teva sessió ha caducat. Actualitza la pàgina i torna-ho a provar.',
    ],
    '429' => [
        'title' => 'Massa sol·licituds',
        'message' => "Has fet massa sol·licituds. Torna-ho a provar d'aquí a uns moments.",
    ],
    '500' => [
        'title' => 'Error del servidor',
        'message' => "S'ha produït un error inesperat. Torna-ho a provar més tard.",
    ],
    '503' => [
        'title' => 'Servei no disponible',
        'message' => 'El servei no està disponible temporalment. Torna-ho a provar més tard.',
    ],
    'back' => 'Torna al panell',
];
