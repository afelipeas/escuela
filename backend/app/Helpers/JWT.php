<?php
// ================================================================
// app/Helpers/JWT.php — JSON Web Token Generator & Validator
// ================================================================
// Un JWT permite mantener sesiones de forma "stateless" (sin guardar 
// estado en el servidor). Angular nos envía su email/pass y si son 
// correctos, le devolvemos una credencial cifrada: el Token.
//
// Angular deberá adjuntar este token en la cabecera 'Authorization' 
// en sus futuras solicitudes a las áreas privadas.
// ================================================================

namespace App\Helpers;

class JWT
{
    /**
     * Codificar a Base64 Url Safe (sin caracteres raros para la URL)
     */
    private static function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Genera un nuevo Token JWT
     * 
     * @param array $payload Los datos públicos a guardar (ej. id de usuario, rol)
     * @return string Token firmado
     */
    public static function generate(array $payload): string
    {
        if (!defined('JWT_SECRET_KEY')) {
            throw new \Exception("JWT_SECRET_KEY no está definida en app.php");
        }

        // Header: Indicamos algoritmo HS256 y tipo JWT
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $base64UrlHeader = self::base64UrlEncode($header);

        // Agregamos fechas importantes al Payload:
        // iat = Issued At (Hora de creación)
        // exp = Expiration Time (Hora de expiración)
        $issuedAt = time();
        $expirationTime = $issuedAt + (defined('JWT_EXPIRATION') ? JWT_EXPIRATION : 3600); 

        $payload['iat'] = $issuedAt;
        $payload['exp'] = $expirationTime;

        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        // Firmar el origen concatenado usando HMAC SHA256
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET_KEY, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        // El Token final son las 3 partes unidas por puntos
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Verifica que un Token es genuino y no ha sido alterado o caducado.
     * Retorna el Payload descodificado si es válido, o false/array si falla.
     */
    public static function verify(string $jwt)
    {
        $partes = explode('.', $jwt);
        
        // Un JWT válido siempre tiene 3 partes
        if (count($partes) !== 3) {
            return false;
        }

        list($headerB64, $payloadB64, $signatureB64) = $partes;

        // Reconstruimos la firma con la clave secreta
        $recalculatedSignature = hash_hmac('sha256', $headerB64 . "." . $payloadB64, JWT_SECRET_KEY, true);
        $recalculatedSignatureB64 = self::base64UrlEncode($recalculatedSignature);

        // Si nuestra firma reconstruida coincide con la que trae el JWT, es genuino.
        if (hash_equals($recalculatedSignatureB64, $signatureB64)) {
            $payload = json_decode(base64_decode($payloadB64), true);

            // Validar expiración
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false; // El token expiró
            }

            return $payload; // Retornamos los datos del usuario (id, rol...)
        }

        return false;
    }

    /**
     * Leer el token que viene en la cabecera 'Authorization' de la petición HTTP
     */
    public static function getBearerTokenFromHeader()
    {
        $headers = '';
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx o fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        // Trae algo como: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
}
