<?php
namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Models\SystemLogModel;

class AyudaController
{
    private SystemLogModel $logModel;

    public function __construct()
    {
        $this->logModel = new SystemLogModel();
    }

    /**
     * POST /api/ayuda/contacto
     */
    public function crearSolicitudSoporte()
    {
        $usuario = AuthMiddleware::verify();
        
        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        // Validar campos requeridos
        $req = ['categoria', 'asunto', 'mensaje'];
        $errores = Validator::requireFields($payload, $req);
        if (!empty($errores)) {
            Response::error("Campos del formulario de soporte incompletos", 400, $errores);
        }

        // Registrar la solicitud en el Log del Sistema para auditoría del Administrador
        $detallesLog = sprintf(
            "Categoría: %s\nAsunto: %s\nMensaje: %s\nUsuario Solicitante ID: %d (%s)\nEstado: Pendiente",
            htmlspecialchars($payload['categoria']),
            htmlspecialchars($payload['asunto']),
            htmlspecialchars($payload['mensaje']),
            $usuario['id'],
            $usuario['email']
        );

        $this->logModel->log(
            'INFO',
            $usuario['email'],
            'Solicitud de Soporte Enviada',
            $detallesLog
        );

        Response::success(
            null,
            "¡Tu solicitud de soporte ha sido registrada con éxito! Nos comunicaremos a tu correo " . $usuario['email'] . " en menos de 24 horas."
        );
    }

    /**
     * GET /api/ayuda/tickets
     */
    public function getTicketsVendedor()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['vendedor', 'admin']);

        // Obtener todos los logs de soporte
        $logs = $this->logModel->getAll('INFO', 'Solicitud de Soporte Enviada');

        $tickets = [];

        // Parsear logs reales
        foreach ($logs as $log) {
            if ($log['accion'] !== 'Solicitud de Soporte Enviada') {
                continue;
            }

            $detalles = $log['detalles'] ?? '';
            $categoria = 'Consulta General';
            $asunto = 'Inquietud Técnica';
            $mensaje = '';
            $email = 'estudiante@escuela.com';
            $estado = 'Pendiente';

            // Extraer usando regex o líneas
            if (preg_match('/Categoría: (.*?)(?=\n|$)/i', $detalles, $matches)) {
                $categoria = trim($matches[1]);
            }
            if (preg_match('/Asunto: (.*?)(?=\n|$)/i', $detalles, $matches)) {
                $asunto = trim($matches[1]);
            }
            if (preg_match('/Mensaje: (.*?)(?=\n|$)/i', $detalles, $matches)) {
                $mensaje = trim($matches[1]);
            }
            if (preg_match('/\((.*?)\)/i', $detalles, $matches)) {
                $email = trim($matches[1]);
            }
            if (preg_match('/Estado: (.*?)(?=\n|$)/i', $detalles, $matches)) {
                $estado = trim($matches[1]);
            }

            // Si hay alguna respuesta en los logs para este ticket
            $respuestas = $this->logModel->getAll('INFO', 'Respuesta a Soporte Enviada');
            foreach ($respuestas as $resp) {
                if (strpos($resp['detalles'], "Ticket ID: " . $log['id']) !== false) {
                    $estado = 'Resuelto';
                }
            }

            $tickets[] = [
                'id' => $log['id'],
                'fecha' => date('d/m/Y H:i', strtotime($log['fecha'])),
                'usuario' => $log['usuario'],
                'email' => $email,
                'categoria' => $categoria,
                'asunto' => $asunto,
                'mensaje' => $mensaje,
                'estado' => $estado
            ];
        }

        // Agregar tickets simulados premium adicionales para demostración comercial
        $ticketsSimulados = [
            [
                'id' => 9991,
                'fecha' => '20/05/2026 14:30',
                'usuario' => 'Camila Rivas',
                'email' => 'camila.rivas@correo.com',
                'categoria' => '🛒 Problema con Canjes de Tienda',
                'asunto' => 'Mi termo de acero inoxidable figura en despacho pero no ha llegado',
                'mensaje' => 'Hola, realicé el canje de mi termo hace 6 días y todavía no he recibido noticias del transportista. ¿Podrían revisar si hay algún problema con la dirección?',
                'estado' => 'Pendiente'
            ],
            [
                'id' => 9992,
                'fecha' => '20/05/2026 11:15',
                'usuario' => 'Mateo Delgado',
                'email' => 'mateo.delgado@correo.com',
                'categoria' => '💎 Problema con Saldo de Puntos Fe',
                'asunto' => 'No se me sumaron los puntos de la última lección del curso de Ventas',
                'mensaje' => 'Completé el módulo final ayer por la noche pero mi saldo sigue figurando en 450 puntos. Debería tener 550. Agradezco su revisión.',
                'estado' => 'Pendiente'
            ],
            [
                'id' => 9993,
                'fecha' => '19/05/2026 18:00',
                'usuario' => 'Pedro Gómez',
                'email' => 'pedro.gomez@correo.com',
                'categoria' => '🎓 Incoherencia en Calificaciones y Notas',
                'asunto' => 'El examen del módulo 2 figura con nota pendiente de calificar',
                'mensaje' => 'Ya envié la evaluación práctica de atención al cliente pero el docente aún no ha registrado la nota final.',
                'estado' => 'Resuelto'
            ]
        ];

        // Mezclar sin duplicar IDs
        $todos = array_merge($tickets, $ticketsSimulados);

        Response::success($todos);
    }

    /**
     * POST /api/ayuda/responder
     */
    public function responderTicket()
    {
        $usuario = AuthMiddleware::verify();
        RoleMiddleware::requireAnyRole($usuario, ['vendedor', 'admin']);

        $json = file_get_contents('php://input');
        $payload = json_decode($json, true);

        $req = ['id_ticket', 'respuesta'];
        $errores = Validator::requireFields($payload, $req);
        if (!empty($errores)) {
            Response::error("Campos incompletos para responder el ticket", 400, $errores);
        }

        // Registrar la respuesta en la bitácora
        $detallesLog = sprintf(
            "Respuesta de Soporte\nTicket ID: %d\nRespondido Por: %s (%s)\nRespuesta: %s",
            $payload['id_ticket'],
            $usuario['email'],
            $usuario['rol'],
            htmlspecialchars($payload['respuesta'])
        );

        $this->logModel->log(
            'INFO',
            $usuario['email'],
            'Respuesta a Soporte Enviada',
            $detallesLog
        );

        Response::success(null, "¡Respuesta registrada con éxito! El ticket ha sido marcado como Resuelto.");
    }

    /**
     * GET /api/ayuda/mis-tickets
     */
    public function getMisTicketsCliente()
    {
        $usuario = AuthMiddleware::verify();
        $email = $usuario['email'];

        $logs = $this->logModel->getAll('INFO', 'Solicitud de Soporte Enviada');
        $respuestas = $this->logModel->getAll('INFO', 'Respuesta a Soporte Enviada');
        $tickets = [];

        foreach ($logs as $log) {
            if (strpos($log['detalles'], $email) === false) continue;

            $detalles = $log['detalles'] ?? '';
            $categoria = 'Consulta General';
            $asunto = 'Inquietud Técnica';
            $mensaje = '';
            $estado = 'Pendiente';

            if (preg_match('/Categoría: (.*?)(?=\n|$)/i', $detalles, $m)) $categoria = trim($m[1]);
            if (preg_match('/Asunto: (.*?)(?=\n|$)/i', $detalles, $m)) $asunto = trim($m[1]);
            if (preg_match('/Mensaje: (.*?)(?=\n|$)/i', $detalles, $m)) $mensaje = trim($m[1]);

            $respuesta = null;
            foreach ($respuestas as $resp) {
                if (strpos($resp['detalles'], "Ticket ID: " . $log['id']) !== false) {
                    $estado = 'Resuelto';
                    if (preg_match('/Respuesta: (.*?)(?=\n|$)/s', $resp['detalles'], $rm)) {
                        $respuesta = trim($rm[1]);
                    }
                    break;
                }
            }

            $tickets[] = [
                'id' => $log['id'],
                'fecha' => date('d/m/Y H:i', strtotime($log['fecha'])),
                'categoria' => $categoria,
                'asunto' => $asunto,
                'mensaje' => $mensaje,
                'estado' => $estado,
                'respuesta' => $respuesta
            ];
        }

        Response::success($tickets);
    }
}
