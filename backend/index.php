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
// Quitar prefijos de subcarpeta segun el entorno de deploy
$uri = preg_replace('#^/escuela/backend#', '', $uri);
$uri = preg_replace('#^/backend#', '', $uri);
$metodo = $_SERVER['REQUEST_METHOD'];

// Manejar confirmación de CORS pre-flight
if ($metodo === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ping: si solo piden /api o /api/ sin accion, devolver OK
$uriLimpia = trim($uri, '/');
if ($uriLimpia === 'api' || $uriLimpia === '') {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true, 'datos' => null, 'mensaje' => 'API Escuela Dominical. Todo verde.']);
    exit();
}

// Debug: probar conexion a BD
if ($uriLimpia === 'api/test') {
    header('Content-Type: application/json');
    try {
        $db = \Config\Database::obtenerConexion();
        $stmt = $db->query("SELECT COUNT(*) as total FROM usuarios");
        $total = $stmt->fetch()['total'];
        echo json_encode(['ok' => true, 'datos' => ['conexion_bd' => 'OK', 'usuarios_en_bd' => (int)$total], 'mensaje' => 'BD conectada']);
    } catch (\Throwable $e) {
        echo json_encode(['ok' => false, 'mensaje' => 'BD error: ' . $e->getMessage()]);
    }
    exit();
}

// Debug: probar login completo (GET con parametros en URL)
if ($uriLimpia === 'api/testlogin') {
    header('Content-Type: application/json');
    $email = $_GET['email'] ?? 'vacio';
    $pass = $_GET['password'] ?? 'vacio';

    try {
        $db = \Config\Database::obtenerConexion();
    } catch (\Throwable $e) {
        echo json_encode(['ok' => false, 'paso' => 'conexion_bd', 'mensaje' => $e->getMessage()]);
        exit();
    }

    try {
        $stmt = $db->prepare("SELECT id, nombre, email, rol, password_hash, estado FROM usuarios WHERE email = :e1 OR nombre_usuario = :e2 LIMIT 1");
        $stmt->execute([':e1' => $email, ':e2' => $email]);
        $usuario = $stmt->fetch();
    } catch (\Throwable $e) {
        echo json_encode(['ok' => false, 'paso' => 'buscar_usuario', 'mensaje' => $e->getMessage()]);
        exit();
    }

    if (!$usuario) {
        echo json_encode(['ok' => false, 'paso' => 'usuario', 'mensaje' => 'No existe usuario', 'email_buscado' => $email]);
        exit();
    }

    $hashValido = password_verify($pass, $usuario['password_hash']);

    if (!$hashValido) {
        echo json_encode(['ok' => false, 'paso' => 'password', 'mensaje' => 'Password incorrecto']);
        exit();
    }

    if ($usuario['estado'] !== 'activo') {
        echo json_encode(['ok' => false, 'paso' => 'estado', 'mensaje' => 'Cuenta ' . $usuario['estado']]);
        exit();
    }

    // Generar JWT real
    require_once BASE_PATH . '/app/Helpers/JWT.php';
    $tokenData = ['id' => $usuario['id'], 'email' => $usuario['email'], 'rol' => $usuario['rol']];
    $token = \App\Helpers\JWT::generate($tokenData);

    echo json_encode([
        'ok' => true,
        'paso' => 'LOGIN_EXITOSO',
        'datos' => [
            'usuario' => ['id' => $usuario['id'], 'nombre' => $usuario['nombre'], 'email' => $usuario['email'], 'rol' => $usuario['rol']],
            'token' => substr($token, 0, 50) . '...',
        ],
    ]);
    exit();
}

// Debug: probar registro (GET con parametros)
if ($uriLimpia === 'api/testregister') {
    header('Content-Type: application/json');
    $nombre_usuario = $_GET['user'] ?? 'test_user_' . time();
    $email = $_GET['email'] ?? 'test_' . time() . '@test.com';
    $pass = $_GET['password'] ?? 'test123';

    try {
        $db = \Config\Database::obtenerConexion();
        $stmt = $db->prepare("INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, password_hash, rol, estado) VALUES (:u, :n, :a, :e, :p, 'cliente', 'activo')");
        $stmt->execute([
            ':u' => $nombre_usuario,
            ':n' => 'Test',
            ':a' => 'User',
            ':e' => $email,
            ':p' => password_hash($pass, PASSWORD_BCRYPT),
        ]);
        echo json_encode(['ok' => true, 'mensaje' => 'Usuario creado', 'id' => $db->lastInsertId(), 'email' => $email, 'password' => $pass]);
    } catch (\Throwable $e) {
        echo json_encode(['ok' => false, 'mensaje' => $e->getMessage()]);
    }
    exit();
}

// 5. Motor de Enrutamiento
require_once BASE_PATH . '/app/Routes/api.php';
