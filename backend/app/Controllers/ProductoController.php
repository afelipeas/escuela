<?php
namespace App\Controllers;

use App\Models\ProductoModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class ProductoController
{
    private ProductoModel $productoModel;

    public function __construct()
    {
        $this->productoModel = new ProductoModel();
    }

    /**
     * GET /api/productos
     * Acceso público para la tienda
     */
    public function getAll()
    {
        // Limpiar y validar parámetros de entrada
        $filtros = [
            'activo' => isset($_GET['admin']) ? null : true,
            'categoria' => !empty($_GET['categoria']) ? $_GET['categoria'] : null,
            'min_precio' => isset($_GET['min_precio']) ? (float)$_GET['min_precio'] : null,
            'max_precio' => isset($_GET['max_precio']) ? (float)$_GET['max_precio'] : null,
            'orden' => !empty($_GET['orden']) ? $_GET['orden'] : 'precio ASC',
            'busqueda' => !empty($_GET['busqueda']) ? trim($_GET['busqueda']) : null
        ];
        
        try {
            $productos = $this->productoModel->getAll($filtros);
            Response::success($productos);
        } catch (\Exception $e) {
            error_log("Error en ProductoController::getAll: " . $e->getMessage());
            Response::error("No se pudieron cargar los productos", 500);
        }
    }

    /**
     * GET /api/productos/detalle
     * Obtener un producto por ID
     */
    public function getById()
    {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            Response::error("ID de producto inválido", 400);
        }

        try {
            $producto = $this->productoModel->getById($id);
            if (!$producto) {
                Response::error("Producto no encontrado", 404);
            }
            Response::success($producto);
        } catch (\Exception $e) {
            Response::error("Error al obtener el producto", 500);
        }
    }

    /**
     * POST /api/productos
     * Crear productos (Solo Admin o Almacén)
     */
    public function create()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'almacen']);

        $payload = json_decode(file_get_contents('php://input'), true);
        
        $errores = Validator::requireFields($payload, ['nombre', 'precio']);
        if (!empty($errores)) {
            Response::error("Datos incompletos", 400, $errores);
        }

        $id = $this->productoModel->create($payload);
        Response::success(['id' => $id], "Producto agregado al catálogo", 201);
    }

    /**
     * POST /api/productos/editar
     * Editar producto (Solo Admin o Almacén)
     */
    public function update()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'almacen']);

        $payload = json_decode(file_get_contents('php://input'), true);

        if (empty($payload['id'])) {
            Response::error("Falta el ID del producto", 400);
        }

        $id = (int)$payload['id'];
        $existente = $this->productoModel->getById($id);
        if (!$existente) {
            Response::error("Producto no encontrado", 404);
        }

        $errores = Validator::requireFields($payload, ['nombre', 'precio']);
        if (!empty($errores)) {
            Response::error("Datos incompletos", 400, $errores);
        }

        $this->productoModel->update($payload, $id);
        Response::success(null, "Producto actualizado correctamente");
    }

    /**
     * POST /api/productos/eliminar
     * Desactivar producto - soft delete (Solo Admin o Almacén)
     */
    public function delete()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'almacen']);

        $payload = json_decode(file_get_contents('php://input'), true);

        if (empty($payload['id'])) {
            Response::error("Falta el ID del producto", 400);
        }

        $id = (int)$payload['id'];
        $existente = $this->productoModel->getById($id);
        if (!$existente) {
            Response::error("Producto no encontrado", 404);
        }

        $this->productoModel->delete($id);
        Response::success(null, "Producto eliminado del catálogo");
    }

    /**
     * POST /api/productos/subir-imagen
     * Subir imagen de producto (multipart/form-data)
     */
    public function subirImagen()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['admin', 'almacen']);

        if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            Response::error("No se recibió ningún archivo o hubo un error en la carga", 400);
        }

        $file = $_FILES['imagen'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($ext, $allowed)) {
            Response::error("Formato no permitido. Solo JPG, PNG, GIF, WEBP.", 400);
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            Response::error("El archivo excede el límite de 5MB", 400);
        }

        $uploadDir = __DIR__ . '/../../uploads/productos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = 'prod_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $url = 'http://localhost/escuela/backend/uploads/productos/' . $fileName;
            Response::success(['url' => $url], "Imagen subida correctamente");
        } else {
            Response::error("Error al guardar el archivo en el servidor", 500);
        }
    }
}
