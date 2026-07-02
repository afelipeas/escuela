<?php
namespace App\Models;

use Config\Database;
use PDO;

class ComisionModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getByVendedor(int $id_vendedor)
    {
        $stmt = $this->db->prepare("
            SELECT cv.*, p.codigo AS pedido_codigo, p.total AS pedido_total
            FROM comisiones_vendedor cv
            JOIN pedidos p ON p.id = cv.id_pedido
            WHERE cv.id_vendedor = :id_vend
            ORDER BY cv.fecha DESC
        ");
        $stmt->execute([':id_vend' => $id_vendedor]);
        return $stmt->fetchAll();
    }

    public function calcular(int $id_pedido)
    {
        // Obtener el pedido para ver si fue gestionado por un vendedor (no compras manuales online sin asesoría)
        $stmt = $this->db->prepare("SELECT id_vendedor, total FROM pedidos WHERE id = :id");
        $stmt->execute([':id' => $id_pedido]);
        $pedido = $stmt->fetch();

        if ($pedido && !empty($pedido['id_vendedor'])) {
            $porcentaje = 5.00; // 5% por transacción
            $monto = $pedido['total'] * ($porcentaje / 100);

            $sql = "INSERT INTO comisiones_vendedor (id_vendedor, id_pedido, porcentaje, monto, estado)
                    VALUES (:vend, :ped, :porc, :monto, 'pendiente')";
            $insert = $this->db->prepare($sql);
            $insert->execute([
                ':vend'  => $pedido['id_vendedor'],
                ':ped'   => $id_pedido,
                ':porc'  => $porcentaje,
                ':monto' => $monto
            ]);
        }
    }
}
