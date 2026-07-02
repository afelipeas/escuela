<?php
namespace App\Controllers;

use App\Models\UsuarioModel;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Helpers\JWT;

class AuthController
{
    private UsuarioModel $usuarioModel;

    public function __construct()
    {
        // Se inyecta la dependencia del modelo que maneja la BD.
        $this->usuarioModel = new UsuarioModel();
    }

    /**
     * POST /api/auth/login
     */
    public function login()
    {
        // 1. Obtener la data enviada por Angular (siempre viene en formato JSON crudo)
        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        // 2. Usar Validator para forzar que vengan los campos requeridos
        $errors = Validator::requireFields($payload, ['email', 'password']);
        if (!empty($errors)) {
            Response::error('Faltan campos obligatorios', 400, $errors);
        }

        // 3. Limpiar entrada
        $identificador = Validator::sanitize($payload['email']);
        $password = $payload['password']; // No sanitizamos password para no romper reglas de caracteres especiales.

        // 4. Preguntar a la Base de Datos si existe un usuario con este correo
        $usuario = $this->usuarioModel->getByEmailOrUsername($identificador);

        // Si el usuario NO existe, damos un mensaje genérico por seguridad (para que no enumere correos)
        if (!$usuario) {
            Response::error('Credenciales incorrectas.', 401);
        }

        // Verificar si su estado en la BD es diferente a 'activo' (ej: inactivo o suspendido)
        if ($usuario['estado'] !== 'activo') {
            Response::error('Tu cuenta se encuentra ' . $usuario['estado'] . '. Contacta soporte.', 403);
        }

        // 5. Verificar que el hash de la contraseña de la BD coincida con la que escribió
        if (!password_verify($password, $usuario['password_hash'])) {
            Response::error('Credenciales incorrectas.', 401);
        }

        // 6. ¡Éxito! Generar y firmar el JWT (Json Web Token)
        $tokenData = [
            'id'       => $usuario['id'],
            'email'    => $usuario['email'],
            'rol'      => $usuario['rol']
        ];
        $tokenSession = JWT::generate($tokenData);

        // 7. Enviar la Respuesta JSON a Angular.
        // Ojo: ¡No enviamos el hash de la contraseña de vuelta al front!
        $infoParaFrontend = [
            'usuario' => [
                'id'       => $usuario['id'],
                'nombre'   => $usuario['nombre'],
                'apellido' => $usuario['apellido'],
                'email'    => $usuario['email'],
                'rol'      => $usuario['rol']
            ],
            'token' => $tokenSession
        ];

        Response::success($infoParaFrontend, '¡Bienvenido de vuelta!');
    }

    /**
     * POST /api/auth/registro
     */
    public function registro()
    {
        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        $requeridos = ['nombre_usuario', 'nombre', 'apellido', 'email', 'password'];
        $errors = Validator::requireFields($payload, $requeridos);
        
        if (!empty($errors)) {
            Response::error('Formulario incompleto.', 400, $errors);
        }

        if (!Validator::isEmail($payload['email'])) {
            Response::error('El formato del correo es inválido.', 400);
        }

        try {
            $nuevoId = $this->usuarioModel->create($payload);
            Response::success(['id' => $nuevoId], 'Usuario registrado exitosamente', 201);
        } catch (\PDOException $e) {
            // Error code 23000 = Violación de Unique constraint (ej: email repetido)
            if ($e->getCode() == 23000) {
                Response::error('El correo o el nombre de usuario ya están registrados.', 409);
            }
            Response::error('Error al registrar usuario: ' . $e->getMessage(), 500);
        }
    }
}
