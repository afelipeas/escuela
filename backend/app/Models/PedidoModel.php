<?php
namespace App\Models;

use Config\Database;
use PDO;

class PedidoModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getAll()
    {
        return $this->db->query("
            SELECT p.*, CONCAT(u.nombre, ' ', u.apellido) as cliente, p.total as monto 
            FROM pedidos p
            JOIN usuarios u ON p.id_cliente = u.id
            ORDER BY p.fecha_pedido DESC
        ")->fetchAll();
    }

    public function getByVendedor(int $id_vendedor)
    {
        $stmt = $this->db->prepare("
            SELECT p.*, CONCAT(u.nombre, ' ', u.apellido) as cliente, p.total as monto 
            FROM pedidos p
            JOIN usuarios u ON p.id_cliente = u.id
            WHERE p.id_vendedor = :id
            ORDER BY p.fecha_pedido DESC
        ");
        $stmt->execute([':id' => $id_vendedor]);
        return $stmt->fetchAll();
    }

    public function getByCliente(int $id_cliente)
    {
        $stmt = $this->db->prepare("
            SELECT p.*, CONCAT(u.nombre, ' ', u.apellido) as cliente, p.total as monto 
            FROM pedidos p
            JOIN usuarios u ON p.id_cliente = u.id
            WHERE p.id_cliente = :id 
            ORDER BY p.fecha_pedido DESC
        ");
        $stmt->execute([':id' => $id_cliente]);
        return $stmt->fetchAll();
    }

    public function getPendingShipmentsCount()
    {
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM pedidos WHERE estado = 'pendiente'");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getMonthlyTotalAnterior()
    {
        $stmt = $this->db->query("SELECT SUM(total) as total FROM pedidos WHERE MONTH(fecha_pedido) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(fecha_pedido) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) AND estado != 'cancelado'");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getMonthlyTotal()
    {
        $stmt = $this->db->query("SELECT SUM(total) as total FROM pedidos WHERE MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) AND YEAR(fecha_pedido) = YEAR(CURRENT_DATE()) AND estado != 'cancelado'");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function create(array $data, array $detalleCarrito)
    {
        try {
            $this->db->beginTransaction();

            // 1. Guardar la cabecera del pedido
            $sqlBase = "INSERT INTO pedidos (codigo, id_cliente, nombre_envio, direccion_envio, subtotal, costo_envio, total, metodo_pago)
                        VALUES (:cod, :cli, :nom, :dir, :sub, :env, :tot, :metodo)";
            $stmt = $this->db->prepare($sqlBase);
            $stmt->execute([
                ':cod' => 'P-' . time(), // Código temporal único
                ':cli' => $data['id_cliente'],
                ':nom' => $data['nombre_envio'],
                ':dir' => $data['direccion_envio'],
                ':sub' => $data['subtotal'],
                ':env' => $data['costo_envio'],
                ':tot' => $data['total'],
                ':metodo' => $data['metodo_pago']
            ]);

            $id_pedido = $this->db->lastInsertId();

            // 2. Guardar el detalle de líneas y actualizar stock
            $sqlLine = "INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                        VALUES (?, ?, ?, ?, ?)";
            $stmtLine = $this->db->prepare($sqlLine);

            $sqlStock = "UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?";
            $stmtStock = $this->db->prepare($sqlStock);

            $sqlMov = "INSERT INTO movimientos_inventario (id_producto, id_responsable, tipo, cantidad, motivo)
                       VALUES (?, ?, 'salida', ?, ?)";
            $stmtMov = $this->db->prepare($sqlMov);

            foreach ($detalleCarrito as $item) {
                $subtotalLinea = $item['cantidad'] * $item['precio'];
                
                // Detalle
                $stmtLine->execute([
                    $id_pedido, 
                    $item['id'], 
                    $item['cantidad'], 
                    $item['precio'], 
                    $subtotalLinea
                ]);

                // Descontar Stock
                $stmtStock->execute([$item['cantidad'], $item['id']]);

                // Registrar Movimiento (Responsable: el propio cliente para rastreo)
                $stmtMov->execute([
                    $item['id'], 
                    $data['id_cliente'], 
                    $item['cantidad'], 
                    "Venta online - Pedido #$id_pedido"
                ]);
            }

            // 3. Manejar Pago con Puntos Fe
            if ($data['metodo_pago'] === 'puntos') {
                // Verificar si tiene suficientes
                $stmtUser = $this->db->prepare("SELECT puntos FROM usuarios WHERE id = ?");
                $stmtUser->execute([$data['id_cliente']]);
                $userPuntos = $stmtUser->fetchColumn();

                if ($userPuntos < $data['total']) {
                    throw new \Exception("Puntos insuficientes para completar el canje.");
                }

                $stmtUpdatePuntos = $this->db->prepare("UPDATE usuarios SET puntos = puntos - ? WHERE id = ?");
                $stmtUpdatePuntos->execute([$data['total'], $data['id_cliente']]);
            } else {
                // Política de Puntos de Fidelidad: Acumula el 10% del total de la compra en Puntos Fe
                $puntosGanados = (int)($data['total'] * 0.10);
                if ($puntosGanados > 0) {
                    $stmtAddPuntos = $this->db->prepare("UPDATE usuarios SET puntos = IFNULL(puntos, 0) + ? WHERE id = ?");
                    $stmtAddPuntos->execute([$puntosGanados, $data['id_cliente']]);
                }
            }

            // 4. Vaciar el carrito
            $stmtDel = $this->db->prepare("DELETE FROM carrito_sesion WHERE id_usuario = :cli");
            $stmtDel->execute([':cli' => $data['id_cliente']]);

            $this->db->commit();
            return $id_pedido;

        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function beginTransaction()
    {
        $this->db->beginTransaction();
    }

    public function commit()
    {
        $this->db->commit();
    }

    public function rollBack()
    {
        $this->db->rollBack();
    }

    public function getItemsPorPedido(int $id_pedido)
    {
        $stmt = $this->db->prepare("
            SELECT dp.*, p.nombre as producto_nombre, p.imagen_url as producto_imagen
            FROM detalle_pedidos dp
            JOIN productos p ON dp.id_producto = p.id
            WHERE dp.id_pedido = :id_pedido
        ");
        $stmt->execute([':id_pedido' => $id_pedido]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function actualizar(int $id, array $datos): bool
    {
        $camposPermitidos = ['nombre_envio', 'email_envio', 'direccion_envio', 'ciudad_envio', 'metodo_pago', 'estado', 'notas'];
        $sets = [];
        $params = [':id' => $id];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $sets[] = "$campo = :$campo";
                $params[":$campo"] = $datos[$campo];
            }
        }

        if (empty($sets)) return false;

        $sql = "UPDATE pedidos SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function getById(int $id)
    {
        $stmt = $this->db->prepare("
            SELECT p.*, CONCAT(u.nombre, ' ', u.apellido) as cliente
            FROM pedidos p
            JOIN usuarios u ON p.id_cliente = u.id
            WHERE p.id = :id
        ");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function eliminar(int $id): bool
    {
        $this->db->beginTransaction();
        try {
            $stmtMov = $this->db->prepare("DELETE FROM movimientos_inventario WHERE id_pedido = ?");
            $stmtMov->execute([$id]);

            $stmtCom = $this->db->prepare("DELETE FROM comisiones_vendedor WHERE id_pedido = ?");
            $stmtCom->execute([$id]);

            $stmtDet = $this->db->prepare("DELETE FROM detalle_pedidos WHERE id_pedido = ?");
            $stmtDet->execute([$id]);

            $stmt = $this->db->prepare("DELETE FROM pedidos WHERE id = ?");
            $stmt->execute([$id]);

            $this->db->commit();
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
