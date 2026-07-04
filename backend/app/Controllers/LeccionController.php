<?php
namespace App\Controllers;

use App\Models\LeccionModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class LeccionController
{
    private LeccionModel $leccionModel;

    public function __construct()
    {
        $this->leccionModel = new LeccionModel();
    }

    /**
     * POST /api/lecciones
     */
    public function create()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        $requeridos = ['titulo', 'id_curso'];
        $errores = Validator::requireFields($payload, $requeridos);

        if (!empty($errores)) {
            Response::error("Datos incompletos", 400, $errores);
        }

        $id = $this->leccionModel->create($payload);
        Response::success(['id' => $id], "Lección creada exitosamente", 201);
    }

    /**
     * POST /api/lecciones/subir-material
     */
    public function subirMaterial()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $id_leccion = (int)($_POST['id_leccion'] ?? 0);
        if ($id_leccion <= 0) {
            Response::error("ID de lección inválido", 400);
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
        $uploadDir = 'uploads/materiales/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = 'material_' . $id_leccion . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            // Guardar en base de datos
            $data = [
                'id_leccion' => $id_leccion,
                'nombre' => $file['name'],
                'tipo' => (strtolower($ext) === 'pdf') ? 'pdf' : 'imagen',
                'url' => 'uploads/materiales/' . $fileName,
                'tamano_kb' => round($file['size'] / 1024)
            ];

            $this->leccionModel->agregarMaterial($data);
            Response::success(['url' => $data['url']], "Archivo subido correctamente");
        } else {
            Response::error("Error al mover el archivo al servidor", 500);
        }
    }

    /**
     * POST /api/lecciones/editar
     */
    public function update()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);
        
        $id = (int)($payload['id'] ?? 0);
        if ($id <= 0) {
            Response::error("ID de lección inválido", 400);
        }

        $requeridos = ['titulo'];
        $errores = Validator::requireFields($payload, $requeridos);

        if (!empty($errores)) {
            Response::error("Datos incompletos", 400, $errores);
        }

        $this->leccionModel->update($id, $payload);
        Response::success(null, "Lección actualizada exitosamente");
    }

    /**
     * POST /api/lecciones/eliminar
     */
    public function delete()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);
        
        $id = (int)($payload['id'] ?? 0);
        if ($id <= 0) {
            Response::error("ID de lección inválido", 400);
        }

        $this->leccionModel->delete($id);
        Response::success(null, "Lección eliminada exitosamente");
    }
}
