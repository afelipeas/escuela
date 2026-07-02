<?php

namespace App\Models;

use Config\Database;
use PDO;

class NotificacionModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getByUser($id_usuario)
    {
        $stmt = $this->db->prepare("SELECT * FROM notificaciones WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 20");
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll();
    }

    public function getUnreadCount($id_usuario)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM notificaciones WHERE id_usuario = ? AND leido = 0");
        $stmt->execute([$id_usuario]);
        $row = $stmt->fetch();
        return (int)$row['total'];
    }

    public function markAsRead($id_notificacion, $id_usuario)
    {
        $stmt = $this->db->prepare("UPDATE notificaciones SET leido = 1 WHERE id = ? AND id_usuario = ?");
        return $stmt->execute([$id_notificacion, $id_usuario]);
    }

    public function markAllAsRead($id_usuario)
    {
        $stmt = $this->db->prepare("UPDATE notificaciones SET leido = 1 WHERE id_usuario = ?");
        return $stmt->execute([$id_usuario]);
    }

    public function createForCourse($id_curso, $titulo, $mensaje, $tipo)
    {
        // Obtener todos los estudiantes inscritos en el curso
        $stmt = $this->db->prepare("SELECT id_estudiante FROM inscripciones WHERE id_curso = ?");
        $stmt->execute([$id_curso]);
        $estudiantes = $stmt->fetchAll();

        $stmtInsert = $this->db->prepare("INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)");
        
        foreach ($estudiantes as $e) {
            $stmtInsert->execute([$e['id_estudiante'], $titulo, $mensaje, $tipo]);
        }
        
        return count($estudiantes);
    }
}
