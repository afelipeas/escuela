<?php
// ================================================================
// config/app.php — Configuración Global de la Aplicación
// ================================================================
// Define constantes globales usadas en todo el backend.
// Centralizar estas configuraciones permite cambiar de entorno
// (desarrollo a producción) modificando un solo archivo.
// ================================================================

// ── Entorno de Ejecución ──
// 'development' (muestra errores en pantalla) o 'production' (oculta errores)
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// ── Configuración de Errores según Entorno ──
if (APP_ENV === 'development') {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    // En producción, silenciar errores en pantalla para no revelar info
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(0);
}

// ── Configuración Regional y Zona Horaria ──
// Asegura que las fechas que guardemos en la BD correspondan a nuestra zona horaria
date_default_timezone_set('America/Bogota'); // Ajusta a tu país (Ej: America/Mexico_City, Europe/Madrid)

// ── JWT Secret Key ──
// Clave súper secreta para firmar y validar los tokens JWT.
// ¡NUNCA la compartas ni la subas a repositorios públicos en producción!
define('JWT_SECRET_KEY', 'La_Gracia_De_Dios_Es_Infinita_2026_!@#$');
// Tiempo de expiración del token en segundos (Ej: 3600 = 1 hora)
define('JWT_EXPIRATION', 3600 * 24); // 24 horas

// ── Configuración de Base de Datos ──
// En XAMPP local: host=localhost, user=root, pass=''
// En infinityfree: reemplaza con los valores de tu panel → MySQL Databases
define('DB_HOST', getenv('DB_HOST') ?: 'sql303.infinityfree.com');
define('DB_NAME', getenv('DB_NAME') ?: 'if0_42322538_escuela_dominical_db');
define('DB_USER', getenv('DB_USER') ?: 'if0_42322538');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: '131174fj');
