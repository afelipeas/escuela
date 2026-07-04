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
     * Leer el body JSON de la peticion (funciona en localhost y shared hosting)
     */
    private function readBody(): array
    {
        // Intentar leer JSON del body raw
        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);
        if (is_array($payload) && !empty($payload)) {
            return $payload;
        }
        // Fallback: algunos servidores shared hosting no populan php://input correctamente
        // Intentar leer de $_POST (form-data)
        if (!empty($_POST)) {
            return $_POST;
        }
        // Fallback: intentar de $_REQUEST
        if (!empty($_REQUEST) && isset($_REQUEST['email'])) {
            return $_REQUEST;
        }
        return [];
    }

    /**
     * POST /api/auth/login
     */
    public function login()
    {
        $payload = $this->readBody();

        $errors = Validator::requireFields($payload, ['email', 'password']);
        if (!empty($errors)) {
            Response::error('Faltan campos obligatorios', 400, $errors);
        }

        $identificador = trim($payload['email']);
        $password = $payload['password'];

        $usuario = $this->usuarioModel->getByEmailOrUsername($identificador);

        if (!$usuario) {
            Response::error('Credenciales incorrectas.', 401);
        }

        if ($usuario['estado'] !== 'activo') {
            Response::error('Tu cuenta se encuentra ' . $usuario['estado'] . '. Contacta soporte.', 403);
        }

        if (!password_verify($password, $usuario['password_hash'])) {
            Response::error('Credenciales incorrectas.', 401);
        }

        $tokenData = [
            'id'       => $usuario['id'],
            'email'    => $usuario['email'],
            'rol'      => $usuario['rol']
        ];
        $tokenSession = JWT::generate($tokenData);

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
        $payload = $this->readBody();

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
            if ($e->getCode() == 23000) {
                Response::error('El correo o el nombre de usuario ya están registrados.', 409);
            }
            Response::error('Error al registrar usuario: ' . $e->getMessage(), 500);
        }
    }
}
