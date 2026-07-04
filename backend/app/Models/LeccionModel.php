<?php
namespace App\Models;

use Config\Database;
use PDO;

class LeccionModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    /**
     * Obtiene el listado de lecciones de un curso
     */
    public function getByCurso(int $id_curso)
    {
        $stmt = $this->db->prepare("SELECT * FROM lecciones WHERE id_curso = :id ORDER BY orden ASC");
        $stmt->execute([':id' => $id_curso]);
        return $stmt->fetchAll();
    }

    /**
     * Obtiene el detalle de una lección específica, incluyendo si el estudiante ya la completó
     */
    public function getById(int $id, ?int $id_estudiante = null)
    {
        $sql = "
            SELECT l.*, c.titulo as materia, IFNULL(p.completada, 0) as completada
            FROM lecciones l
            JOIN cursos c ON c.id = l.id_curso
            LEFT JOIN progreso_lecciones p ON p.id_leccion = l.id AND p.id_estudiante = :id_est
            WHERE l.id = :id 
            LIMIT 1
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':id_est' => $id_estudiante
        ]);
        
        return $stmt->fetch();
    }

    /**
     * Obtener materiales de una lección
     */
    public function getMateriales(int $id_leccion)
    {
        $stmt = $this->db->prepare("SELECT * FROM materiales_leccion WHERE id_leccion = :id");
        $stmt->execute([':id' => $id_leccion]);
        return $stmt->fetchAll();
    }

    public function getComentarios(int $id_leccion)
    {
        $sql = "
            SELECT c.*, u.nombre, u.rol, u.foto_url 
            FROM comentarios_leccion c
            JOIN usuarios u ON u.id = c.id_usuario
            WHERE c.id_leccion = :id
            ORDER BY c.fecha DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id_leccion]);
        return $stmt->fetchAll();
    }

    public function agregarComentario(array $data)
    {
        $sql = "INSERT INTO comentarios_leccion (id_leccion, id_usuario, texto) VALUES (:lec, :usr, :txt)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':lec' => $data['id_leccion'],
            ':usr' => $data['id_usuario'],
            ':txt' => $data['texto']
        ]);
        return $this->db->lastInsertId();
    }

    public function create(array $data)
    {
        $sql = "INSERT INTO lecciones (id_curso, titulo, descripcion, video_url, referencias_url, orden) 
                VALUES (:cur, :tit, :des, :vid, :ref, :ord)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cur' => $data['id_curso'],
            ':tit' => $data['titulo'],
            ':des' => $data['descripcion'] ?? null,
            ':vid' => $data['video_url'] ?? null,
            ':ref' => $data['referencias_url'] ?? null,
            ':ord' => $data['orden'] ?? 1
        ]);
        return $this->db->lastInsertId();
    }

    public function agregarMaterial(array $data)
    {
        $sql = "INSERT INTO materiales_leccion (id_leccion, nombre, tipo, url, tamano_kb) 
                VALUES (:lec, :nom, :tip, :url, :tam)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':lec' => $data['id_leccion'],
            ':nom' => $data['nombre'],
            ':tip' => $data['tipo'],
            ':url' => $data['url'],
            ':tam' => $data['tamano_kb']
        ]);
    }

    public function update(int $id, array $data)
    {
        $sql = "UPDATE lecciones 
                SET titulo = :tit, descripcion = :des, video_url = :vid, referencias_url = :ref, orden = :ord 
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id' => $id,
            ':tit' => $data['titulo'],
            ':des' => $data['descripcion'] ?? null,
            ':vid' => $data['video_url'] ?? null,
            ':ref' => $data['referencias_url'] ?? null,
            ':ord' => $data['orden'] ?? 1
        ]);
    }

    public function delete(int $id)
    {
        $this->db->prepare("DELETE FROM comentarios_leccion WHERE id_leccion = :id")->execute([':id' => $id]);
        $this->db->prepare("DELETE FROM materiales_leccion WHERE id_leccion = :id")->execute([':id' => $id]);
        $this->db->prepare("DELETE FROM progreso_lecciones WHERE id_leccion = :id")->execute([':id' => $id]);
        $stmt = $this->db->prepare("DELETE FROM lecciones WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public function eliminarComentario(int $id_comentario)
    {
        $stmt = $this->db->prepare("DELETE FROM comentarios_leccion WHERE id = :id");
        return $stmt->execute([':id' => $id_comentario]);
    }

    public function getComentarioById(int $id_comentario)
    {
        $stmt = $this->db->prepare("SELECT * FROM comentarios_leccion WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id_comentario]);
        return $stmt->fetch();
    }
}
