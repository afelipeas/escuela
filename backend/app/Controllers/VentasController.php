<?php
namespace App\Controllers;

use App\Models\ComisionModel;
use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class VentasController
{
    private ComisionModel $comisionModel;
    private \PDO $db;

    public function __construct()
    {
        $this->comisionModel = new ComisionModel();
        $this->db = \Config\Database::obtenerConexion();
    }

    public function adminKPIs()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'admin');

        $pedidoModel = new \App\Models\PedidoModel();
        $usuarioModel = new \App\Models\UsuarioModel();
        $claseModel = new \App\Models\ClaseModel();

        $ventasMes = $pedidoModel->getMonthlyTotal();
        $ventasMesAnt = $pedidoModel->getMonthlyTotalAnterior();
        $tendenciaVentas = $ventasMesAnt > 0
            ? round(($ventasMes - $ventasMesAnt) / $ventasMesAnt * 100)
            : 0;

        $alumnosMes = $usuarioModel->getNewStudentsCount();
        $alumnosMesAnt = $usuarioModel->getNewStudentsCountAnterior();
        $tendenciaAlumnos = $alumnosMesAnt > 0
            ? round(($alumnosMes - $alumnosMesAnt) / $alumnosMesAnt * 100)
            : 0;

        $clasesMes = $claseModel->getFinalizedCountMes();
        $clasesMesAnt = $claseModel->getFinalizedCountMesAnterior();
        $tendenciaClases = $clasesMesAnt > 0
            ? round(($clasesMes - $clasesMesAnt) / $clasesMesAnt * 100)
            : 0;

        $pendientes = $pedidoModel->getPendingShipmentsCount();

        $stats = [
            [
                'titulo' => 'Ventas del Mes',
                'valor' => '$' . number_format($ventasMes),
                'tendencia' => ($tendenciaVentas >= 0 ? '+' : '') . $tendenciaVentas . '% vs mes anterior',
                'icono' => '💰',
                'clase' => 'kpi-tienda'
            ],
            [
                'titulo' => 'Nuevos Alumnos',
                'valor' => $alumnosMes,
                'tendencia' => ($tendenciaAlumnos >= 0 ? '+' : '') . $tendenciaAlumnos . '% vs mes anterior',
                'icono' => '🎒',
                'clase' => 'kpi-escuela'
            ],
            [
                'titulo' => 'Clases Dictadas',
                'valor' => $clasesMes,
                'tendencia' => ($tendenciaClases >= 0 ? '+' : '') . $tendenciaClases . '% vs mes anterior',
                'icono' => '👨‍🏫',
                'clase' => 'kpi-clases'
            ],
            [
                'titulo' => 'Pendientes Envío',
                'valor' => $pendientes,
                'tendencia' => $pendientes > 5 ? 'Crítico' : 'Normal',
                'icono' => '📦',
                'clase' => $pendientes > 5 ? 'kpi-alert' : 'kpi-admin'
            ]
        ];

        Response::success($stats);
    }

    /**
     * GET /api/ventas/comisiones
     */
    public function misComisiones()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['vendedor', 'admin']);

        $comisiones = $this->comisionModel->getByVendedor($usuario['id']);
        Response::success($comisiones);
    }

    /**
     * GET /api/ventas/recientes
     */
    public function getRecientes()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'vendedor']);

        $pedidoModel = new \App\Models\PedidoModel();

        if ($usuario['rol'] === 'vendedor') {
            $pedidos = $pedidoModel->getByVendedor($usuario['id']);
        } else {
            $pedidos = $pedidoModel->getAll();
        }

        $ventas = array_map(function($p) {
            $productos = '';
            $stmtProds = $this->db->prepare("
                SELECT pr.nombre, dp.cantidad
                FROM detalle_pedidos dp
                JOIN productos pr ON dp.id_producto = pr.id
                WHERE dp.id_pedido = :pedido_id
            ");
            $stmtProds->execute([':pedido_id' => $p['id']]);
            $prods = $stmtProds->fetchAll(\PDO::FETCH_ASSOC);
            $prodNames = [];
            foreach ($prods as $prod) {
                $prodNames[] = $prod['nombre'] . ' (x' . $prod['cantidad'] . ')';
            }
            $productos = !empty($prodNames) ? implode(', ', $prodNames) : 'Producto Escolar';

            return [
                'id' => $p['id'],
                'cliente' => $p['cliente'],
                'producto' => $productos,
                'monto' => '$' . number_format((float)$p['total'], 0),
                'estado' => ucfirst($p['estado']),
                'fecha' => date('d/m/Y', strtotime($p['fecha_pedido']))
            ];
        }, array_slice($pedidos, 0, 10));

        Response::success($ventas);
    }

    /**
     * GET /api/ventas/consultas
     */
    public function getConsultas()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['vendedor', 'admin']);

        // Consultas realistas
        $consultas = [
            [
                'cliente' => 'Pedro Gómez',
                'asunto' => '¿Mi pedido P-1718816281 ya fue despachado?',
                'tiempo' => 'Hace 10 min'
            ],
            [
                'cliente' => 'Camila Rivas',
                'asunto' => 'Problema al canjear el Termo de Acero',
                'tiempo' => 'Hace 45 min'
            ],
            [
                'cliente' => 'Mateo Delgado',
                'asunto' => '¿Cómo acumulo más Puntos Fe?',
                'tiempo' => 'Hace 2 horas'
            ]
        ];

        Response::success($consultas);
    }

    /**
     * GET /api/ventas/reporte
     */
    public function getReporte()
    {
        $usuarioLogueado = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuarioLogueado, ['admin', 'vendedor']);

        $fechaInicio = $_GET['fecha_inicio'] ?? '';
        $fechaFin = $_GET['fecha_fin'] ?? '';
        $vendedorId = $_GET['vendedor_id'] ?? '';

        if ($usuarioLogueado['rol'] === 'vendedor') {
            $vendedorId = $usuarioLogueado['id'];
        }

        if (empty($fechaInicio) || empty($fechaFin)) {
            Response::error("Las fechas de inicio y fin son obligatorias.", 400);
        }

        // Resumen
        $whereClause = "WHERE DATE(p.fecha_pedido) >= :fecha_inicio AND DATE(p.fecha_pedido) <= :fecha_fin";
        $params = [
            ':fecha_inicio' => $fechaInicio,
            ':fecha_fin' => $fechaFin
        ];

        if (!empty($vendedorId)) {
            $whereClause .= " AND p.id_vendedor = :vendedor_id";
            $params[':vendedor_id'] = $vendedorId;
        }

        $stmtResumen = $this->db->prepare("
            SELECT 
                COALESCE(SUM(p.total), 0) as total_monto,
                COUNT(p.id) as transacciones
            FROM pedidos p
            $whereClause
        ");
        $stmtResumen->execute($params);
        $resumenData = $stmtResumen->fetch(\PDO::FETCH_ASSOC);

        $totalMonto = (float)$resumenData['total_monto'];
        $transacciones = (int)$resumenData['transacciones'];
        $ticketPromedio = $transacciones > 0 ? $totalMonto / $transacciones : 0;

        $whereComision = "WHERE DATE(p.fecha_pedido) >= :fecha_inicio AND DATE(p.fecha_pedido) <= :fecha_fin";
        $paramsComision = [
            ':fecha_inicio' => $fechaInicio,
            ':fecha_fin' => $fechaFin
        ];
        if (!empty($vendedorId)) {
            $whereComision .= " AND cv.id_vendedor = :vendedor_id";
            $paramsComision[':vendedor_id'] = $vendedorId;
        }
        $stmtComision = $this->db->prepare("
            SELECT COALESCE(SUM(cv.monto), 0) as total_comision
            FROM comisiones_vendedor cv
            JOIN pedidos p ON cv.id_pedido = p.id
            $whereComision
        ");
        $stmtComision->execute($paramsComision);
        $totalComision = (float)$stmtComision->fetchColumn();

        $resumen = [
            'totalVentas' => '$' . number_format($totalMonto, 0),
            'totalTransacciones' => $transacciones,
            'ticketPromedio' => '$' . number_format($ticketPromedio, 0),
            'comisionesTotales' => '$' . number_format($totalComision, 0)
        ];

        // Por Vendedor
        $porVendedor = [];
        if ($usuarioLogueado['rol'] === 'admin') {
            $stmtPorVendedor = $this->db->prepare("
                SELECT 
                    u.id as vendedor_id,
                    CONCAT(u.nombre, ' ', u.apellido) as nombre,
                    COUNT(p.id) as ventas,
                    COALESCE(SUM(p.total), 0) as total,
                    COALESCE(SUM(cv.monto), 0) as comision
                FROM usuarios u
                LEFT JOIN pedidos p ON p.id_vendedor = u.id AND DATE(p.fecha_pedido) >= :fecha_inicio AND DATE(p.fecha_pedido) <= :fecha_fin
                LEFT JOIN comisiones_vendedor cv ON cv.id_pedido = p.id AND cv.id_vendedor = u.id
                WHERE u.rol = 'vendedor'
                GROUP BY u.id
                ORDER BY total DESC
            ");
            $stmtPorVendedor->execute([
                ':fecha_inicio' => $fechaInicio,
                ':fecha_fin' => $fechaFin
            ]);
            $vendedoresData = $stmtPorVendedor->fetchAll(\PDO::FETCH_ASSOC);

            $globalSales = $totalMonto > 0 ? $totalMonto : 1;
            foreach ($vendedoresData as $vd) {
                $porVendedor[] = [
                    'id' => $vd['vendedor_id'],
                    'nombre' => $vd['nombre'],
                    'ventas' => (int)$vd['ventas'],
                    'total' => '$' . number_format((float)$vd['total'], 0),
                    'comision' => '$' . number_format((float)$vd['comision'], 0),
                    'porcentaje' => round(((float)$vd['total'] / $globalSales) * 100)
                ];
            }
        }

        // Detalle de Transacciones
        $stmtDetalle = $this->db->prepare("
            SELECT 
                DATE(p.fecha_pedido) as fecha,
                CONCAT(uv.nombre, ' ', uv.apellido) as vendedor,
                CONCAT(uc.nombre, ' ', uc.apellido) as cliente,
                p.total as monto,
                p.estado,
                p.id as pedido_id
            FROM pedidos p
            JOIN usuarios uc ON p.id_cliente = uc.id
            LEFT JOIN usuarios uv ON p.id_vendedor = uv.id
            $whereClause
            ORDER BY p.fecha_pedido DESC
        ");
        $stmtDetalle->execute($params);
        $detalleRaw = $stmtDetalle->fetchAll(\PDO::FETCH_ASSOC);

        $detalle = [];
        foreach ($detalleRaw as $dr) {
            $stmtProds = $this->db->prepare("
                SELECT pr.nombre, dp.cantidad
                FROM detalle_pedidos dp
                JOIN productos pr ON dp.id_producto = pr.id
                WHERE dp.id_pedido = :pedido_id
            ");
            $stmtProds->execute([':pedido_id' => $dr['pedido_id']]);
            $prods = $stmtProds->fetchAll(\PDO::FETCH_ASSOC);

            $prodNames = [];
            foreach ($prods as $p) {
                $prodNames[] = $p['nombre'] . ' (x' . $p['cantidad'] . ')';
            }
            $productoStr = !empty($prodNames) ? implode(', ', $prodNames) : 'Producto Escolar';

            $detalle[] = [
                'fecha' => date('Y-m-d', strtotime($dr['fecha'])),
                'vendedor' => $dr['vendedor'] ?? 'Venta Online',
                'cliente' => $dr['cliente'],
                'producto' => $productoStr,
                'monto' => '$' . number_format((float)$dr['monto'], 0),
                'estado' => ucfirst($dr['estado'])
            ];
        }

        Response::success([
            'resumen' => $resumen,
            'porVendedor' => $porVendedor,
            'detalle' => $detalle
        ]);
    }

    /**
     * GET /api/ventas/top-productos
     */
    public function topProductos()
    {
        AuthMiddleware::verify();
        $productoModel = new \App\Models\ProductoModel();
        $productos = $productoModel->getTopVendidos(5);
        Response::success($productos);
    }

    /**
     * GET /api/ventas/estadisticas
     */
    public function estadisticas()
    {
        AuthMiddleware::verify();
        $productoModel = new \App\Models\ProductoModel();
        $stats = $productoModel->getEstadisticas();
        Response::success($stats);
    }
}
