<?php
namespace App\Models;

use Config\Database;
use PDO;

class ProveedorModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getAll()
    {
        $stmt = $this->db->query("SELECT * FROM proveedores ORDER BY fecha_registro DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(array $data)
    {
        $sql = "INSERT INTO proveedores (nombre, contacto, telefono, email, categoria, estado)
                VALUES (:nombre, :contacto, :telefono, :email, :categoria, 'activo')";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'   => $data['nombre'],
            ':contacto' => $data['contacto'] ?? null,
            ':telefono' => $data['telefono'] ?? null,
            ':email'    => $data['email'] ?? null,
            ':categoria'=> $data['categoria'] ?? null
        ]);
        return $this->db->lastInsertId();
    }
}
