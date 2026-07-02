<?php
// ================================================================
// FRONT CONTROLLER (index.php)
// ================================================================

// 1. Configurar constantes básicas de directorio
define('BASE_PATH', __DIR__);

// 2. Manejo de CORS (Permitir peticiones de Angular localhost:4200)
require_once BASE_PATH . '/config/cors.php';

// 3. Autocarga estricta (PSR-4 manual si no usamos vendor/autoload.php)
// Nota: Como no hemos garantizado hacer un "composer install", haremos un autoloader manual a prueba de fallos.
spl_autoload_register(function ($clase) {
    // Ejemplo: App\Controllers\AuthController -> app/Controllers/AuthController.php
    // Ejemplo: Config\Database -> config/Database.php

    $prefix_app = 'App\\';
    $prefix_config = 'Config\\';

    $base_dir = '';
    $class_name = '';

    if (strncmp($prefix_app, $clase, strlen($prefix_app)) === 0) {
        $base_dir = BASE_PATH . '/app/';
        $class_name = substr($clase, strlen($prefix_app));
    } elseif (strncmp($prefix_config, $clase, strlen($prefix_config)) === 0) {
        $base_dir = BASE_PATH . '/config/';
        $class_name = substr($clase, strlen($prefix_config));
    } else {
        return;
    }

    $ruta = $base_dir . str_replace('\\', '/', $class_name) . '.php';

    if (file_exists($ruta)) {
        require_once $ruta;
    }
});

// 4. Variables de entorno e Inicialización segura
require_once BASE_PATH . '/config/app.php';

// Obtener URI limpia y Método
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/escuela/backend/', '/', $uri); // Quitar subcarpeta si existe
$metodo = $_SERVER['REQUEST_METHOD'];

// Manejar confirmación de CORS pre-flight
if ($metodo === 'OPTIONS') {
    http_response_code(200);
    exit();
}


// 5. Motor de Enrutamiento
require_once BASE_PATH . '/app/Routes/api.php';
