<?php
// ================================================================
// config/database.php — Conexión a la Base de Datos MySQL
// ================================================================
// Esta clase gestiona la conexión a MySQL usando PDO (PHP Data Objects),
// que es la forma más moderna y segura de conectarse a bases de datos en PHP.
//
// Patrón Singleton: garantiza que durante toda la ejecución de una
// petición HTTP solo exista UNA conexión a la base de datos,
// evitando abrir múltiples conexiones innecesarias.
// ================================================================

namespace Config;

use PDO;
use PDOException;

class Database
{
    // ── Credenciales de conexión ──
    // Modificar estos valores según el entorno (local/producción)
    private string $host     = 'localhost';
    private string $nombre   = 'escuela_dominical_db'; // Nombre de la BD creada en phpMyAdmin
    private string $usuario  = 'root';                  // Usuario de MySQL (por defecto en XAMPP: root)
    private string $password = '';                      // Contraseña de MySQL (por defecto en XAMPP: vacía)
    private string $charset  = 'utf8mb4';               // Soporte completo para emojis y caracteres especiales

    // Instancia única de la conexión (Singleton)
    private static ?PDO $instancia = null;

    // ── Constructor privado ──
    // Privado para que nadie pueda hacer: new Database() desde fuera.
    // Solo se puede obtener la conexión con Database::obtenerConexion()
    private function __construct() {}

    // ── Método principal: obtenerConexion() ──
    // Devuelve siempre la misma instancia de PDO.
    // Si aún no existe, la crea; si ya existe, la reutiliza.
    public static function obtenerConexion(): PDO
    {
        if (self::$instancia === null) {
            try {
                // Usar los valores de app.php si están disponibles, sino los valores por defecto
                $host    = defined('DB_HOST')     ? DB_HOST     : 'localhost';
                $nombre  = defined('DB_NAME')     ? DB_NAME     : 'escuela_dominical_db';
                $usuario = defined('DB_USER')     ? DB_USER     : 'root';
                $pass    = defined('DB_PASSWORD') ? DB_PASSWORD : '';

                $dsn = "mysql:host={$host};dbname={$nombre};charset=utf8mb4";

                self::$instancia = new PDO($dsn, $usuario, $pass, [
                    // Lanzar excepciones automáticamente en caso de error SQL
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

                    // Devolver los datos como arrays asociativos por defecto
                    // Ej: $fila['nombre'] en lugar de $fila[0]
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

                    // Desactivar la emulación de prepared statements
                    // Esto hace las consultas más seguras contra SQL Injection
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);

            } catch (PDOException $e) {
                // En producción, nunca mostrar el error real al usuario
                // Solo registrar en el log y devolver un error genérico
                error_log('Error de conexión a la BD: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    'ok'      => false,
                    'mensaje' => 'Error interno del servidor. No se pudo conectar a la base de datos.'
                ]);
                exit();
            }
        }

        return self::$instancia;
    }
}
