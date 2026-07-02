<?php
namespace App\Models;

use Config\Database;
use PDO;

class ClaseModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getFinalizedCount()
    {
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM clases_programadas WHERE estado = 'finalizada'");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getFinalizedCountMes()
    {
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM clases_programadas WHERE estado = 'finalizada' AND MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getFinalizedCountMesAnterior()
    {
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM clases_programadas WHERE estado = 'finalizada' AND MONTH(fecha) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(fecha) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getProximas()
    {
        return $this->db->query("SELECT cp.*, c.titulo as curso FROM clases_programadas cp JOIN cursos c ON cp.id_curso = c.id WHERE cp.estado = 'programada' AND cp.fecha >= CURDATE() ORDER BY cp.fecha ASC LIMIT 5")->fetchAll();
    }

    public function getProximasByDocente(int $id_docente)
    {
        $stmt = $this->db->prepare("
            SELECT cp.*, c.titulo as curso 
            FROM clases_programadas cp 
            JOIN cursos c ON cp.id_curso = c.id
            WHERE cp.id_docente = :id_docente 
            AND cp.estado IN ('programada', 'en_curso')
            AND cp.fecha >= CURDATE()
            ORDER BY cp.fecha ASC, cp.hora ASC
        ");
        $stmt->execute([':id_docente' => $id_docente]);
        return $stmt->fetchAll();
    }

    public function getProximasByEstudiante(int $id_estudiante)
    {
        $stmt = $this->db->prepare("
            SELECT cp.*, c.titulo as curso 
            FROM clases_programadas cp 
            JOIN cursos c ON cp.id_curso = c.id
            JOIN inscripciones i ON i.id_curso = c.id
            WHERE i.id_estudiante = :id_estudiante 
            AND cp.estado IN ('programada', 'en_curso')
            AND cp.fecha >= CURDATE()
            ORDER BY cp.fecha ASC, cp.hora ASC
        ");
        $stmt->execute([':id_estudiante' => $id_estudiante]);
        return $stmt->fetchAll();
    }

    public function create(array $data)
    {
        $sql = "INSERT INTO clases_programadas (id_curso, id_docente, titulo, grupo, fecha, hora, descripcion, video_url, referencias_url, material_url, material_nombre) 
                VALUES (:id_curso, :id_docente, :titulo, :grupo, :fecha, :hora, :descripcion, :video_url, :referencias_url, :material_url, :material_nombre)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id_curso'       => $data['id_curso'],
            ':id_docente'     => $data['id_docente'],
            ':titulo'         => $data['titulo'],
            ':grupo'          => $data['grupo'] ?? null,
            ':fecha'          => $data['fecha'],
            ':hora'           => $data['hora'],
            ':descripcion'    => $data['descripcion'] ?? null,
            ':video_url'      => $data['video_url'] ?? null,
            ':referencias_url'=> $data['referencias_url'] ?? null,
            ':material_url'   => $data['material_url'] ?? null,
            ':material_nombre'=> $data['material_nombre'] ?? null
        ]);
        return $this->db->lastInsertId();
    }
}
