<?php
namespace App\Models;

use Config\Database;
use PDO;

class SystemLogModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
        $this->asegurarTablaExiste();
    }

    private function asegurarTablaExiste()
    {
        $sql = "CREATE TABLE IF NOT EXISTS `logs_sistema` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `nivel` VARCHAR(20) NOT NULL,
            `usuario` VARCHAR(100) NOT NULL,
            `accion` VARCHAR(150) NOT NULL,
            `ip` VARCHAR(50) NOT NULL,
            `detalles` TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        $this->db->exec($sql);
    }

    public function log(string $nivel, string $usuario, string $accion, string $detalles = '')
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $sql = "INSERT INTO logs_sistema (nivel, usuario, accion, ip, detalles) VALUES (:nivel, :usuario, :accion, :ip, :detalles)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nivel' => $nivel,
            ':usuario' => $usuario,
            ':accion' => $accion,
            ':ip' => $ip,
            ':detalles' => $detalles
        ]);
    }

    public function getAll(string $nivel = '', string $busqueda = '')
    {
        $sql = "SELECT id, fecha, nivel, usuario, accion, ip, detalles FROM logs_sistema WHERE 1=1";
        $params = [];

        if (!empty($nivel)) {
            $sql .= " AND nivel = :nivel";
            $params[':nivel'] = $nivel;
        }

        if (!empty($busqueda)) {
            $sql .= " AND (usuario LIKE :busqueda_u OR accion LIKE :busqueda_a OR detalles LIKE :busqueda_d)";
            $params[':busqueda_u'] = "%$busqueda%";
            $params[':busqueda_a'] = "%$busqueda%";
            $params[':busqueda_d'] = "%$busqueda%";
        }

        $sql .= " ORDER BY id DESC LIMIT 200";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function clear()
    {
        $this->db->exec("TRUNCATE TABLE logs_sistema");
    }
}
