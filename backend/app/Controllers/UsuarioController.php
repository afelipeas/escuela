<?php
namespace App\Controllers;

use App\Models\UsuarioModel;
use App\Helpers\Response;
use App\Helpers\JWT;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class UsuarioController
{
    private UsuarioModel $usuarioModel;

    public function __construct()
    {
        $this->usuarioModel = new UsuarioModel();
    }

    public function getClientes()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuarioLogueado, ['vendedor', 'admin']);

        $clientes = $this->usuarioModel->getByRol('cliente');
        Response::success($clientes);
    }

    public function getRecientes()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuarioLogueado, 'admin');

        $recientes = $this->usuarioModel->getRecentUsers(5);
        Response::success($recientes);
    }

    /**
     * GET /api/usuarios
     */
    public function getAll()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuarioLogueado, 'admin');

        $usuarios = $this->usuarioModel->getAll();
        $rol = $_GET['rol'] ?? '';
        if ($rol) {
            $usuarios = array_values(array_filter($usuarios, function($u) use ($rol) {
                return $u['rol'] === $rol;
            }));
        }
        Response::success($usuarios);
    }

    /**
     * POST /api/usuarios
     */
    public function create()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuarioLogueado, 'admin');

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (empty($payload['nombre_usuario']) || empty($payload['email']) || empty($payload['password']) || empty($payload['rol'])) {
            Response::error("Por favor completa los campos obligatorios.", 400);
        }

        if (empty($payload['nombre']) || empty($payload['apellido'])) {
            Response::error("El nombre y el apellido son obligatorios.", 400);
        }

        if ($this->usuarioModel->existsEmail($payload['email'])) {
            Response::error("El correo electrónico ya está registrado.", 400);
        }
        if ($this->usuarioModel->existsUsername($payload['nombre_usuario'])) {
            Response::error("El nombre de usuario ya está registrado.", 400);
        }

        $id = $this->usuarioModel->create($payload);
        Response::success(['id' => $id], "Usuario creado con éxito.");
    }

    /**
     * POST /api/usuarios/editar
     */
    public function update()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuarioLogueado, 'admin');

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (empty($payload['id']) || empty($payload['nombre_usuario']) || empty($payload['email']) || empty($payload['rol']) || empty($payload['estado'])) {
            Response::error("Campos insuficientes para editar usuario.", 400);
        }

        if (empty($payload['nombre']) || empty($payload['apellido'])) {
            Response::error("El nombre y el apellido son obligatorios.", 400);
        }

        $id = (int)$payload['id'];

        if ($this->usuarioModel->existsEmail($payload['email'], $id)) {
            Response::error("El correo electrónico ya está registrado por otro usuario.", 400);
        }
        if ($this->usuarioModel->existsUsername($payload['nombre_usuario'], $id)) {
            Response::error("El nombre de usuario ya está registrado por otro usuario.", 400);
        }

        $this->usuarioModel->update($id, $payload);
        Response::success(null, "Usuario actualizado correctamente.");
    }

    /**
     * POST /api/usuarios/eliminar
     */
    public function delete()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuarioLogueado, 'admin');

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (empty($payload['id'])) {
            Response::error("ID de usuario no proporcionado.", 400);
        }

        $id = (int)$payload['id'];

        if ($id === (int)$usuarioLogueado['id']) {
            Response::error("No puedes eliminar tu propia cuenta de administrador.", 400);
        }

        $usuarioTarget = $this->usuarioModel->getById($id);
        if ($usuarioTarget && $usuarioTarget['rol'] === 'admin') {
            $totalAdmins = $this->usuarioModel->countByRole('admin');
            if ($totalAdmins <= 1) {
                Response::error("No se puede eliminar: debe haber al menos un administrador en el sistema.", 400);
            }
        }

        $this->usuarioModel->delete($id);
        Response::success(null, "Usuario desactivado correctamente.");
    }

    /**
     * PUT /api/perfil
     */
    public function updatePerfil()
    {
        $usuarioLogueado = AuthMiddleware::verify();

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (empty($payload['nombre']) || empty($payload['apellido'])) {
            Response::error("El nombre y el apellido son obligatorios.", 400);
        }

        $id = (int)$usuarioLogueado['id'];

        if (isset($payload['email']) && $this->usuarioModel->existsEmail($payload['email'], $id)) {
            Response::error("El correo electrónico ya está registrado por otro usuario.", 400);
        }
        if (isset($payload['nombre_usuario']) && $this->usuarioModel->existsUsername($payload['nombre_usuario'], $id)) {
            Response::error("El nombre de usuario ya está registrado por otro usuario.", 400);
        }

        $this->usuarioModel->update($id, $payload);
        Response::success(null, "Perfil actualizado correctamente.");
    }
}
