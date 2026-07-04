<?php
namespace App\Controllers;

use App\Models\CarritoModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;

class CarritoController
{
    private CarritoModel $carritoModel;

    public function __construct()
    {
        $this->carritoModel = new CarritoModel();
    }

    /**
     * GET /api/carrito
     */
    public function getMiCarrito()
    {
        $usuario = AuthMiddleware::verify();
        
        $items = $this->carritoModel->getByUsuario($usuario['id']);
        Response::success($items);
    }

    /**
     * POST /api/carrito/agregar
     */
    public function agregar()
    {
        $usuario = AuthMiddleware::verify();
        $payload = json_decode(file_get_contents('php://input'), true);

        if (!isset($payload['id_producto'])) {
            Response::error("Falta el id del producto", 400);
        }

        $cantidad = isset($payload['cantidad']) ? (int)$payload['cantidad'] : 1;

        $this->carritoModel->agregarItem($usuario['id'], $payload['id_producto'], $cantidad);
        Response::success(null, "Producto añadido al carrito");
    }

    /**
     * DELETE /api/carrito/eliminar?id_producto=X
     */
    public function eliminar()
    {
        $usuario = AuthMiddleware::verify();
        $id_producto = (int)($_GET['id_producto'] ?? 0);

        if ($id_producto <= 0) {
            Response::error("ID de producto inválido", 400);
        }

        $this->carritoModel->eliminarItem($usuario['id'], $id_producto);
        Response::success(null, "Producto eliminado del carrito");
    }

    /**
     * POST /api/carrito/vaciar
     */
    public function vaciar()
    {
        $usuario = AuthMiddleware::verify();
        $this->carritoModel->vaciar($usuario['id']);
        Response::success(null, "Carrito vaciado");
    }
}
