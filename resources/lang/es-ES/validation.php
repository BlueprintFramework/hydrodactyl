<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => 'El campo :attribute debe ser aceptado.',
    'active_url' => 'El campo :attribute no es una URL válida.',
    'after' => 'El campo :attribute debe ser una fecha posterior a :date.',
    'after_or_equal' => 'El campo :attribute debe ser una fecha posterior o igual a :date.',
    'alpha' => 'El campo :attribute solo puede contener letras.',
    'alpha_dash' => 'El campo :attribute solo puede contener letras, números y guiones.',
    'alpha_num' => 'El campo :attribute solo puede contener letras y números.',
    'array' => 'El campo :attribute debe ser un array.',
    'before' => 'El campo :attribute debe ser una fecha anterior a :date.',
    'before_or_equal' => 'El campo :attribute debe ser una fecha anterior o igual a :date.',
    'between' => [
        'numeric' => 'El campo :attribute debe estar entre :min y :max.',
        'file' => 'El campo :attribute debe pesar entre :min y :max kilobytes.',
        'string' => 'El campo :attribute debe tener entre :min y :max caracteres.',
        'array' => 'El campo :attribute debe tener entre :min y :max elementos.',
    ],
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'confirmed' => 'La confirmación de :attribute no coincide.',
    'date' => 'El campo :attribute no es una fecha válida.',
    'date_format' => 'El campo :attribute no coincide con el formato :format.',
    'different' => 'El campo :attribute y :other deben ser diferentes.',
    'digits' => 'El campo :attribute debe tener :digits dígitos.',
    'digits_between' => 'El campo :attribute debe tener entre :min y :max dígitos.',
    'dimensions' => 'El campo :attribute tiene dimensiones de imagen no válidas.',
    'distinct' => 'El campo :attribute tiene un valor duplicado.',
    'email' => 'El campo :attribute debe ser una dirección de correo electrónico válida.',
    'exists' => 'El :attribute seleccionado no es válido.',
    'file' => 'El campo :attribute debe ser un archivo.',
    'filled' => 'El campo :attribute es obligatorio.',
    'image' => 'El campo :attribute debe ser una imagen.',
    'in' => 'El :attribute seleccionado no es válido.',
    'in_array' => 'El campo :attribute no existe en :other.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'ip' => 'El campo :attribute debe ser una dirección IP válida.',
    'json' => 'El campo :attribute debe ser una cadena JSON válida.',
    'max' => [
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'file' => 'El campo :attribute no debe pesar más de :max kilobytes.',
        'string' => 'El campo :attribute no debe tener más de :max caracteres.',
        'array' => 'El campo :attribute no debe tener más de :max elementos.',
    ],
    'mimes' => 'El campo :attribute debe ser un archivo de tipo: :values.',
    'mimetypes' => 'El campo :attribute debe ser un archivo de tipo: :values.',
    'min' => [
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'file' => 'El campo :attribute debe pesar al menos :min kilobytes.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
    ],
    'not_in' => 'El :attribute seleccionado no es válido.',
    'numeric' => 'El campo :attribute debe ser un número.',
    'present' => 'El campo :attribute debe estar presente.',
    'regex' => 'El formato del campo :attribute no es válido.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_if' => 'El campo :attribute es obligatorio cuando :other es :value.',
    'required_unless' => 'El campo :attribute es obligatorio a menos que :other esté en :values.',
    'required_with' => 'El campo :attribute es obligatorio cuando :values está presente.',
    'required_with_all' => 'El campo :attribute es obligatorio cuando :values está presente.',
    'required_without' => 'El campo :attribute es obligatorio cuando :values no está presente.',
    'required_without_all' => 'El campo :attribute es obligatorio cuando ninguno de :values está presente.',
    'same' => 'El campo :attribute y :other deben coincidir.',
    'size' => [
        'numeric' => 'El campo :attribute debe ser :size.',
        'file' => 'El campo :attribute debe pesar :size kilobytes.',
        'string' => 'El campo :attribute debe tener :size caracteres.',
        'array' => 'El campo :attribute debe contener :size elementos.',
    ],
    'string' => 'El campo :attribute debe ser una cadena de texto.',
    'timezone' => 'El campo :attribute debe ser una zona válida.',
    'unique' => 'El campo :attribute ya está en uso.',
    'uploaded' => 'El campo :attribute no se pudo subir.',
    'url' => 'El formato del campo :attribute no es válido.',

    'fqdn_ip_not_allowed' => 'El campo :attribute no debe ser una dirección IP cuando HTTPS está activado.',
    'fqdn_resolution_failed' => 'No se pudo resolver el :attribute a una dirección IP válida.',
    'username_format' => 'El :attribute debe comenzar y terminar con caracteres alfanuméricos y
                contener solo letras, números, guiones, guiones bajos y puntos.',

    'json_api' => [
        'custom_nav_url_invalid' => 'El :attribute debe ser una URL HTTP(S) o una ruta interna.',
        'database_unique' => 'El nombre de base de datos que has seleccionado ya está en uso por este servidor.',
        'dns_access_key_id_required' => 'Se requiere el ID de clave de acceso para Route53.',
        'dns_api_key_required' => 'Se requiere la clave de acceso a la API de Bunny.net para Bunny.net.',
        'dns_api_token_required' => 'Se requiere el token de API para Cloudflare.',
        'dns_config_required' => 'Se requiere la configuración de DNS.',
        'dns_provider_invalid' => 'El proveedor de DNS seleccionado no es compatible.',
        'dns_provider_required' => 'Se debe seleccionar un proveedor de DNS.',
        'dns_secret_access_key_required' => 'Se requiere la clave de acceso secreta para Route53.',
        'domain_name_format' => 'El formato del nombre de dominio no es válido.',
        'domain_name_required' => 'Se requiere un nombre de dominio.',
        'domain_name_unique' => 'Este dominio ya está configurado.',
        'domain_not_available' => 'El dominio seleccionado no está disponible.',
        'logo_max' => 'El logotipo no debe superar los 2 MB de tamaño.',
        'logo_mimes' => 'El logotipo debe ser un archivo PNG, JPG, GIF, WEBP o SVG.',
        'logo_url_invalid' => 'La URL del logotipo debe ser una URL válida.',
        'operation_id_required' => 'Se requiere un ID de operación.',
        'operation_id_uuid' => 'El ID de operación debe ser un UUID válido.',
        'power_action_invalid' => 'La acción de alimentación debe ser una de las siguientes: start, stop, restart, kill.',
        'revert_docker_image_confirm' => 'Debes confirmar que entiendes que esta acción no se puede deshacer sin la ayuda de un administrador.',
        'subdomain_invalid_characters' => 'El subdominio contiene caracteres no válidos.',
        'subdomain_reserved' => 'Este subdominio está reservado y no se puede utilizar.',
        'subdomain_taken' => 'Este subdominio ya está en uso.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [
        'external_id' => 'Identificador de terceros',
        'name_first' => 'Nombre',
        'name_last' => 'Apellido',
        'root_admin' => 'Estado de administrador raíz',
        'long' => 'Descripción de la ubicación',
        'short' => 'Identificador de la ubicación',
        'user' => 'ID de usuario',
        'server_name' => 'Nombre del servidor',
        'add_allocations' => 'asignaciones a añadir',
        'remove_allocations' => 'asignaciones a eliminar',
        'add_allocation' => 'asignación a añadir',
        'remove_allocation' => 'asignación a eliminar',
        'feature_limits' => [
            'databases' => 'Límite de bases de datos',
            'allocations' => 'Límite de asignaciones',
            'backups' => 'Límite de copias de seguridad',
            'backup_storage_mb' => 'Límite de almacenamiento de copias de seguridad (MB)',
        ],
        'startup' => 'comando de inicio',
        'memo' => 'Descripción',
        'app:name' => 'Nombre de la empresa',
        'pterodactyl:auth:2fa_required' => 'Requerir autenticación en dos pasos',
        'app:locale' => 'Idioma predeterminado',
        'pterodactyl:guzzle:timeout' => 'Tiempo de espera de solicitud HTTP',
        'pterodactyl:guzzle:connect_timeout' => 'Tiempo de espera de conexión HTTP',
        'pterodactyl:client_features:allocations:enabled' => 'Creación automática de asignaciones activada',
        'pterodactyl:client_features:allocations:range_start' => 'Puerto inicial',
        'pterodactyl:client_features:allocations:range_end' => 'Puerto final',
        'pterodactyl:client_features:groups:enabled' => 'Grupos de servidores activados',
        'app:custom_nav_items' => [
            '*' => [
                'label' => 'Etiqueta del elemento de navegación personalizado',
                'url' => 'Enlace del elemento de navegación personalizado',
                'icon' => 'Icono del elemento de navegación personalizado',
            ],
        ],
        'pterodactyl:captcha:provider' => 'Proveedor de captcha',
        'pterodactyl:captcha:turnstile:site_key' => 'Clave de sitio de Turnstile',
        'pterodactyl:captcha:turnstile:secret_key' => 'Clave secreta de Turnstile',
        'pterodactyl:captcha:hcaptcha:site_key' => 'Clave de sitio de hCaptcha',
        'pterodactyl:captcha:hcaptcha:secret_key' => 'Clave secreta de hCaptcha',
        'pterodactyl:captcha:recaptcha:site_key' => 'Clave de sitio de reCAPTCHA',
        'pterodactyl:captcha:recaptcha:secret_key' => 'Clave secreta de reCAPTCHA',
        'pterodactyl:captcha:cap:site_key' => 'Clave de sitio de Cap',
        'pterodactyl:captcha:cap:secret_key' => 'Clave secreta de Cap',
        'pterodactyl:captcha:cap:server_url' => 'URL del servidor de Cap',
        'domain_name' => 'nombre de dominio',
        'dns_provider' => 'proveedor de DNS',
        'dns_config' => [
            'api_token' => 'token de API',
            'access_key_id' => 'ID de clave de acceso',
            'secret_access_key' => 'Clave de acceso secreta',
            'region' => 'Región de AWS',
            'hosted_zone_id' => 'ID de zona alojada',
            'api_key' => 'Clave de acceso a la API de Bunny.net',
        ],
        'daemon_base' => 'Ruta base del daemon',
        'upload_size' => 'Límite de tamaño de subida de archivos',
        'location_id' => 'Ubicación',
        'public' => 'Visibilidad del nodo',
        'host' => 'ID del servidor host de la base de datos',
        'remote' => 'Cadena de conexión remota',
        'database' => 'Nombre de la base de datos',
        'logo_file' => 'Archivo de logotipo',
        'logo_url' => 'URL del logotipo',
    ],

    // Internal validation logic for Pterodactyl
    'internal' => [
        'variable_value' => 'variable :env',
        'invalid_password' => 'La contraseña proporcionada no era válida para esta cuenta.',
    ],
];
