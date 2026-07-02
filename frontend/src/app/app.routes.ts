import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LandingComponent } from './pages/public/landing/landing.component';
import { LoginComponent } from './pages/public/login/login.component';
import { RegistroComponent } from './pages/public/registro/registro.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { EstudianteDashboardComponent } from './pages/estudiante/dashboard/estudiante-dashboard.component';
import { DocenteDashboardComponent } from './pages/docente/dashboard/docente-dashboard.component';
import { ClienteDashboardComponent } from './pages/cliente/dashboard/cliente-dashboard.component';
import { PedidosComponent } from './pages/cliente/pedidos/pedidos.component';
import { AyudaComponent } from './pages/cliente/ayuda/ayuda.component';
import { AlmacenDashboardComponent } from './pages/almacen/dashboard/almacen-dashboard.component';
import { VendedorDashboardComponent } from './pages/vendedor/dashboard/vendedor-dashboard.component';
import { NuevaVentaComponent } from './pages/vendedor/nueva-venta/nueva-venta.component';
import { SoporteVendedorComponent } from './pages/vendedor/soporte/soporte-vendedor.component';
import { TiendaCatalogoComponent } from './pages/public/tienda/catalogo/tienda-catalogo.component';
import { TiendaDetalleComponent } from './pages/public/tienda/detalle/tienda-detalle.component';
import { TiendaCarritoComponent } from './pages/public/tienda/carrito/tienda-carrito.component';
import { PerfilComponent } from './pages/public/perfil/perfil.component';
import { AulaLeccionComponent } from './pages/aula/leccion/leccion.component';
import { CrearClaseComponent } from './pages/docente/crear-clase/crear-clase.component';
import { LogrosComponent } from './pages/estudiante/logros/logros.component';
import { VendedorReportesComponent } from './pages/vendedor/reportes/reportes.component';
import { AlmacenReportesComponent } from './pages/almacen/reportes/reportes.component';
import { AlmacenComprasComponent } from './pages/almacen/compras/compras.component';
import { ProveedoresComponent } from './pages/almacen/proveedores/proveedores.component';
import { VentasDashboardComponent } from './pages/admin/ventas/ventas-dashboard.component';
import { UsuariosComponent } from './pages/admin/usuarios/usuarios.component';
import { ConfiguracionComponent } from './pages/admin/configuracion/configuracion.component';
import { LogsComponent } from './pages/admin/logs/logs.component';
import { AdminProductosComponent } from './pages/admin/productos/admin-productos.component';
import { ExplorarCursosComponent } from './pages/estudiante/explorar-cursos/explorar-cursos.component';
import { MainLayoutComponent } from './shared/layouts/main-layout.component';

export const routes: Routes = [
  // RUTAS PÚBLICAS (Sin Sidebar)
  {
    path: '',
    component: LandingComponent,
    title: 'Inicio — Escuela Dominical Virtual'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar Sesión — Escuela Dominical Virtual'
  },
  {
    path: 'registro',
    component: RegistroComponent,
    title: 'Crear Cuenta — Escuela Dominical Virtual'
  },
  {
    path: 'tienda/catalogo',
    component: TiendaCatalogoComponent,
    canActivate: [authGuard],
    title: 'Catálogo — Tienda Virtual'
  },
  {
    path: 'tienda/producto/:id',
    component: TiendaDetalleComponent,
    canActivate: [authGuard],
    title: 'Detalle de Producto — Tienda Virtual'
  },
  {
    path: 'tienda/carrito',
    component: TiendaCarritoComponent,
    canActivate: [authGuard],
    title: 'Carrito de Compras — Tienda Virtual'
  },

  // RUTAS PROTEGIDAS/ADMINISTRATIVAS (Con Sidebar Compartido)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        redirectTo: 'admin/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        title: 'Panel de Control — Administrador'
      },
      {
        path: 'admin/ventas',
        component: VentasDashboardComponent,
        title: 'Gestión de Ventas — Administrador'
      },
      {
        path: 'admin/usuarios',
        component: UsuariosComponent,
        title: 'Gestión de Usuarios — Administrador'
      },
      {
        path: 'admin/configuracion',
        component: ConfiguracionComponent,
        title: 'Configuración de Sistema — Administrador'
      },
      {
        path: 'admin/logs',
        component: LogsComponent,
        title: 'Logs de Auditoría — Administrador'
      },
      {
        path: 'admin/productos',
        component: AdminProductosComponent,
        title: 'Catálogo Tienda — Administrador'
      },
      {
        path: 'admin/compras',
        loadComponent: () => import('./pages/admin/compras/admin-compras.component').then(m => m.AdminComprasComponent),
        title: 'Reporte de Compras — Administrador'
      },
      {
        path: 'estudiante/dashboard',
        component: EstudianteDashboardComponent,
        title: 'Mi Escuela — Estudiante'
      },
      {
        path: 'estudiante/logros',
        component: LogrosComponent,
        title: 'Mis Logros y Actividades'
      },
      {
        path: 'estudiante/explorar',
        component: ExplorarCursosComponent,
        title: 'Explorar Nuevos Cursos'
      },
      {
        path: 'docente/dashboard',
        component: DocenteDashboardComponent,
        title: 'Panel del Docente — Escuela Virtual'
      },
      {
        path: 'docente/crear-clase',
        component: CrearClaseComponent,
        title: 'Nueva Clase — Panel del Docente'
      },
      {
        path: 'docente/cursos',
        loadComponent: () => import('./pages/docente/cursos/cursos.component').then(m => m.DocenteCursosComponent),
        title: 'Gestor de Contenido — Panel del Docente'
      },
      {
        path: 'docente/cursos/:id/lecciones',
        loadComponent: () => import('./pages/docente/cursos/lecciones-gestor/lecciones-gestor.component').then(m => m.LeccionesGestorComponent),
        title: 'Gestor de Lecciones — Panel del Docente'
      },
      {
        path: 'docente/cursos/:id/lecciones/:leccionId/comentarios',
        loadComponent: () => import('./pages/docente/cursos/comentarios-leccion/comentarios-leccion.component').then(m => m.ComentariosLeccionComponent),
        title: 'Comentarios de Lección — Panel del Docente'
      },
      {
        path: 'docente/alumnos',
        loadComponent: () => import('./pages/docente/alumnos/alumnos.component').then(m => m.AlumnosComponent),
        title: 'Mis Alumnos — Panel del Docente'
      },
      {
        path: 'docente/calendario',
        loadComponent: () => import('./pages/docente/calendario/calendario.component').then(m => m.CalendarioDocenteComponent),
        title: 'Mi Calendario — Panel del Docente'
      },
      {
        path: 'docente/calificaciones',
        loadComponent: () => import('./pages/docente/calificaciones/docente-calificaciones.component').then(m => m.DocenteCalificacionesComponent),
        title: 'Rendimiento de Estudiantes — Panel del Docente'
      },
      {
        path: 'almacen/dashboard',
        component: AlmacenDashboardComponent,
        title: 'Gestión de Almacén — Panel Logístico'
      },
      {
        path: 'almacen/reportes',
        component: AlmacenReportesComponent,
        title: 'Reportes de Inventario — Almacén'
      },
      {
        path: 'almacen/compras',
        component: AlmacenComprasComponent,
        title: 'Reporte de Compras — Almacén'
      },
      {
        path: 'almacen/proveedores',
        component: ProveedoresComponent,
        title: 'Gestión de Proveedores — Almacén'
      },
      {
        path: 'almacen/productos',
        component: AdminProductosComponent,
        title: 'Catálogo Tienda — Almacén'
      },
      {
        path: 'vendedor/dashboard',
        component: VendedorDashboardComponent,
        title: 'Ventas y Comisiones — Panel del Vendedor'
      },
      {
        path: 'vendedor/nueva-venta',
        component: NuevaVentaComponent,
        title: 'Nueva Venta — Panel del Vendedor'
      },
      {
        path: 'vendedor/reportes',
        component: VendedorReportesComponent,
        title: 'Mis Reportes — Centro de Ventas'
      },
      {
        path: 'vendedor/soporte',
        component: SoporteVendedorComponent,
        title: 'Soporte y Atención de Clientes — Centro de Ventas'
      },
      {
        path: 'cliente/dashboard',
        component: ClienteDashboardComponent,
        title: 'Mi Cuenta — Tienda Virtual'
      },
      {
        path: 'cliente/pedidos',
        component: PedidosComponent,
        title: 'Mis Pedidos y Canjes — Tienda Virtual'
      },
      {
        path: 'cliente/ayuda',
        component: AyudaComponent,
        title: 'Centro de Ayuda y Soporte — Tienda Virtual'
      },
      {
        path: 'calificaciones',
        loadComponent: () => import('./pages/estudiante/calificaciones/calificaciones.component').then(m => m.CalificacionesComponent),
        title: 'Mis Calificaciones'
      },
      {
        path: 'calendario',
        loadComponent: () => import('./pages/estudiante/calendario/calendario.component').then(m => m.CalendarioComponent),
        title: 'Mi Calendario Académico'
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        title: 'Mi Perfil — Escuela Dominical Virtual'
      }
    ]
  },

  {
    path: 'aula/leccion/:id',
    component: AulaLeccionComponent,
    canActivate: [authGuard],
    title: 'Estudiando — Aula Virtual'
  },

  {
    path: '**',
    redirectTo: ''
  }
];
