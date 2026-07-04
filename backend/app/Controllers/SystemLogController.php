<?php
namespace App\Controllers;

use App\Models\SystemLogModel;
use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class SystemLogController
{
    private SystemLogModel $logModel;

    public function __construct()
    {
        $this->logModel = new SystemLogModel();
    }

    /**
     * GET /api/logs
     */
    public function getAll()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'admin');

        $nivel = $_GET['nivel'] ?? '';
        $busqueda = $_GET['busqueda'] ?? '';

        $logs = $this->logModel->getAll($nivel, $busqueda);

        // Si la tabla está vacía, sembramos logs iniciales de demostración
        if (empty($logs) && empty($nivel) && empty($busqueda)) {
            $this->sembrarLogsDemostracion($usuario['nombre_usuario']);
            $logs = $this->logModel->getAll();
        }

        Response::success($logs);
    }

    /**
     * POST /api/logs/limpiar
     */
    public function clear()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'admin');

        $this->logModel->clear();
        
        // Registrar el evento de limpieza como un log de seguridad de nivel alto
        $this->logModel->log(
            'SEGURIDAD', 
            $usuario['nombre_usuario'], 
            'Bitácora de logs limpiada', 
            'El administrador ejecutó el comando para vaciar permanentemente el log de auditoría del sistema.'
        );

        Response::success(null, "Bitácora de logs del sistema limpiada correctamente.");
    }

    private function sembrarLogsDemostracion(string $adminUser)
    {
        $this->logModel->log('INFO', 'sistema', 'Inicialización de bitácora de logs', 'Tabla logs_sistema auto-creada e inicializada correctamente.');
        $this->logModel->log('INFO', 'docente_luisa', 'Creación de nueva lección', 'Se añadió la lección "Parábola del Sembrador" al curso "Evangelios Sinópticos".');
        $this->logModel->log('SEGURIDAD', $adminUser, 'Inicio de sesión de administrador', 'Credenciales del panel de control validadas con éxito desde la IP local.');
        $this->logModel->log('INFO', 'vendedor_juan', 'Inventario actualizado', 'Se añadieron 50 unidades de "Biblia de Estudio Reina Valera" al almacén virtual.');
        $this->logModel->log('ADVERTENCIA', 'sistema', 'Intento de acceso fallido', 'Usuario incorrecto o contraseña inválida en intento de login para el usuario "estudiante_anonimo".');
        $this->logModel->log('INFO', 'estudiante_pedro', 'Curso finalizado', 'El estudiante completó todas las lecciones del curso "Introducción al Pentateuco".');
        $this->logModel->log('INFO', 'estudiante_pedro', 'Canje realizado', 'Pedido #1052 registrado por canjear "Gorra Oficial Escuela Dominical" con 150 Puntos Fe.');
        $this->logModel->log('ERROR', 'API_interceptor', 'Fallo de conexión externa', 'Intento fallido de comunicarse con la API de notificaciones push de Google OAuth.');
        $this->logModel->log('INFO', $adminUser, 'Configuración de plataforma modificada', 'Se ajustó la recompensa de finalización de curso a 200 Puntos Fe.');
        $this->logModel->log('INFO', $adminUser, 'Optimización de base de datos', 'Se completó la desfragmentación y optimización de las tablas de base de datos.');
    }
}
