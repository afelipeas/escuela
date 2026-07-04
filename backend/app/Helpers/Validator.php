<?php
// ================================================================
// app/Helpers/Validator.php — Sanitización y Validación Segura
// ================================================================
// Limpia y verifica los datos crudos que llegan desde el frontend
// antes de tocarlos o enviarlos a la Base de Datos.
// Ayuda a prevenir ataques XSS (Cross-Site Scripting) y SQL Injection.
// ================================================================

namespace App\Helpers;

class Validator
{
    /**
     * Limpia un string quitándole etiquetas HTML, espacios extra, etc.
     */
    public static function sanitize(string $input): string
    {
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        return $input;
    }

    /**
     * Verifica que un arreglo de campos requeridos esté presente en los datos
     */
    public static function requireFields(array $payload, array $requiredFields): array
    {
        $errors = [];
        foreach ($requiredFields as $field) {
            if (!isset($payload[$field])) {
                $errors[] = "El campo '{$field}' es obligatorio.";
                continue;
            }
            if (is_array($payload[$field])) {
                if (empty($payload[$field])) {
                    $errors[] = "El campo '{$field}' no puede estar vacío.";
                }
            } elseif (trim((string)$payload[$field]) === '') {
                $errors[] = "El campo '{$field}' es obligatorio.";
            }
        }
        return $errors;
    }

    /**
     * Verifica que un correo tenga formato válido
     */
    public static function isEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Verifica que una cadena tenga formato de fecha YYYY-MM-DD válida
     */
    public static function isDate(string $date): bool
    {
        $parts = explode('-', $date);
        if (count($parts) !== 3) return false;
        return checkdate((int)$parts[1], (int)$parts[2], (int)$parts[0]);
    }
}
