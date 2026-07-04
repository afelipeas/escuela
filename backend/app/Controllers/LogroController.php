<?php
namespace App\Controllers;

use App\Models\LogroModel;
use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class LogroController
{
    private LogroModel $logroModel;

    public function __construct()
    {
        $this->logroModel = new LogroModel();
    }

    /**
     * GET /api/logros
     * Catálogo maestro de insignias disponibles
     */
    public function getAll()
    {
        $logros = $this->logroModel->getAll();
        Response::success($logros);
    }

    /**
     * GET /api/logros/mis-logros
     */
    public function misLogros()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['estudiante']);

        $misLogros = $this->logroModel->getByEstudiante($usuario['id']);
        Response::success($misLogros);
    }
}
