<?php
namespace App\Models;

use Config\Database;
use PDO;

class OrdenCompraModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getAll()
    {
        $stmt = $this->db->query("
            SELECT oc.*, p.nombre AS proveedor_nombre, u.nombre AS responsable_nombre
            FROM ordenes_compra oc
            JOIN proveedores p ON p.id = oc.id_proveedor
            JOIN usuarios u ON u.id = oc.id_responsable
            ORDER BY oc.fecha_orden DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getReportePorRango(string $fechaInicio, string $fechaFin): array
    {
        $sql = "
            SELECT 
                oc.id,
                oc.codigo,
                p.nombre AS proveedor_nombre,
                u.nombre AS responsable_nombre,
                oc.total,
                oc.estado,
                oc.fecha_orden,
                oc.fecha_estimada,
                oc.notas,
                COUNT(doc.id) AS total_items
            FROM ordenes_compra oc
            JOIN proveedores p ON p.id = oc.id_proveedor
            JOIN usuarios u ON u.id = oc.id_responsable
            LEFT JOIN detalle_ordenes_compra doc ON doc.id_orden = oc.id
            WHERE oc.fecha_orden BETWEEN :ini AND :fin
            GROUP BY oc.id
            ORDER BY oc.fecha_orden DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':ini' => $fechaInicio . ' 00:00:00',
            ':fin' => $fechaFin . ' 23:59:59'
        ]);
        $ordenes = $stmt->fetchAll();

        $sqlTotales = "
            SELECT 
                SUM(CASE WHEN oc.estado != 'cancelado' THEN oc.total ELSE 0 END) AS gasto_total,
                COUNT(*) AS total_ordenes,
                SUM(CASE WHEN oc.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
                SUM(CASE WHEN oc.estado = 'recibido' THEN 1 ELSE 0 END) AS recibidos,
                SUM(CASE WHEN oc.estado = 'en_transito' THEN 1 ELSE 0 END) AS en_transito,
                SUM(CASE WHEN oc.estado = 'cancelado' THEN 1 ELSE 0 END) AS cancelados,
                COUNT(DISTINCT oc.id_proveedor) AS proveedores_activos
            FROM ordenes_compra oc
            WHERE oc.fecha_orden BETWEEN :ini AND :fin
        ";
        $stmt2 = $this->db->prepare($sqlTotales);
        $stmt2->execute([
            ':ini' => $fechaInicio . ' 00:00:00',
            ':fin' => $fechaFin . ' 23:59:59'
        ]);
        $resumen = $stmt2->fetch();

        $sqlCategorias = "
            SELECT 
                pr.categoria,
                SUM(doc.cantidad_pedida * doc.precio_costo_unitario) AS gasto_categoria
            FROM ordenes_compra oc
            JOIN detalle_ordenes_compra doc ON doc.id_orden = oc.id
            JOIN productos pr ON pr.id = doc.id_producto
            WHERE oc.fecha_orden BETWEEN :ini AND :fin
              AND oc.estado != 'cancelado'
            GROUP BY pr.categoria
            ORDER BY gasto_categoria DESC
        ";
        $stmt3 = $this->db->prepare($sqlCategorias);
        $stmt3->execute([
            ':ini' => $fechaInicio . ' 00:00:00',
            ':fin' => $fechaFin . ' 23:59:59'
        ]);
        $categorias = $stmt3->fetchAll();

        return [
            'ordenes' => $ordenes,
            'resumen' => $resumen,
            'categorias' => $categorias
        ];
    }

    public function create(array $data, array $detalles)
    {
        try {
            $this->db->beginTransaction();

            $sqlBase = "INSERT INTO ordenes_compra (codigo, id_proveedor, id_responsable, total, estado, fecha_estimada, notas)
                        VALUES (:cod, :prov, :resp, :tot, 'pendiente', :fec, :notas)";
            
            $stmt = $this->db->prepare($sqlBase);
            $fec = (!empty($data['fecha_estimada'])) ? $data['fecha_estimada'] : null;
            $notas = (!empty($data['notas'])) ? $data['notas'] : null;
            $codigo = 'OC-' . date('Ymd') . '-' . str_pad(rand(1,999), 3, '0', STR_PAD_LEFT);
            $stmt->bindValue(':cod', $codigo);
            $stmt->bindValue(':prov', (int)$data['id_proveedor'], PDO::PARAM_INT);
            $stmt->bindValue(':resp', (int)$data['id_responsable'], PDO::PARAM_INT);
            $stmt->bindValue(':tot', (float)$data['total']);
            $stmt->bindValue(':fec', $fec, $fec === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindValue(':notas', $notas, $notas === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->execute();

            $id_orden = $this->db->lastInsertId();

            $sqlLine = "INSERT INTO detalle_ordenes_compra (id_orden, id_producto, cantidad_pedida, precio_costo_unitario, subtotal)
                        VALUES (?, ?, ?, ?, ?)";
            $stmtLine = $this->db->prepare($sqlLine);

            foreach ($detalles as $item) {
                $sub = (int)$item['cantidad'] * (float)$item['precio_costo'];
                $stmtLine->execute([
                    (int)$id_orden, 
                    (int)$item['id_producto'], 
                    (int)$item['cantidad'], 
                    (float)$item['precio_costo'], 
                    $sub
                ]);
            }

            $this->db->commit();
            return $id_orden;

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getById(int $id)
    {
        $stmt = $this->db->prepare("
            SELECT oc.*, p.nombre AS proveedor_nombre, p.id AS proveedor_id_real, u.nombre AS responsable_nombre
            FROM ordenes_compra oc
            JOIN proveedores p ON p.id = oc.id_proveedor
            JOIN usuarios u ON u.id = oc.id_responsable
            WHERE oc.id = :id
        ");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getDetallesByOrden(int $id_orden)
    {
        $stmt = $this->db->prepare("
            SELECT doc.*, pr.nombre AS producto_nombre
            FROM detalle_ordenes_compra doc
            JOIN productos pr ON pr.id = doc.id_producto
            WHERE doc.id_orden = :id
        ");
        $stmt->execute([':id' => $id_orden]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function update(int $id, array $data)
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                UPDATE ordenes_compra SET 
                    id_proveedor = :prov,
                    total = :tot,
                    estado = :est,
                    fecha_estimada = :fec,
                    notas = :notas
                WHERE id = :id
            ");
            $fec = (!empty($data['fecha_estimada'])) ? $data['fecha_estimada'] : null;
            $notas = isset($data['notas']) ? $data['notas'] : null;
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':prov', (int)$data['id_proveedor'], PDO::PARAM_INT);
            $stmt->bindValue(':tot', (float)$data['total']);
            $stmt->bindValue(':est', $data['estado']);
            $stmt->bindValue(':fec', $fec, $fec === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindValue(':notas', $notas, $notas === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->execute();

            if (isset($data['detalles']) && is_array($data['detalles'])) {
                $stmtDel = $this->db->prepare("DELETE FROM detalle_ordenes_compra WHERE id_orden = :id");
                $stmtDel->execute([':id' => $id]);

                $sqlLine = "INSERT INTO detalle_ordenes_compra (id_orden, id_producto, cantidad_pedida, precio_costo_unitario, subtotal)
                            VALUES (?, ?, ?, ?, ?)";
                $stmtLine = $this->db->prepare($sqlLine);

                foreach ($data['detalles'] as $item) {
                    $sub = (int)$item['cantidad'] * (float)$item['precio_costo'];
                    $stmtLine->execute([
                        $id,
                        (int)$item['id_producto'],
                        (int)$item['cantidad'],
                        (float)$item['precio_costo'],
                        $sub
                    ]);
                }
            }

            $this->db->commit();
            return true;

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function delete(int $id)
    {
        try {
            $this->db->beginTransaction();

            $this->db->prepare("DELETE FROM detalle_ordenes_compra WHERE id_orden = :id")->execute([':id' => $id]);
            $this->db->prepare("UPDATE movimientos_inventario SET id_orden_compra = NULL WHERE id_orden_compra = :id")->execute([':id' => $id]);
            $stmt = $this->db->prepare("DELETE FROM ordenes_compra WHERE id = :id");
            $stmt->execute([':id' => $id]);

            $this->db->commit();
            return true;

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
