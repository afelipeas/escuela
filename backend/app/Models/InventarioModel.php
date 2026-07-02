<?php
namespace App\Models;

use Config\Database;
use PDO;

class InventarioModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    /**
     * Historial de entradas y salidas
     */
    public function getMovimientos()
    {
        $stmt = $this->db->query("
            SELECT m.*, p.nombre AS producto, u.nombre AS responsible 
            FROM movimientos_inventario m
            JOIN productos p ON p.id = m.id_producto
            JOIN usuarios u ON u.id = m.id_responsable
            ORDER BY m.fecha DESC
            LIMIT 100
        ");
        return $stmt->fetchAll();
    }

    public function registrarAjuste(array $data)
    {
        // $data['cantidad'] debe ser un número positivo para suma y negativo para resta
        $sql = "INSERT INTO movimientos_inventario (id_producto, id_responsable, tipo, cantidad, motivo)
                VALUES (:prod, :resp, 'ajuste', :cant, :motivo)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':prod'   => $data['id_producto'],
            ':resp'   => $data['id_responsable'],
            ':cant'   => $data['cantidad'],
            ':motivo' => $data['motivo']
        ]);
    }

    /**
     * Reporte de inventario por rango de fechas.
     * Calcula: saldo_inicial, entradas, salidas, saldo_final por producto.
     */
    public function getReportePorRango(string $fechaInicio, string $fechaFin): array
    {
        $sql = "
            SELECT 
                p.id,
                p.nombre AS producto,
                p.categoria,
                CONCAT('REF-', LPAD(p.id, 3, '0')) AS referencia,
                p.stock_actual,
                -- Saldo Final = stock_actual - (entradas después de fin) + (salidas después de fin)
                p.stock_actual 
                  - COALESCE(mov.entradas_despues, 0) 
                  + COALESCE(mov.salidas_despues, 0) AS saldo_final,
                  
                COALESCE(mov.entradas_periodo, 0) AS entradas,
                COALESCE(mov.salidas_periodo, 0) AS salidas,
                
                -- Saldo Inicial = Saldo Final - entradas_periodo + salidas_periodo
                (p.stock_actual 
                  - COALESCE(mov.entradas_despues, 0) 
                  + COALESCE(mov.salidas_despues, 0)
                ) - COALESCE(mov.entradas_periodo, 0) 
                  + COALESCE(mov.salidas_periodo, 0) AS saldo_inicial
            FROM productos p
            LEFT JOIN (
                SELECT 
                    id_producto,
                    -- Entradas y salidas durante el período seleccionado
                    SUM(CASE WHEN fecha BETWEEN :ini1 AND :fin1 AND (tipo = 'entrada' OR (tipo = 'ajuste' AND cantidad > 0)) THEN cantidad ELSE 0 END) AS entradas_periodo,
                    SUM(CASE WHEN fecha BETWEEN :ini2 AND :fin2 AND (tipo = 'salida' OR (tipo = 'ajuste' AND cantidad < 0)) THEN ABS(cantidad) ELSE 0 END) AS salidas_periodo,
                    
                    -- Entradas y salidas después del período seleccionado
                    SUM(CASE WHEN fecha > :fin_despues1 AND (tipo = 'entrada' OR (tipo = 'ajuste' AND cantidad > 0)) THEN cantidad ELSE 0 END) AS entradas_despues,
                    SUM(CASE WHEN fecha > :fin_despues2 AND (tipo = 'salida' OR (tipo = 'ajuste' AND cantidad < 0)) THEN ABS(cantidad) ELSE 0 END) AS salidas_despues
                FROM movimientos_inventario
                GROUP BY id_producto
            ) mov ON mov.id_producto = p.id
            WHERE p.activo = 1
            ORDER BY p.nombre ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':ini1'          => $fechaInicio . ' 00:00:00',
            ':fin1'          => $fechaFin . ' 23:59:59',
            ':ini2'          => $fechaInicio . ' 00:00:00',
            ':fin2'          => $fechaFin . ' 23:59:59',
            ':fin_despues1'  => $fechaFin . ' 23:59:59',
            ':fin_despues2'  => $fechaFin . ' 23:59:59'
        ]);
        $rows = $stmt->fetchAll();

        return $rows;
    }
}

