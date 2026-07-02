<?php
// ================================================================
// app/Middleware/RoleMiddleware.php — Filtro de Roles y Permisos
// ================================================================
// Trabaja en conjunto con AuthMiddleware.
// Además de que el usuario deba estar logueado, verifica si
// el rol que dice tener en su Token JWT coincide con el rol
// requerido para ejecutar el punto final (Endpoint).
// ================================================================

namespace App\Middleware;

use App\Helpers\Response;

class RoleMiddleware
{
    /**
     * Verifica si el usuario actual tiene el rol específico,
     * o si es 'admin' (el admin tiene pase libre a todo).
     */
    public static function requireRole(array $usuarioLogueado, string $rolRequerido): void
    {
        $rolActual = $usuarioLogueado['rol'] ?? 'cliente';

        // Si es el rol exacto, o es 'admin', pasa de largo
        if ($rolActual === $rolRequerido || $rolActual === 'admin') {
            return; 
        }

        // Si llega aquí, es porque NO tiene el rol
        Response::forbidden("Acceso denegado. Se requiere el rol '{$rolRequerido}'. Tienes '{$rolActual}'.");
        exit();
    }

    /**
     * Verifica que el usuario tenga AL MENOS UNO de los roles de la lista.
     * Útil cuando una ruta puede ser usada por Docente o Admin indistintamente.
     */
    public static function requireAnyRole(array $usuarioLogueado, array $rolesRequeridos): void
    {
        $rolActual = $usuarioLogueado['rol'] ?? 'cliente';

        if (in_array($rolActual, $rolesRequeridos) || $rolActual === 'admin') {
            return;
        }

        Response::forbidden("Acceso denegado. Esta acción está restringida para tu perfil.");
        exit();
    }
}
