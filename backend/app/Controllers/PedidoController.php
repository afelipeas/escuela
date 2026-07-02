<?php
namespace App\Controllers;

use App\Models\PedidoModel;
use App\Models\CarritoModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class PedidoController
{
    private PedidoModel $pedidoModel;
    private CarritoModel $carritoModel;
    private \PDO $db;

    public function __construct()
    {
        $this->pedidoModel = new PedidoModel();
        $this->carritoModel = new CarritoModel();
        $this->db = \Config\Database::obtenerConexion();
    }

    /**
     * GET /api/pedidos
     */
    public function getMisPedidos()
    {
        $usuario = AuthMiddleware::verify();
        
        if ($usuario['rol'] === 'admin' || $usuario['rol'] === 'vendedor') {
            $pedidos = $this->pedidoModel->getAll(); // Admin ve todos
        } else {
            $pedidos = $this->pedidoModel->getByCliente($usuario['id']); // Cliente ve los suyos
        }
        
        Response::success($pedidos);
    }

    /**
     * POST /api/pedidos/crear
     * Creación manual de pedido por parte del vendedor
     */
    public function crearPedido()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'vendedor');

        $payload = json_decode(file_get_contents('php://input'), true);

        $req = ['id_cliente', 'nombre_envio', 'email_envio', 'direccion_envio', 'ciudad_envio', 'subtotal', 'total', 'metodo_pago', 'detalle'];
        $errores = Validator::requireFields($payload, $req);
        if (!empty($errores)) {
            Response::error("Formulario incompleto", 400, $errores);
        }

        try {
            $this->pedidoModel->beginTransaction();

            $codigo = '#PED-' . time();
            $stmt = $this->db->prepare("
                INSERT INTO pedidos (codigo, id_cliente, id_vendedor, nombre_envio, email_envio, direccion_envio, ciudad_envio, subtotal, costo_envio, total, metodo_pago, estado, notas)
                VALUES (:codigo, :id_cliente, :id_vendedor, :nombre_envio, :email_envio, :direccion_envio, :ciudad_envio, :subtotal, :costo_envio, :total, :metodo_pago, :estado, :notas)
            ");
            $stmt->execute([
                ':codigo'        => $codigo,
                ':id_cliente'    => $payload['id_cliente'],
                ':id_vendedor'   => $usuario['id'],
                ':nombre_envio'  => $payload['nombre_envio'],
                ':email_envio'   => $payload['email_envio'] ?? '',
                ':direccion_envio' => $payload['direccion_envio'],
                ':ciudad_envio'  => $payload['ciudad_envio'] ?? '',
                ':subtotal'      => $payload['subtotal'],
                ':costo_envio'   => $payload['costo_envio'] ?? 0,
                ':total'         => $payload['total'],
                ':metodo_pago'   => $payload['metodo_pago'],
                ':estado'        => $payload['estado'] ?? 'pendiente',
                ':notas'         => $payload['notas'] ?? ''
            ]);

            $id_pedido = $this->db->lastInsertId();

            // Insertar detalle
            $stmtDet = $this->db->prepare("INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)");
            foreach ($payload['detalle'] as $item) {
                $sub = (float)$item['precio_unitario'] * (int)$item['cantidad'];
                $stmtDet->execute([$id_pedido, $item['id_producto'], $item['cantidad'], $item['precio_unitario'], $sub]);
            }

            // Calcular comisión
            $comisionModel = new \App\Models\ComisionModel();
            $comisionModel->calcular($id_pedido);

            $this->pedidoModel->commit();

            Response::success(['id_pedido' => $id_pedido, 'codigo' => $codigo], "Pedido creado exitosamente", 201);
        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            Response::error("Error al crear pedido: " . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/pedidos
     * Checkout de la tienda
     */
    public function checkout()
    {
        $usuario = AuthMiddleware::verify();
        $payload = json_decode(file_get_contents('php://input'), true);

        // Validar datos de envío
        $req = ['nombre_envio', 'direccion_envio', 'metodo_pago'];
        $errores = Validator::requireFields($payload, $req);
        if (!empty($errores)) {
            Response::error("Formulario de checkout incompleto", 400, $errores);
        }

        // Obtener el carrito actual del BD
        $itemsCarrito = $this->carritoModel->getByUsuario($usuario['id']);
        if (empty($itemsCarrito)) {
            Response::error("El carrito está vacío", 400);
        }

        // Calcular totales de forma segura en servidor (no confiar en los precios que envíe Angular)
        $subtotal = 0;
        foreach ($itemsCarrito as $item) {
            $subtotal += ($item['precio'] * $item['cantidad']);
        }
        $costo_envio = ($subtotal > 150000) ? 0 : 12000;
        $total = $subtotal + $costo_envio;

        $datosPedido = [
            'id_cliente'      => $usuario['id'],
            'nombre_envio'    => $payload['nombre_envio'],
            'direccion_envio' => $payload['direccion_envio'],
            'subtotal'        => $subtotal,
            'costo_envio'     => $costo_envio,
            'total'           => $total,
            'metodo_pago'     => $payload['metodo_pago']
        ];

        try {
            $idPedido = $this->pedidoModel->create($datosPedido, $itemsCarrito);
            Response::success(['id_pedido' => $idPedido], "Tu orden ha sido confirmada con éxito. 📦", 201);
        } catch (\Exception $e) {
            Response::error("Ocurrió un error al procesar tu pago. " . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/pedidos/detalle
     */
    public function getDetallePedido()
    {
        $usuario = AuthMiddleware::verify();
        
        $id_pedido = $_GET['id'] ?? null;
        if (!$id_pedido) {
            Response::error("El ID del pedido es requerido.", 400);
        }

        // Si es un cliente, validar que el pedido le pertenezca para evitar leaks de privacidad
        $db = \Config\Database::obtenerConexion();
        $stmt = $db->prepare("SELECT id_cliente FROM pedidos WHERE id = ?");
        $stmt->execute([$id_pedido]);
        $id_cliente = $stmt->fetchColumn();

        if ($usuario['rol'] !== 'admin' && $usuario['rol'] !== 'vendedor' && (int)$id_cliente !== (int)$usuario['id']) {
            Response::error("No tienes autorización para ver los detalles de este pedido.", 403);
        }

        $items = $this->pedidoModel->getItemsPorPedido($id_pedido);
        Response::success($items);
    }

    public function getMisPuntos()
    {
        $usuario = AuthMiddleware::verify();
        $stmt = $this->db->prepare("SELECT puntos FROM usuarios WHERE id = ?");
        $stmt->execute([$usuario['id']]);
        $puntos = (int)$stmt->fetchColumn();
        Response::success(['puntos' => $puntos]);
    }

    /**
     * PUT /api/pedidos/actualizar
     */
    public function actualizarPedido()
    {
        $usuario = AuthMiddleware::verify();

        $id_pedido = $_GET['id'] ?? null;
        if (!$id_pedido) {
            Response::error("El ID del pedido es requerido.", 400);
        }

        $payload = json_decode(file_get_contents('php://input'), true);
        if (empty($payload)) {
            Response::error("No hay datos para actualizar.", 400);
        }

        $resultado = $this->pedidoModel->actualizar((int)$id_pedido, $payload);
        if ($resultado) {
            $pedido = $this->pedidoModel->getById((int)$id_pedido);
            Response::success($pedido, "Pedido actualizado exitosamente");
        } else {
            Response::error("No se pudo actualizar el pedido.", 500);
        }
    }

    /**
     * DELETE /api/pedidos/eliminar
     */
    public function eliminarPedido()
    {
        $usuario = AuthMiddleware::verify();

        $id_pedido = $_GET['id'] ?? null;
        if (!$id_pedido) {
            Response::error("El ID del pedido es requerido.", 400);
        }

        $existe = $this->pedidoModel->getById((int)$id_pedido);
        if (!$existe) {
            Response::error("Pedido no encontrado.", 404);
        }

        $resultado = $this->pedidoModel->eliminar((int)$id_pedido);
        if ($resultado) {
            Response::success(null, "Pedido eliminado exitosamente");
        } else {
            Response::error("No se pudo eliminar el pedido.", 500);
        }
    }
}
