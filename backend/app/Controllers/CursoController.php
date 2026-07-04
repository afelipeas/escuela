<?php
namespace App\Controllers;

use App\Models\CursoModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class CursoController
{
    private CursoModel $cursoModel;

    public function __construct()
    {
        $this->cursoModel = new CursoModel();
    }

    /**
     * GET /api/cursos
     */
    public function getAll()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        // Todos pueden ver los cursos si están logueados
        
        $cursos = $this->cursoModel->getAll();
        Response::success($cursos);
    }

    /**
     * POST /api/cursos
     */
    public function create()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuarioLogueado, ['admin', 'docente']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        // Añadimos el ID del docente creador automáticamente
        $payload['id_docente'] = $usuarioLogueado['id'];

        $camposRequeridos = ['titulo'];
        $errores = Validator::requireFields($payload, $camposRequeridos);

        if (!empty($errores)) {
            Response::error("Datos incompletos", 400, $errores);
        }

        $id = $this->cursoModel->create($payload);
        Response::success(['id' => $id], "Curso creado exitosamente", 201);
    }

    public function getMisCursos()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);
        
        $cursos = $this->cursoModel->getByDocente($usuario['id']);
        Response::success($cursos);
    }

    public function getById()
    {
        AuthMiddleware::verify();
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) Response::error("ID inválido", 400);

        $curso = $this->cursoModel->getById($id);
        if (!$curso) Response::notFound("Curso no encontrado");

        Response::success($curso);
    }

    /**
     * POST /api/cursos/subir-material
     */
    public function subirMaterial()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $id_curso = (int)($_POST['id_curso'] ?? 0);
        if ($id_curso <= 0) {
            Response::error("ID de curso inválido", 400);
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
        $uploadDir = 'uploads/cursos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = 'material_curso_' . $id_curso . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $url = 'uploads/cursos/' . $fileName;
            
            // Actualizar el curso
            $db = \Config\Database::obtenerConexion();
            $stmt = $db->prepare("UPDATE cursos SET material_url = :url, material_nombre = :nom WHERE id = :id");
            $stmt->execute([
                ':url' => $url,
                ':nom' => $file['name'],
                ':id'  => $id_curso
            ]);

            Response::success(['url' => $url], "Archivo de curso subido correctamente");
        } else {
            Response::error("Error al mover el archivo al servidor", 500);
        }
    }

    public function getCalificacionesDocente()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);
        
        $datos = $this->cursoModel->getCalificacionesDocente($usuario['id']);
        Response::success($datos);
    }
}
