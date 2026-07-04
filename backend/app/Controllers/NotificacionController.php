<?php

namespace App\Controllers;

use App\Models\NotificacionModel;
use App\Helpers\Response;
use App\Middleware\AuthMiddleware;

class NotificacionController
{
    private $notificacionModel;

    public function __construct()
    {
        $this->notificacionModel = new NotificacionModel();
    }

    public function index()
    {
        $usuario = AuthMiddleware::verify();
        $notificaciones = $this->notificacionModel->getByUser($usuario['id']);
        $unreadCount = $this->notificacionModel->getUnreadCount($usuario['id']);
        
        Response::success([
            'notificaciones' => $notificaciones,
            'totalSinLeer' => $unreadCount
        ]);
    }

    public function marcarLeida()
    {
        $usuario = AuthMiddleware::verify();
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!isset($data['id_notificacion'])) {
            Response::error("ID de notificación no proporcionado", 400);
        }

        $this->notificacionModel->markAsRead($data['id_notificacion'], $usuario['id']);
        Response::success(null, "Notificación marcada como leída");
    }

    public function marcarTodasLeidas()
    {
        $usuario = AuthMiddleware::verify();
        $this->notificacionModel->markAllAsRead($usuario['id']);
        Response::success(null, "Todas las notificaciones marcadas como leídas");
    }

    public function enviarACurso()
    {
        $usuario = AuthMiddleware::verify();
        // Solo docentes y admins pueden enviar notificaciones
        if ($usuario['rol'] !== 'docente' && $usuario['rol'] !== 'admin') {
            Response::error("No tienes permisos para enviar notificaciones", 403);
        }

        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!isset($data['id_curso']) || !isset($data['titulo']) || !isset($data['mensaje'])) {
            Response::error("Faltan datos requeridos (id_curso, titulo, mensaje)", 400);
        }

        $tipo = $data['tipo'] ?? 'novedad';
        $total = $this->notificacionModel->createForCourse($data['id_curso'], $data['titulo'], $data['mensaje'], $tipo);

        Response::success(['total_enviados' => $total], "Notificación enviada a $total estudiantes");
    }
}
