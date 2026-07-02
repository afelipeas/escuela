<?php
namespace App\Models;

use Config\Database;
use PDO;

class CursoModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getAll()
    {
        // Agrupamos por título para que nunca aparezcan duplicados en la vista de explorar cursos,
        // aunque existan filas con el mismo nombre en la tabla (protección defensiva).
        $stmt = $this->db->query("
            SELECT * FROM cursos
            GROUP BY titulo
            ORDER BY fecha_creacion DESC
        ");
        return $stmt->fetchAll();
    }

    public function getById(int $id)
    {
        $stmt = $this->db->prepare("SELECT * FROM cursos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function create(array $data)
    {
        $sql = "INSERT INTO cursos (id_docente, titulo, descripcion, icono, color_tema, estado, video_url, material_url, material_nombre) 
                VALUES (:id_docente, :titulo, :descripcion, :icono, :color_tema, :estado, :video_url, :material_url, :material_nombre)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id_docente' => $data['id_docente'],
            ':titulo' => $data['titulo'],
            ':descripcion' => $data['descripcion'] ?? null,
            ':icono' => $data['icono'] ?? null,
            ':color_tema' => $data['color_tema'] ?? null,
            ':estado' => $data['estado'] ?? 'borrador',
            ':video_url' => $data['video_url'] ?? null,
            ':material_url' => $data['material_url'] ?? null,
            ':material_nombre' => $data['material_nombre'] ?? null
        ]);
        return $this->db->lastInsertId();
    }

    public function getByDocente(int $id_docente)
    {
        $stmt = $this->db->prepare("SELECT * FROM cursos WHERE id_docente = :id_docente ORDER BY titulo ASC");
        $stmt->execute([':id_docente' => $id_docente]);
        return $stmt->fetchAll();
    }

    public function getCalificacionesDocente(int $id_docente)
    {
        $sql = "
            SELECT 
                i.id_curso,
                i.id_estudiante,
                i.fecha_inscripcion,
                u.nombre AS estudiante_nombre,
                u.email AS estudiante_email,
                u.puntos AS puntos_globales,
                c.titulo AS curso_titulo,
                (SELECT COUNT(*) FROM lecciones WHERE id_curso = c.id) AS total_lecciones,
                (SELECT COUNT(*) FROM progreso_lecciones pl JOIN lecciones l ON pl.id_leccion = l.id WHERE pl.id_estudiante = i.id_estudiante AND l.id_curso = c.id AND pl.completada = 1) AS lecciones_completadas,
                ROUND(IF(
                    (SELECT COUNT(*) FROM lecciones WHERE id_curso = c.id) > 0,
                    ((SELECT COUNT(*) FROM progreso_lecciones pl JOIN lecciones l ON pl.id_leccion = l.id WHERE pl.id_estudiante = i.id_estudiante AND l.id_curso = c.id AND pl.completada = 1) / (SELECT COUNT(*) FROM lecciones WHERE id_curso = c.id)) * 100,
                    0
                )) AS progreso_pct,
                IFNULL((SELECT SUM(pl.puntos_ganados) FROM progreso_lecciones pl JOIN lecciones l ON pl.id_leccion = l.id WHERE pl.id_estudiante = i.id_estudiante AND l.id_curso = c.id AND pl.completada = 1), 0) AS puntos_ganados
            FROM inscripciones i
            JOIN usuarios u ON i.id_estudiante = u.id
            JOIN cursos c ON i.id_curso = c.id
            WHERE c.id_docente = :id_docente
            ORDER BY c.titulo ASC, u.nombre ASC
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id_docente' => $id_docente]);
        return $stmt->fetchAll();
    }
}
