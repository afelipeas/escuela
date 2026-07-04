<?php
namespace App\Models;

use Config\Database;
use PDO;

class CarritoModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    public function getByUsuario(int $id_usuario)
    {
        $stmt = $this->db->prepare("
            SELECT cs.id AS id_item, cs.cantidad, p.* 
            FROM carrito_sesion cs
            JOIN productos p ON p.id = cs.id_producto
            WHERE cs.id_usuario = :user
        ");
        $stmt->execute([':user' => $id_usuario]);
        return $stmt->fetchAll();
    }

    public function agregarItem(int $id_usuario, int $id_producto, int $cantidad)
    {
        $sql = "INSERT INTO carrito_sesion (id_usuario, id_producto, cantidad)
                VALUES (:user, :prod, :cant)
                ON DUPLICATE KEY UPDATE cantidad = cantidad + :cant2";
                
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':user' => $id_usuario,
            ':prod' => $id_producto,
            ':cant' => $cantidad,
            ':cant2' => $cantidad
        ]);
    }

    public function eliminarItem(int $id_usuario, int $id_producto)
    {
        $stmt = $this->db->prepare("DELETE FROM carrito_sesion WHERE id_usuario = :user AND id_producto = :prod");
        return $stmt->execute([
            ':user' => $id_usuario,
            ':prod' => $id_producto
        ]);
    }

    public function vaciar(int $id_usuario)
    {
        $stmt = $this->db->prepare("DELETE FROM carrito_sesion WHERE id_usuario = :user");
        return $stmt->execute([':user' => $id_usuario]);
    }
}
