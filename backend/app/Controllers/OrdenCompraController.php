<?php
namespace App\Controllers;

use App\Models\OrdenCompraModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class OrdenCompraController
{
    private OrdenCompraModel $ordenesModel;

    public function __construct()
    {
        $this->ordenesModel = new OrdenCompraModel();
    }

/**
     * GET /api/ordenes-compra
      */
     public function getAll()
     {
         $usuario = AuthMiddleware::verify();
         RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);
 
         $ordenes = $this->ordenesModel->getAll();
         Response::success($ordenes);
     }

    /**
     * GET /api/ordenes-compra/reporte?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
     */
    public function reporte()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fechaFin    = $_GET['fecha_fin'] ?? date('Y-m-d');

        if (!Validator::isDate($fechaInicio) || !Validator::isDate($fechaFin)) {
            Response::error("Las fechas deben tener formato YYYY-MM-DD", 400);
        }

        $data = $this->ordenesModel->getReportePorRango($fechaInicio, $fechaFin);
        Response::success($data);
    }

    /**
     * POST /api/ordenes-compra
     */
    public function create()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $payload = json_decode(file_get_contents('php://input'), true);

        $errores = Validator::requireFields($payload, ['id_proveedor', 'total', 'detalles']);
        if (!empty($errores)) {
            Response::error("Información de la orden incompleta", 400, $errores);
        }

        $payload['id_responsable'] = $usuario['id'];

        try {
            $id = $this->ordenesModel->create($payload, $payload['detalles']);
            Response::success(['id_orden' => $id], "Orden de compra generada al proveedor", 201);
        } catch (\Exception $e) {
            error_log("Error en OrdenCompraController::create: " . $e->getMessage());
            Response::error("Error al registrar la orden: " . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/ordenes-compra/detalle
     */
    public function getDetalle()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            Response::error("ID de orden inválido", 400);
        }

        $orden = $this->ordenesModel->getById($id);
        if (!$orden) {
            Response::notFound("La orden no existe");
        }

        $detalles = $this->ordenesModel->getDetallesByOrden($id);
        $orden['detalles'] = $detalles;

        Response::success($orden);
    }

    /**
     * POST /api/ordenes-compra/editar
     */
    public function update()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $payload = json_decode(file_get_contents('php://input'), true);

        $id = (int)($payload['id'] ?? 0);
        if ($id <= 0) {
            Response::error("ID de orden inválido", 400);
        }

        $errores = Validator::requireFields($payload, ['id_proveedor', 'total', 'estado']);
        if (!empty($errores)) {
            Response::error("Datos incompletos", 400, $errores);
        }

        try {
            $this->ordenesModel->update($id, $payload);
            Response::success(null, "Orden actualizada correctamente");
        } catch (\Exception $e) {
            error_log("Error en OrdenCompraController::update: " . $e->getMessage());
            Response::error("Error al actualizar la orden: " . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/ordenes-compra/eliminar
     */
    public function delete()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $payload = json_decode(file_get_contents('php://input'), true);

        $id = (int)($payload['id'] ?? 0);
        if ($id <= 0) {
            Response::error("ID de orden inválido", 400);
        }

        try {
            $this->ordenesModel->delete($id);
            Response::success(null, "Orden eliminada correctamente");
        } catch (\Exception $e) {
            error_log("Error en OrdenCompraController::delete: " . $e->getMessage());
            Response::error("Error al eliminar la orden: " . $e->getMessage(), 500);
        }
    }
}
