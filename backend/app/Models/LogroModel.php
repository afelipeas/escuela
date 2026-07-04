<?php
namespace App\Models;

use Config\Database;
use PDO;

class LogroModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getAll()
    {
        return $this->db->query("SELECT * FROM logros ORDER BY puntos_requeridos ASC")->fetchAll();
    }

    public function getByEstudiante(int $id_estudiante)
    {
        $stmt = $this->db->prepare("
            SELECT l.*, le.fecha_obtenido 
            FROM logros_estudiante le
            JOIN logros l ON l.id = le.id_logro
            WHERE le.id_estudiante = :id_estudiante
            ORDER BY le.fecha_obtenido DESC
        ");
        $stmt->execute([':id_estudiante' => $id_estudiante]);
        return $stmt->fetchAll();
    }

    public function desbloquear(int $id_estudiante, int $id_logro)
    {
        try {
            // Verificar si ya lo tiene para no duplicar puntos de premio
            $check = $this->db->prepare("SELECT id FROM logros_estudiante WHERE id_estudiante = ? AND id_logro = ?");
            $check->execute([$id_estudiante, $id_logro]);
            if ($check->fetch()) return false;

            // Insertar el logro
            $stmt = $this->db->prepare("INSERT INTO logros_estudiante (id_estudiante, id_logro) VALUES (?, ?)");
            $stmt->execute([$id_estudiante, $id_logro]);

            // Sumar los puntos de premio al usuario
            $stmtLogro = $this->db->prepare("SELECT puntos_premio FROM logros WHERE id = ?");
            $stmtLogro->execute([$id_logro]);
            $logro = $stmtLogro->fetch();

            if ($logro && $logro['puntos_premio'] > 0) {
                $upd = $this->db->prepare("UPDATE usuarios SET puntos = IFNULL(puntos, 0) + ? WHERE id = ?");
                $upd->execute([$logro['puntos_premio'], $id_estudiante]);
            }

            return true;
        } catch (\PDOException $e) {
            error_log("Error desbloqueando logro: " . $e->getMessage());
            return false; 
        }
    }

    /**
     * Disparador automático que verifica condiciones para otorgar logros
     */
    public function verificarYOtorgar(int $id_estudiante)
    {
        $nuevos_logros = [];

        // 1. Obtener estadísticas actuales (Usamos parámetros únicos por si el driver no permite reuso)
        $sql = "SELECT 
                    (SELECT COUNT(*) FROM progreso_lecciones WHERE id_estudiante = :id1 AND completada = 1) as total_lecciones,
                    (SELECT COUNT(*) FROM inscripciones WHERE id_estudiante = :id2) as total_cursos,
                    (SELECT COUNT(*) FROM comentarios_leccion WHERE id_usuario = :id3) as total_comentarios,
                    (SELECT puntos FROM usuarios WHERE id = :id4) as total_puntos";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id1' => $id_estudiante,
            ':id2' => $id_estudiante,
            ':id3' => $id_estudiante,
            ':id4' => $id_estudiante
        ]);
        $stats = $stmt->fetch();

        if (!$stats) return [];

        // 2. Definición de triggers (ID => Condición)
        $triggers = [
            1 => $stats['total_lecciones'] >= 1,   // Primeros Pasos
            2 => $stats['total_lecciones'] >= 5,   // Explorador Bíblico
            3 => $stats['total_comentarios'] >= 1, // Buen Amigo
            4 => $stats['total_cursos'] >= 3,      // Explorador
            5 => (int)$stats['total_puntos'] >= 1000,   // Devoto
        ];

        // 3. Procesar cada disparador
        $stmtFetch = $this->db->prepare("SELECT titulo, icono FROM logros WHERE id = ?");

        foreach ($triggers as $id_logro => $cumple) {
            if ($cumple) {
                if ($this->desbloquear($id_estudiante, $id_logro)) {
                    $stmtFetch->execute([$id_logro]);
                    $logroInfo = $stmtFetch->fetch();
                    if ($logroInfo) {
                        $nuevos_logros[] = $logroInfo;
                    }
                }
            }
        }

        return $nuevos_logros;
    }
}
