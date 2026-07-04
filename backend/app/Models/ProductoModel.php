<?php
namespace App\Models;

use Config\Database;
use PDO;

class ProductoModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getAll(array $filtros = [])
    {
        $where = ["1=1"];
        $params = [];

        if (isset($filtros['activo']) && $filtros['activo'] !== null) {
            $where[] = "activo = :activo";
            $params[':activo'] = $filtros['activo'] ? 1 : 0;
        }

        if (!empty($filtros['categoria']) && $filtros['categoria'] !== 'Todos') {
            $where[] = "categoria = :cat";
            $params[':cat'] = $filtros['categoria'];
        }

        if (isset($filtros['min_precio'])) {
            $where[] = "precio >= :min";
            $params[':min'] = (float)$filtros['min_precio'];
        }

        if (isset($filtros['max_precio'])) {
            $where[] = "precio <= :max";
            $params[':max'] = (float)$filtros['max_precio'];
        }

        if (!empty($filtros['busqueda'])) {
            $termino = '%' . $filtros['busqueda'] . '%';
            $where[] = "(nombre LIKE :busq_nom OR descripcion LIKE :busq_desc)";
            $params[':busq_nom'] = $termino;
            $params[':busq_desc'] = $termino;
        }

        $whereSql = implode(" AND ", $where);
        
        // El usuario pidió distinguir de más baratos a más costosos
        $orden = $filtros['orden'] ?? 'precio ASC';
        
        $sql = "SELECT * FROM productos WHERE $whereSql ORDER BY $orden";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id)
    {
        $stmt = $this->db->prepare("SELECT * FROM productos WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function create(array $data)
    {
        $sql = "INSERT INTO productos (nombre, descripcion, precio, precio_costo, categoria, imagen_url, etiqueta, stock_actual, stock_minimo)
                VALUES (:nombre, :descripcion, :precio, :costo, :cat, :img, :etq, :stock, :min)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'      => $data['nombre'],
            ':descripcion' => $data['descripcion'] ?? null,
            ':precio'      => $data['precio'],
            ':costo'       => $data['precio_costo'] ?? null,
            ':cat'         => $data['categoria'] ?? null,
            ':img'         => $data['imagen_url'] ?? null,
            ':etq'         => $data['etiqueta'] ?? null,
            ':stock'       => $data['stock_actual'] ?? 0,
            ':min'         => $data['stock_minimo'] ?? 5
        ]);
        return $this->db->lastInsertId();
    }

    public function getStockSummary()
    {
        $stmt = $this->db->query("SELECT SUM(stock_actual) as total FROM productos");
        $stockTotal = $stmt->fetch()['total'] ?? 0;

        $stmt = $this->db->query("SELECT COUNT(*) as total FROM productos WHERE stock_actual < stock_minimo");
        $criticos = $stmt->fetch()['total'] ?? 0;

        return [
            'total' => $stockTotal,
            'criticos' => $criticos
        ];
    }

    public function getCriticalStock()
    {
        $stmt = $this->db->query("SELECT nombre as producto, id as sku, stock_actual as stock, stock_minimo as min FROM productos WHERE stock_actual < stock_minimo");
        return $stmt->fetchAll();
    }

    public function getInventarioCompleto()
    {
        $stmt = $this->db->query("
            SELECT 
                id,
                nombre,
                categoria,
                CONCAT('REF-', LPAD(id, 3, '0')) AS referencia,
                stock_actual,
                stock_minimo,
                precio,
                CASE 
                    WHEN stock_actual <= 0 THEN 'agotado'
                    WHEN stock_actual < stock_minimo THEN 'critico'
                    ELSE 'saludable'
                END AS estado
            FROM productos
            WHERE activo = 1
            ORDER BY nombre ASC
        ");
        return $stmt->fetchAll();
    }

    public function update(array $data, int $id)
    {
        $sql = "UPDATE productos SET 
                    nombre = :nombre,
                    descripcion = :descripcion,
                    precio = :precio,
                    precio_costo = :costo,
                    categoria = :cat,
                    imagen_url = :img,
                    etiqueta = :etq,
                    especificaciones = :esp,
                    stock_actual = :stock,
                    stock_minimo = :min,
                    activo = :activo
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'         => $id,
            ':nombre'     => $data['nombre'],
            ':descripcion'=> $data['descripcion'] ?? null,
            ':precio'     => $data['precio'],
            ':costo'      => $data['precio_costo'] ?? null,
            ':cat'        => $data['categoria'] ?? null,
            ':img'        => $data['imagen_url'] ?? null,
            ':etq'        => $data['etiqueta'] ?? null,
            ':esp'        => $data['especificaciones'] ?? null,
            ':stock'      => $data['stock_actual'] ?? 0,
            ':min'        => $data['stock_minimo'] ?? 5,
            ':activo'     => $data['activo'] ?? 1
        ]);
    }

    public function delete(int $id)
    {
        $stmt = $this->db->prepare("UPDATE productos SET activo = 0 WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public function updateStock(int $id_producto, int $variacion)
    {
        // Se ejecuta después de un movimiento de inventario o un pedido
        $stmt = $this->db->prepare("UPDATE productos SET stock_actual = stock_actual + :var WHERE id = :id");
        return $stmt->execute([':var' => $variacion, ':id' => $id_producto]);
    }

    public function getTopVendidos(int $limite = 5)
    {
        return $this->db->query("
            SELECT p.nombre, SUM(dp.cantidad) as total_vendido, p.stock_actual
            FROM detalle_pedidos dp
            JOIN productos p ON dp.id_producto = p.id
            JOIN pedidos ped ON dp.id_pedido = ped.id
            WHERE ped.estado != 'cancelado'
            GROUP BY p.id, p.nombre, p.stock_actual
            ORDER BY total_vendido DESC
            LIMIT $limite
        ")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getEstadisticas()
    {
        $stmt = $this->db->query("
            SELECT
                COUNT(DISTINCT ped.id) as total_pedidos,
                SUM(ped.total) as total_ventas,
                AVG(ped.total) as ticket_promedio
            FROM pedidos ped
            WHERE ped.estado != 'cancelado'
              AND MONTH(ped.fecha_pedido) = MONTH(CURRENT_DATE())
              AND YEAR(ped.fecha_pedido) = YEAR(CURRENT_DATE())
        ");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
