<?php
namespace App\Models;

use Config\Database;
use PDO;

class UsuarioModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::obtenerConexion();
    }

    /**
     * Busca un usuario por su correo electrónico o nombre de usuario.
     */
    public function getByEmailOrUsername(string $identificador)
    {
        $stmt = $this->db->prepare("SELECT id, nombre, apellido, email, password_hash, rol, estado FROM usuarios WHERE email = :email OR nombre_usuario = :username LIMIT 1");
        $stmt->execute([
            ':email' => $identificador,
            ':username' => $identificador
        ]);
        return $stmt->fetch();
    }

    public function getNewStudentsCount()
    {
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM usuarios WHERE rol = 'estudiante' AND MONTH(fecha_registro) = MONTH(CURRENT_DATE()) AND YEAR(fecha_registro) = YEAR(CURRENT_DATE())");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getNewStudentsCountAnterior()
    {
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM usuarios WHERE rol = 'estudiante' AND MONTH(fecha_registro) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(fecha_registro) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)");
        $res = $stmt->fetch();
        return $res['total'] ?? 0;
    }

    public function getRecentUsers(int $limit = 5)
    {
        $stmt = $this->db->prepare("SELECT nombre, apellido, email, rol, fecha_registro as fecha FROM usuarios ORDER BY fecha_registro DESC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Crea un nuevo registro en la tabla de usuarios
     */
    public function create(array $data)
    {
        // En un framework ORM esto lo hace solo. En MVC puro lo escribimos
        $sql = "INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, password_hash, rol, estado) 
                VALUES (:nombre_usuario, :nombre, :apellido, :email, :pass, :rol, 'activo')";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre_usuario' => $data['nombre_usuario'],
            ':nombre'   => $data['nombre'],
            ':apellido' => $data['apellido'],
            ':email'    => $data['email'],
            ':pass'     => password_hash($data['password'], PASSWORD_BCRYPT), // ¡Importante cifrar la contraseña!
            ':rol'      => $data['rol'] ?? 'cliente' // Por defecto cliente si no se pasa rol
        ]);
        
        return $this->db->lastInsertId();
    }

    public function getByRol(string $rol)
    {
        $stmt = $this->db->prepare("SELECT id, nombre, apellido, email FROM usuarios WHERE rol = :rol AND estado = 'activo' ORDER BY nombre ASC");
        $stmt->execute([':rol' => $rol]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAll()
    {
        $stmt = $this->db->query("SELECT id, nombre_usuario, nombre, apellido, email, rol, estado, fecha_registro FROM usuarios WHERE estado != 'inactivo' ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function update(int $id, array $data)
    {
        $sql = "UPDATE usuarios SET nombre_usuario = :nombre_usuario, nombre = :nombre, apellido = :apellido, email = :email, rol = :rol, estado = :estado";
        
        $params = [
            ':id' => $id,
            ':nombre_usuario' => $data['nombre_usuario'],
            ':nombre'   => $data['nombre'],
            ':apellido' => $data['apellido'],
            ':email'    => $data['email'],
            ':rol'      => $data['rol'],
            ':estado'   => $data['estado']
        ];

        if (!empty($data['password'])) {
            $sql .= ", password_hash = :pass";
            $params[':pass'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        $sql .= " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(int $id)
    {
        $stmt = $this->db->prepare("UPDATE usuarios SET estado = 'inactivo' WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    public function countByRole(string $rol): int
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM usuarios WHERE rol = :rol");
        $stmt->execute([':rol' => $rol]);
        return (int)$stmt->fetch()['total'];
    }

    public function existsEmail(string $email, int $excludeId = 0): bool
    {
        $sql = "SELECT id FROM usuarios WHERE email = :email";
        $params = [':email' => $email];
        if ($excludeId > 0) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch() !== false;
    }

    public function existsUsername(string $username, int $excludeId = 0): bool
    {
        $sql = "SELECT id FROM usuarios WHERE nombre_usuario = :username";
        $params = [':username' => $username];
        if ($excludeId > 0) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch() !== false;
    }

    public function getById(int $id)
    {
        $stmt = $this->db->prepare("SELECT id, rol FROM usuarios WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
