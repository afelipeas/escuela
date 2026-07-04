<?php
namespace App\Models;

use Config\Database;
use PDO;

class InscripcionModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    /**
     * Cursos donde el estudiante está matriculado
     */
    public function getCursosEstudiante(int $id_estudiante)
    {
        $sql = "
            SELECT 
                c.*, 
                CONCAT(u.nombre, ' ', u.apellido) as instructor,
                (SELECT id FROM lecciones WHERE id_curso = c.id ORDER BY orden ASC LIMIT 1) as primera_leccion_id,
                (SELECT COUNT(*) FROM lecciones WHERE id_curso = c.id) as total_lecciones,
                (SELECT COUNT(*) FROM progreso_lecciones pl 
                 JOIN lecciones l ON l.id = pl.id_leccion 
                 WHERE l.id_curso = c.id AND pl.id_estudiante = :id_est1 AND pl.completada = 1) as lecciones_completadas
            FROM inscripciones i
            JOIN cursos c ON c.id = i.id_curso
            JOIN usuarios u ON u.id = c.id_docente
            WHERE i.id_estudiante = :id_est2
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id_est1' => $id_estudiante,
            ':id_est2' => $id_estudiante
        ]);
        $cursos = $stmt->fetchAll();

        // Calcular el porcentaje en PHP para mayor claridad
        foreach ($cursos as &$curso) {
            $total = (int)$curso['total_lecciones'];
            $completadas = (int)$curso['lecciones_completadas'];
            $curso['progreso_pct'] = ($total > 0) ? round(($completadas / $total) * 100) : 0;
        }

        return $cursos;
    }

    /**
     * Devuelve solo los IDs de cursos en los que el estudiante está inscrito.
     * Sin filtros adicionales (no excluye cursos sin lecciones).
     * Usado por "Explorar Cursos" para marcar correctamente el estado de inscripción.
     */
    public function getIdsInscritos(int $id_estudiante): array
    {
        $stmt = $this->db->prepare(
            "SELECT id_curso FROM inscripciones WHERE id_estudiante = :id"
        );
        $stmt->execute([':id' => $id_estudiante]);
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id_curso');
    }

    public function getStatsByDocente(int $id_docente)
    {
        // Contar cursos del docente
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM cursos WHERE id_docente = :id");
        $stmt->execute([':id' => $id_docente]);
        $cursos = $stmt->fetch()['total'] ?? 0;

        // Contar estudiantes únicos en sus cursos
        $stmt = $this->db->prepare("
            SELECT COUNT(DISTINCT i.id_estudiante) as total 
            FROM inscripciones i
            JOIN cursos c ON i.id_curso = c.id
            WHERE c.id_docente = :id
        ");
        $stmt->execute([':id' => $id_docente]);
        $estudiantes = $stmt->fetch()['total'] ?? 0;

        return [
            'cursos' => $cursos,
            'estudiantes' => $estudiantes
        ];
    }

    public function getEstudiantesByDocente(int $id_docente)
    {
        $sql = "
            SELECT 
                u.id, u.nombre, u.apellido, u.email, u.fecha_registro,
                COUNT(DISTINCT c.id) as cursos_inscritos,
                MAX(i.fecha_inscripcion) as ultima_inscripcion
            FROM usuarios u
            JOIN inscripciones i ON u.id = i.id_estudiante
            JOIN cursos c ON i.id_curso = c.id
            WHERE c.id_docente = :id
            GROUP BY u.id, u.nombre, u.apellido, u.email, u.fecha_registro
            ORDER BY u.nombre ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id_docente]);
        return $stmt->fetchAll();
    }

    public function getStatsEstudiante(int $id_estudiante)
    {
        // Sumar puntos acumulados
        $stmt = $this->db->prepare("SELECT SUM(puntos_ganados) as total FROM progreso_lecciones WHERE id_estudiante = :id AND completada = 1");
        $stmt->execute([':id' => $id_estudiante]);
        $puntos = $stmt->fetch()['total'] ?? 0;

        // Contar logros
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM logros_estudiante WHERE id_estudiante = :id");
        $stmt->execute([':id' => $id_estudiante]);
        $logros = $stmt->fetch()['total'] ?? 0;

        return [
            'puntos' => (int)$puntos,
            'logros' => (int)$logros
        ];
    }

    /**
     * Marca una lección como completada
     */
    public function completarLeccion(int $id_estudiante, int $id_leccion)
    {
        // Insertamos o actualizamos (si ya existía, no duplicamos, solo evitamos el error)
        $sql = "INSERT INTO progreso_lecciones (id_estudiante, id_leccion, completada, puntos_ganados, fecha_completado)
                VALUES (:est, :lec, 1, 50, NOW())
                ON DUPLICATE KEY UPDATE completada = 1";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':est' => $id_estudiante,
            ':lec' => $id_leccion
        ]);
    }
}
