<?php
namespace App\Controllers;

use App\Models\ClaseModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class ClaseController
{
    private ClaseModel $claseModel;

    public function __construct()
    {
        $this->claseModel = new ClaseModel();
    }

    public function getResumenDocente()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'docente');

        $inscripcionModel = new \App\Models\InscripcionModel();
        $stats = $inscripcionModel->getStatsByDocente($usuario['id']);

        $resumen = [
            [ 'titulo' => 'Mis Cursos', 'valor' => $stats['cursos'], 'icono' => '📚', 'color' => 'info' ],
            [ 'titulo' => 'Alumnos Totales', 'valor' => $stats['estudiantes'], 'icono' => '🎒', 'color' => 'primary' ],
            [ 'titulo' => 'Tareas Pendientes', 'valor' => 0, 'icono' => '📝', 'color' => 'warning' ],
            [ 'titulo' => 'Clase Hoy', 'valor' => '09:00 AM', 'icono' => '⏰', 'color' => 'danger' ]
        ];

        Response::success($resumen);
    }

    public function misAlumnos()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'docente');

        $inscripcionModel = new \App\Models\InscripcionModel();
        $alumnos = $inscripcionModel->getEstudiantesByDocente($usuario['id']);

        Response::success($alumnos);
    }

    /**
     * GET /api/clases
     * Devuelve las próximas clases del docente logueado
     */
    public function getProximas()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente', 'estudiante']);

        if ($usuario['rol'] === 'admin') {
            $clases = $this->claseModel->getProximas();
        } elseif ($usuario['rol'] === 'docente') {
            $clases = $this->claseModel->getProximasByDocente($usuario['id']);
        } else {
            $clases = $this->claseModel->getProximasByEstudiante($usuario['id']);
        }
        
        Response::success($clases);
    }

    /**
     * POST /api/clases
     */
    public function create()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $payload = json_decode(file_get_contents('php://input'), true);
        $payload['id_docente'] = $usuario['id'];

        $requeridos = ['titulo', 'id_curso', 'fecha', 'hora'];
        $errores = Validator::requireFields($payload, $requeridos);

        if (!empty($errores)) {
            Response::error("Formulario de clase incompleto", 400, $errores);
        }

        $id = $this->claseModel->create($payload);
        Response::success(['id' => $id], "Clase programada exitosamente", 201);
    }

    /**
     * POST /api/clases/subir-material
     */
    public function subirMaterial()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $id_clase = (int)($_POST['id_clase'] ?? 0);
        if ($id_clase <= 0) {
            Response::error("ID de clase inválido", 400);
        }

        if (!isset($_FILES['material']) || $_FILES['material']['error'] !== UPLOAD_ERR_OK) {
            Response::error("No se recibió ningún archivo o hubo un error en la carga", 400);
        }

        $file = $_FILES['material'];
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $allowed = ['pdf', 'jpg', 'jpeg', 'png'];

        if (!in_array(strtolower($ext), $allowed)) {
            Response::error("Formato de archivo no permitido. Solo PDF, JPG, PNG.", 400);
        }

        // Crear directorio si no existe
        $uploadDir = 'uploads/clases/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = 'material_clase_' . $id_clase . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $url = 'uploads/clases/' . $fileName;
            
            // Actualizar la clase programada
            $db = \Config\Database::obtenerConexion();
            $stmt = $db->prepare("UPDATE clases_programadas SET material_url = :url, material_nombre = :nom WHERE id = :id");
            $stmt->execute([
                ':url' => $url,
                ':nom' => $file['name'],
                ':id'  => $id_clase
            ]);

            Response::success(['url' => $url], "Archivo de clase subido correctamente");
        } else {
            Response::error("Error al mover el archivo al servidor", 500);
        }
    }
}
