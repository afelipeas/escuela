<?php
namespace App\Controllers;

use App\Models\ProveedorModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class ProveedorController
{
    private ProveedorModel $proveedorModel;

    public function __construct()
    {
        $this->proveedorModel = new ProveedorModel();
    }

    /**
     * GET /api/proveedores
     */
    public function getAll()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $proveedores = $this->proveedorModel->getAll();
        Response::success($proveedores);
    }

    /**
     * POST /api/proveedores
     */
    public function create()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $payload = json_decode(file_get_contents('php://input'), true);

        $errores = Validator::requireFields($payload, ['nombre']);
        if (!empty($errores)) {
            Response::error("El nombre del proveedor es obligatorio", 400, $errores);
        }

        $id = $this->proveedorModel->create($payload);
        Response::success(['id' => $id], "Proveedor registrado", 201);
    }
}
