<?php
// ================================================================
// app/Middleware/AuthMiddleware.php — Filtro de Seguridad
// ================================================================
// Actúa como portero para las rutas protegidas. Si un controlador
// usa este middleware, significa que el usuario DEBE estar logueado.
//
// El middleware intercepta la petición, verifica el token JWT y,
// si es válido, deja pasar la ejecución. Si es inválido, detiene 
// todo y devuelve un 401 Unauthorized automáticamente.
// ================================================================

namespace App\Middleware;

use App\Helpers\JWT;
use App\Helpers\Response;

class AuthMiddleware
{
    /**
     * Verifica que el usuario está validamente autenticado.
     * Retorna el payload del token si tiene éxito.
     */
    public static function verify(): array
    {
        $token = JWT::getBearerTokenFromHeader();

        if (empty($token)) {
            error_log("AuthMiddleware: No se envió token");
            Response::unauthorized('No se envió un Token de autorización.');
            exit();
        }

        $usuarioPayload = JWT::verify($token);

        if (!$usuarioPayload) {
            error_log("AuthMiddleware: Token inválido o expirado -> " . $token);
            Response::unauthorized('El Token es inválido o ha expirado. Por favor, inicia sesión nuevamente.');
            exit();
        }

        // Si todo está ok, retornamos la info contenida en el JWT (id, rol, email...)
        // para que el Controlador pueda usarla si la necesita.
        return $usuarioPayload;
    }
}
