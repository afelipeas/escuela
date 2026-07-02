<?php
namespace App\Controllers;

use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use Config\Database;
use PDO;

class ConfiguracionController
{
    private string $filePath;

    public function __construct()
    {
        $this->filePath = __DIR__ . '/../../config/system_settings.json';
    }

    /**
     * GET /api/configuracion
     */
    public function get()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'admin');

        if (!file_exists($this->filePath)) {
            Response::error("El archivo de configuración no existe.", 500);
        }

        $data = json_decode(file_get_contents($this->filePath), true);
        Response::success($data);
    }

    /**
     * POST /api/configuracion
     */
    public function save()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'admin');

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        if (empty($payload)) {
            Response::error("Datos de configuración vacíos o no válidos.", 400);
        }

        file_put_contents($this->filePath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        Response::success($payload, "Configuración del sistema guardada correctamente.");
    }

    /**
     * POST /api/configuracion/optimizar
     */
    public function optimize()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireRole($usuario, 'admin');

        try {
            $db = Database::obtenerConexion();
            
            // Listar tablas a optimizar
            $tablas = ['usuarios', 'cursos', 'lecciones', 'pedidos', 'detalle_pedidos', 'carrito_sesion', 'movimientos_inventario'];
            $resultados = [];

            foreach ($tablas as $tabla) {
                // Ejecutar consulta de optimización
                $stmt = $db->query("OPTIMIZE TABLE `$tabla`");
                $res = $stmt->fetch(PDO::FETCH_ASSOC);
                $resultados[] = [
                    'tabla' => $tabla,
                    'estado' => $res['Msg_text'] ?? 'Optimizado'
                ];
            }

            Response::success($resultados, "La base de datos del sistema fue optimizada exitosamente.");
        } catch (\Exception $e) {
            Response::error("Error durante la optimización: " . $e->getMessage(), 500);
        }
    }
}
