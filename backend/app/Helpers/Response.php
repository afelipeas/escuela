<?php
// ================================================================
// app/Helpers/Response.php — Estandarización de Respuestas JSON
// ================================================================
// El frontend espera siempre el mismo formato de respuesta para no
// romper la lógica de Angular. Esta clase Helper se asegura de que
// TODO lo que el backend devuelva, tenga la misma estructura:
// 
// { 
//   "ok": boolean, 
//   "datos": array|object|null, 
//   "mensaje": string 
// }
// ================================================================

namespace App\Helpers;

class Response
{
    /**
     * Envía una respuesta de éxito (HTTP 200 OK por defecto)
     */
    public static function success($data = null, string $mensaje = 'Operación exitosa', int $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        echo json_encode([
            'ok'      => true,
            'mensaje' => $mensaje,
            'datos'   => $data
        ]);
        
        // Terminar la ejecución para evitar que otra parte del script imprima más cosas
        exit();
    }

    /**
     * Envía una respuesta de error o fallo
     */
    public static function error(string $mensaje = 'Error al procesar la solicitud', int $statusCode = 400, $erroresDetalle = null)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        $respuesta = [
            'ok'      => false,
            'mensaje' => $mensaje
        ];

        // Añadir detalles extra de validación si existen
        if ($erroresDetalle) {
            $respuesta['errores'] = $erroresDetalle;
        }
        
        echo json_encode($respuesta);
        exit();
    }

    /**
     * Ataque directo: HTTP 401 (No Autorizado) — Falta token o expiró
     */
    public static function unauthorized(string $mensaje = 'No cuentas con los permisos o tu sesión expiró.')
    {
        self::error($mensaje, 401);
    }

    /**
     * Ataque directo: HTTP 403 (Prohibido) — Tiene token pero no el rol necesario
     */
    public static function forbidden(string $mensaje = 'No tienes el rol necesario para esta acción.')
    {
        self::error($mensaje, 403);
    }

    /**
     * Ataque directo: HTTP 404 (No Encontrado)
     */
    public static function notFound(string $mensaje = 'El recurso solicitado no existe.')
    {
        self::error($mensaje, 404);
    }
}
