<?php
namespace App\Controllers;

use App\Models\LeccionModel;
use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class ComentarioController
{
    private LeccionModel $leccionModel;

    public function __construct()
    {
        $this->leccionModel = new LeccionModel();
    }

    /**
     * GET /api/comentarios?id_leccion=X
     */
    public function listar()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $id_leccion = (int)($_GET['id_leccion'] ?? 0);
        if ($id_leccion <= 0) {
            Response::error("ID de lección inválido", 400);
        }

        $comentarios = $this->leccionModel->getComentarios($id_leccion);
        Response::success($comentarios);
    }

    /**
     * POST /api/comentarios
     */
    public function agregar()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (empty($payload['texto']) || empty($payload['id_leccion'])) {
            Response::error("Datos incompletos para el comentario", 400);
        }

        $id = $this->leccionModel->agregarComentario([
            'id_leccion' => $payload['id_leccion'],
            'id_usuario' => $usuario['id'],
            'texto' => $payload['texto']
        ]);

        Response::success(['id' => $id], "Comentario publicado correctamente");
    }

    /**
     * POST /api/comentarios/eliminar
     */
    public function eliminar()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'docente']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        $id_comentario = (int)($payload['id'] ?? 0);
        if ($id_comentario <= 0) {
            Response::error("ID de comentario inválido", 400);
        }

        $comentario = $this->leccionModel->getComentarioById($id_comentario);
        if (!$comentario) {
            Response::notFound("El comentario no existe");
        }

        $this->leccionModel->eliminarComentario($id_comentario);
        Response::success(null, "Comentario eliminado exitosamente");
    }
}