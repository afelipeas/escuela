<?php
namespace App\Controllers;

use App\Models\InscripcionModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class AulaController
{
    private InscripcionModel $inscripcionModel;

    public function __construct()
    {
        $this->inscripcionModel = new InscripcionModel();
    }

    public function getResumenEstudiante()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'estudiante');

        $stats = $this->inscripcionModel->getStatsEstudiante($usuario['id']);

        $resumen = [
            [ 'titulo' => 'Mis Puntos Fe', 'valor' => number_format($stats['puntos']), 'icono' => '💎', 'clase' => 'kpi-puntos' ],
            [ 'titulo' => 'Logros Ganados', 'valor' => $stats['logros'], 'icono' => '🏆', 'clase' => 'kpi-logros' ],
            [ 'titulo' => 'Cursos Activos', 'valor' => count($this->inscripcionModel->getCursosEstudiante($usuario['id'])), 'icono' => '📚', 'clase' => 'kpi-cursos' ]
        ];

        Response::success($resumen);
    }

    /**
     * GET /api/aula/cursos
     * Lista los cursos matriculados por el estudiante con su progreso
     */
    public function misCursos()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['estudiante', 'admin']);

        $misCursos = $this->inscripcionModel->getCursosEstudiante($usuario['id']);
        Response::success($misCursos);
    }

    /**
     * GET /api/aula/mis-inscripciones
     * Devuelve solo los IDs de los cursos en los que el estudiante está inscrito,
     * SIN filtrar por cantidad de lecciones. Usado por "Explorar Cursos" para
     * marcar con precisión qué cursos ya tiene el estudiante (incluyendo los
     * que aún no tienen lecciones cargadas).
     */
    public function getMisInscripcionesIds()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'estudiante');

        $ids = $this->inscripcionModel->getIdsInscritos($usuario['id']);
        Response::success($ids);
    }

    public function getLecciones()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['estudiante', 'admin', 'docente']);

        $id_curso = (int)($_GET['id_curso'] ?? 0);
        if ($id_curso <= 0) {
            Response::error("ID de curso inválido", 400);
        }

        $leccionModel = new \App\Models\LeccionModel();
        $lecciones = $leccionModel->getByCurso($id_curso);
        Response::success($lecciones);
    }

    public function getDetalleLeccion()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['estudiante', 'admin', 'docente']);

        $id_leccion = (int)($_GET['id_leccion'] ?? 0);
        if ($id_leccion <= 0) {
            Response::error("ID de lección inválido", 400);
        }

        $leccionModel = new \App\Models\LeccionModel();
        // Pasamos el ID del usuario para que el modelo verifique si ya la completó
        $leccion = $leccionModel->getById($id_leccion, $usuario['id']);
        
        if (!$leccion) {
            Response::notFound("La lección no existe");
        }

        $leccion['materiales'] = $leccionModel->getMateriales($id_leccion);
        Response::success($leccion);
    }

    /**
     * POST /api/aula/completar-leccion
     */
    public function completarLeccion()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['estudiante']);

        $payload = json_decode(file_get_contents('php://input'), true);
        $id_leccion = $payload['id_leccion'] ?? 0;
        
        if ($id_leccion <= 0) {
            Response::error("Se requiere el ID de la lección", 400);
        }

        $db = \Config\Database::obtenerConexion();
        
        try {
            $db->beginTransaction();

            // 1. Marcar progreso en tabla detalle
            $puntos_leccion = 50;
            $sql = "INSERT INTO progreso_lecciones (id_estudiante, id_leccion, completada, puntos_ganados, fecha_completado)
                    VALUES (:est, :lec, 1, :pts, NOW())
                    ON DUPLICATE KEY UPDATE completada = 1, fecha_completado = NOW()";
            $stmt = $db->prepare($sql);
            $stmt->execute([':est' => $usuario['id'], ':lec' => $id_leccion, ':pts' => $puntos_leccion]);

            // 2. Ejecutar disparadores automáticos de logros
            $logroModel = new \App\Models\LogroModel();
            $nuevosLogros = $logroModel->verificarYOtorgar($usuario['id']);

            // 3. Obtener el nuevo total de puntos REAL de la base de datos
            $stats = $this->inscripcionModel->getStatsEstudiante($usuario['id']);
            $puntos_totales = $stats['puntos'];

            $db->commit();
            
            $mensaje = "¡Excelente! Has ganado $puntos_leccion puntos.";
            if (count($nuevosLogros) > 0) {
                $nombres = array_map(fn($l) => $l['titulo'], $nuevosLogros);
                $mensaje .= " ¡Nuevas medallas obtenidas: " . implode(', ', $nombres) . "! 🏆";
            }

            Response::success([
                'puntos_ganados' => $puntos_leccion,
                'puntos_totales' => $puntos_totales,
                'nuevos_logros' => $nuevosLogros
            ], $mensaje);

        } catch (\Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_log("Error en completarLeccion: " . $e->getMessage());
            Response::error("Error al registrar el progreso: " . $e->getMessage(), 500);
        }
    }
    public function inscribir()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'estudiante');

        $payload = json_decode(file_get_contents('php://input'), true);
        $id_curso = (int)($payload['id_curso'] ?? 0);

        if ($id_curso <= 0) {
            Response::error("Se requiere el ID del curso", 400);
        }

        $db = \Config\Database::obtenerConexion();
        
        // Verificar si ya está inscrito
        $stmt = $db->prepare("SELECT id FROM inscripciones WHERE id_estudiante = :est AND id_curso = :cur");
        $stmt->execute([':est' => $usuario['id'], ':cur' => $id_curso]);
        if ($stmt->fetch()) {
            Response::error("Ya estás inscrito en este curso", 400);
        }

        // Crear la inscripción
        $sql = "INSERT INTO inscripciones (id_estudiante, id_curso, progreso_pct, fecha_inscripcion) 
                VALUES (:est, :cur, 0, NOW())";
        $stmt = $db->prepare($sql);
        $success = $stmt->execute([':est' => $usuario['id'], ':cur' => $id_curso]);

        if ($success) {
            Response::success(null, "¡Inscripción exitosa! Ya puedes comenzar tus clases.");
        } else {
            Response::error("No se pudo procesar la inscripción", 500);
        }
    }

    public function getComentarios()
    {
        AuthMiddleware::verify();
        $id_leccion = (int)($_GET['id_leccion'] ?? 0);
        
        if ($id_leccion <= 0) {
            Response::error("ID de lección inválido", 400);
        }

        $leccionModel = new \App\Models\LeccionModel();
        $comentarios = $leccionModel->getComentarios($id_leccion);
        Response::success($comentarios);
    }

    public function postComentario()
    {
        $usuario = AuthMiddleware::verify();
        $payload = json_decode(file_get_contents('php://input'), true);
        
        if (empty($payload['texto']) || empty($payload['id_leccion'])) {
            Response::error("Datos incompletos para el comentario", 400);
        }

        $leccionModel = new \App\Models\LeccionModel();
        $id = $leccionModel->agregarComentario([
            'id_leccion' => $payload['id_leccion'],
            'id_usuario' => $usuario['id'],
            'texto' => $payload['texto']
        ]);

        Response::success(['id' => $id], "Comentario publicado correctamente");
    }
}
