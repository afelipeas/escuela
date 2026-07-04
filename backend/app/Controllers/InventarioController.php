<?php
namespace App\Controllers;

use App\Models\InventarioModel;
use App\Models\ProductoModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class InventarioController
{
    private InventarioModel $inventarioModel;
    private ProductoModel $productoModel;

    public function __construct()
    {
        $this->inventarioModel = new InventarioModel();
        $this->productoModel = new ProductoModel();
    }

    public function getResumen()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $res = $this->productoModel->getStockSummary();

        $stats = [
            [ 'titulo' => 'Stock Total', 'valor' => number_format($res['total']), 'tendencia' => '+12%', 'icono' => '📊', 'clase' => 'kpi-azul' ],
            [ 'titulo' => 'Entradas Mes', 'valor' => '10', 'tendencia' => '+5', 'icono' => '📥', 'clase' => 'kpi-verde' ],
            [ 'titulo' => 'Salidas Hoy', 'valor' => '0', 'tendencia' => 'Normal', 'icono' => '📤', 'clase' => 'kpi-naranja' ],
            [ 'titulo' => 'Alertas Críticas', 'valor' => $res['criticos'], 'tendencia' => $res['criticos'] > 0 ? 'Urgente' : 'Óptimo', 'icono' => '⚠️', 'clase' => 'kpi-rojo' ]
        ];

        Response::success($stats);
    }

    public function getStockCritico()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $res = $this->productoModel->getCriticalStock();
        Response::success($res);
    }

    public function getInventarioCompleto()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $res = $this->productoModel->getInventarioCompleto();
        Response::success($res);
    }

    /**
     * GET /api/inventario/movimientos
     */
    public function getMovimientos()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $movimientos = $this->inventarioModel->getMovimientos();
        Response::success($movimientos);
    }

    /**
     * GET /api/inventario/reporte?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
     */
    public function getReporte()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fechaFin    = $_GET['fecha_fin'] ?? date('Y-m-d');

        if (!Validator::isDate($fechaInicio) || !Validator::isDate($fechaFin)) {
            Response::error("Las fechas deben tener formato YYYY-MM-DD", 400);
        }

        $data = $this->inventarioModel->getReportePorRango($fechaInicio, $fechaFin);
        Response::success($data);
    }

    /**
     * POST /api/inventario/ajuste
     * Permite ajustar fallos de conteo (sobrantes/faltantes en físico vs sistema)
     */
    public function ajusteManual()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['almacen', 'admin']);

        $payload = json_decode(file_get_contents('php://input'), true);
        $errores = Validator::requireFields($payload, ['id_producto', 'cantidad', 'motivo']);
        
        if (!empty($errores)) {
            Response::error("Información incompleta", 400, $errores);
        }

        $payload['id_responsable'] = $usuario['id'];
        
        // 1. Guardar la trazabilidad en Kardex
        $this->inventarioModel->registrarAjuste($payload);
        
        // 2. Modificar el acumulador del catálogo de tienda
        $this->productoModel->updateStock($payload['id_producto'], $payload['cantidad']);

        Response::success(null, "Ajuste de inventario aplicado correctamente");
    }
}
