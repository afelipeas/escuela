<?php
// ================================================================
// app/Routes/api.php — Enrutador Principal
// ================================================================
// Compara la ruta solicitada con nuestra lista de endpoints y,
// si coincide, ejecuta el Controlador y Método correspondiente.
// Si no coincide con nada, devuelve un 404 No Encontrado.
// ================================================================

use App\Helpers\Response;
use App\Controllers\AuthController;

// Remover posibles slashes conflictivos
$uriOjal = trim($uri, '/');
if (empty($uriOjal)) {
    Response::success(null, "API Escuela Dominical. Todo verde. 🌱");
}

// Convertimos la URI en un arreglo por niveles
// Ej: /api/auth/login → ['api', 'auth', 'login']
$ruta = explode('/', $uriOjal);

// Sacamos "api/" si existe para facilitar la lectura
if ($ruta[0] === 'api') {
    array_shift($ruta);
}

// En este punto, si pidieron /api/auth/login, $ruta = ['auth', 'login']
$modulo = $ruta[0] ?? '';
$accion = $ruta[1] ?? '';
$id_param = isset($ruta[2]) ? (int)$ruta[2] : null; // Si viene un ID en la URL

// ================================================================
// MAPA DE RUTAS (Switch / Router Manual en lugar de framework pesado)
// ================================================================
switch ($modulo) {

    // --- MÓDULO AUTH ---
    case 'auth':
        $authController = new AuthController();
        
        if ($metodo === 'POST' && $accion === 'login') {
            $authController->login();
        } 
        elseif ($metodo === 'POST' && $accion === 'registro') {
            $authController->registro();
        }
        else {
            Response::notFound("Ruta de autenticación inexistente.");
        }
        break;

    // --- MÓDULO USUARIOS (Admin) ---
    case 'usuarios':
        $usuarioController = new \App\Controllers\UsuarioController();
        if ($metodo === 'GET' && $accion === 'recientes') {
            $usuarioController->getRecientes();
        } elseif ($metodo === 'GET' && $accion === 'clientes') {
            $usuarioController->getClientes();
        } elseif ($metodo === 'GET') {
            $usuarioController->getAll();
        } elseif ($metodo === 'POST' && $accion === 'editar') {
            $usuarioController->update();
        } elseif ($metodo === 'POST' && $accion === 'eliminar') {
            $usuarioController->delete();
        } elseif ($metodo === 'POST') {
            $usuarioController->create();
        }
        break;

    // --- MÓDULO CONFIGURACIÓN (Admin) ---
    case 'configuracion':
        $configController = new \App\Controllers\ConfiguracionController();
        if ($metodo === 'GET') {
            $configController->get();
        } elseif ($metodo === 'POST' && $accion === 'optimizar') {
            $configController->optimize();
        } elseif ($metodo === 'POST') {
            $configController->save();
        }
        break;

    // --- MÓDULO LOGS DE SISTEMA (Admin) ---
    case 'logs':
        $logController = new \App\Controllers\SystemLogController();
        if ($metodo === 'GET') {
            $logController->getAll();
        } elseif ($metodo === 'POST' && $accion === 'limpiar') {
            $logController->clear();
        }
        break;

    case 'clases':
        $claseController = new \App\Controllers\ClaseController();
        if ($metodo === 'GET' && $accion === 'resumen-docente') {
            $claseController->getResumenDocente();
        } elseif ($metodo === 'GET' && $accion === 'mis-alumnos') {
            $claseController->misAlumnos();
        } elseif ($metodo === 'GET') {
            $claseController->getProximas();
        } elseif ($metodo === 'POST' && $accion === 'subir-material') {
            $claseController->subirMaterial();
        } elseif ($metodo === 'POST') {
            $claseController->create();
        }
        break;
    
    case 'cursos':
        $cursoController = new \App\Controllers\CursoController();
        if ($metodo === 'GET' && $accion === 'mis-cursos') {
            $cursoController->getMisCursos();
        } elseif ($metodo === 'GET' && $accion === 'calificaciones') {
            $cursoController->getCalificacionesDocente();
        } elseif ($metodo === 'GET' && $accion === 'detalle') {
            $cursoController->getById();
        } elseif ($metodo === 'GET') {
            $cursoController->getAll();
        } elseif ($metodo === 'POST' && $accion === 'subir-material') {
            $cursoController->subirMaterial();
        } elseif ($metodo === 'POST') {
            $cursoController->create();
        }
        break;

    case 'lecciones':
        $leccionController = new \App\Controllers\LeccionController();
        if ($metodo === 'POST' && $accion === 'subir-material') {
            $leccionController->subirMaterial();
        } elseif ($metodo === 'POST' && $accion === 'editar') {
            $leccionController->update();
        } elseif ($metodo === 'POST' && $accion === 'eliminar') {
            $leccionController->delete();
        } elseif ($metodo === 'POST') {
            $leccionController->create();
        }
        break;

    case 'aula':
        $aulaController = new \App\Controllers\AulaController();
        if ($metodo === 'GET' && $accion === 'cursos') {
            $aulaController->misCursos();
        } elseif ($metodo === 'GET' && $accion === 'mis-inscripciones') {
            $aulaController->getMisInscripcionesIds();
        } elseif ($metodo === 'GET' && $accion === 'resumen') {
            $aulaController->getResumenEstudiante();
        } elseif ($metodo === 'GET' && $accion === 'lecciones') {
            $aulaController->getLecciones();
        } elseif ($metodo === 'GET' && $accion === 'leccion') {
            $aulaController->getDetalleLeccion();
        } elseif ($metodo === 'POST' && $accion === 'completar-leccion') {
            $aulaController->completarLeccion();
        } elseif ($metodo === 'POST' && $accion === 'inscribir') {
            $aulaController->inscribir();
        } elseif ($metodo === 'GET' && $accion === 'comentarios') {
            $aulaController->getComentarios();
        } elseif ($metodo === 'POST' && $accion === 'comentario') {
            $aulaController->postComentario();
        }
        break;

    // --- MÓDULO TIENDA e INVENTARIO ---
    case 'productos':
        $prodController = new \App\Controllers\ProductoController();
        if ($metodo === 'GET' && $accion === 'detalle') {
            $prodController->getById();
        } elseif ($metodo === 'GET') {
            $prodController->getAll();
        } elseif ($metodo === 'POST' && $accion === 'editar') {
            $prodController->update();
        } elseif ($metodo === 'POST' && $accion === 'eliminar') {
            $prodController->delete();
        } elseif ($metodo === 'POST' && $accion === 'subir-imagen') {
            $prodController->subirImagen();
        } elseif ($metodo === 'POST') {
            $prodController->create();
        }
        break;

    case 'carrito':
        $carController = new \App\Controllers\CarritoController();
        if ($metodo === 'GET') {
            $carController->getMiCarrito();
        } elseif ($metodo === 'POST' && $accion === 'agregar') {
            $carController->agregar();
        } elseif ($metodo === 'DELETE' && $accion === 'eliminar') {
            $carController->eliminar();
} elseif ($metodo === 'POST' && $accion === 'vaciar') {
             $carController->vaciar();
         }
         break;

    case 'proveedores':
        $provController = new \App\Controllers\ProveedorController();
        if ($metodo === 'GET') {
            $provController->getAll();
        } elseif ($metodo === 'POST') {
            $provController->create();
        }
        break;

    case 'ordenes-compra':
        $ocController = new \App\Controllers\OrdenCompraController();
        if ($metodo === 'GET' && $accion === 'reporte') {
            $ocController->reporte();
        } elseif ($metodo === 'GET' && $accion === 'detalle') {
            $ocController->getDetalle();
        } elseif ($metodo === 'GET') {
            $ocController->getAll();
        } elseif ($metodo === 'POST' && $accion === 'editar') {
            $ocController->update();
        } elseif ($metodo === 'POST' && $accion === 'eliminar') {
            $ocController->delete();
        } elseif ($metodo === 'POST') {
            $ocController->create();
        }
        break;
 
     case 'inventario':
        $invController = new \App\Controllers\InventarioController();
        if ($metodo === 'GET' && $accion === 'resumen') {
            $invController->getResumen();
        } elseif ($metodo === 'GET' && $accion === 'critico') {
            $invController->getStockCritico();
        } elseif ($metodo === 'GET' && $accion === 'movimientos') {
            $invController->getMovimientos();
        } elseif ($metodo === 'GET' && $accion === 'reporte') {
            $invController->getReporte();
        } elseif ($metodo === 'GET' && $accion === 'stock-completo') {
            $invController->getInventarioCompleto();
        }
        break;

    case 'ventas':
        $ventasController = new \App\Controllers\VentasController();
        if ($metodo === 'GET' && $accion === 'resumen-admin') {
            $ventasController->adminKPIs();
        } elseif ($metodo === 'GET' && $accion === 'recientes') {
            $ventasController->getRecientes();
        } elseif ($metodo === 'GET' && $accion === 'comisiones') {
            $ventasController->misComisiones();
        } elseif ($metodo === 'GET' && $accion === 'consultas') {
            $ventasController->getConsultas();
        } elseif ($metodo === 'GET' && $accion === 'reporte') {
            $ventasController->getReporte();
        } elseif ($metodo === 'GET' && $accion === 'top-productos') {
            $ventasController->topProductos();
        } elseif ($metodo === 'GET' && $accion === 'estadisticas') {
            $ventasController->estadisticas();
        }
        break;

    case 'pedidos':
        $pedidoController = new \App\Controllers\PedidoController();
        if ($metodo === 'GET' && $accion === 'detalle') {
            $pedidoController->getDetallePedido();
        } elseif ($metodo === 'GET' && $accion === 'puntos') {
            $pedidoController->getMisPuntos();
        } elseif ($metodo === 'GET') {
            $pedidoController->getMisPedidos();
        } elseif ($metodo === 'POST' && $accion === 'crear') {
            $pedidoController->crearPedido();
        } elseif ($metodo === 'POST' && $accion === 'checkout') {
            $pedidoController->checkout();
        } elseif ($metodo === 'PUT' && $accion === 'actualizar') {
            $pedidoController->actualizarPedido();
        } elseif ($metodo === 'DELETE' && $accion === 'eliminar') {
            $pedidoController->eliminarPedido();
        }
        break;

    case 'notificaciones':
        $notifController = new \App\Controllers\NotificacionController();
        if ($metodo === 'GET') {
            $notifController->index();
        } elseif ($metodo === 'POST' && $accion === 'marcar-leida') {
            $notifController->marcarLeida();
        } elseif ($metodo === 'POST' && $accion === 'marcar-todas-leidas') {
            $notifController->marcarTodasLeidas();
        } elseif ($metodo === 'POST' && $accion === 'enviar-a-curso') {
            $notifController->enviarACurso();
        }
        break;

    case 'ayuda':
        $ayudaController = new \App\Controllers\AyudaController();
        if ($metodo === 'POST' && $accion === 'contacto') {
            $ayudaController->crearSolicitudSoporte();
        } elseif ($metodo === 'GET' && $accion === 'tickets') {
            $ayudaController->getTicketsVendedor();
        } elseif ($metodo === 'GET' && $accion === 'mis-tickets') {
            $ayudaController->getMisTicketsCliente();
        } elseif ($metodo === 'POST' && $accion === 'responder') {
            $ayudaController->responderTicket();
        }
        break;

    case 'comentarios':
        $comentarioController = new \App\Controllers\ComentarioController();
        if ($metodo === 'POST' && $accion === 'eliminar') {
            $comentarioController->eliminar();
        } elseif ($metodo === 'GET') {
            $comentarioController->listar();
        } elseif ($metodo === 'POST') {
            $comentarioController->agregar();
        }
        break;

    case 'logros':
        $logroController = new \App\Controllers\LogroController();
        if ($metodo === 'GET' && $accion === 'mi-progreso') {
            $logroController->misLogros();
        } elseif ($metodo === 'GET') {
            $logroController->getAll();
        }
        break;

    // --- RUTAS NO ENCONTRADAS ---
    default:
        Response::notFound("El endpoint '/$uriOjal' no está configurado.");
        break;
}
