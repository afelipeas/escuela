import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    usuario = this.authService.currentUser;

    // Menús definidos de forma estática para el computed
    private menuConfig: Record<string, { label: string, icon: string, route: string }[]> = {
        'admin': [
            { label: 'Panel Control', icon: '🛡️', route: '/admin/dashboard' },
            { label: 'Catálogo Tienda', icon: '🛍️', route: '/admin/productos' },
            { label: 'Gestión Ventas', icon: '💰', route: '/admin/ventas' },
            { label: 'Rep. Inventario', icon: '📋', route: '/almacen/reportes' },
            { label: 'Rep. Compras', icon: '📝', route: '/admin/compras' },
            { label: 'Usuarios', icon: '👤', route: '/admin/usuarios' },
            { label: 'Configuración', icon: '⚙️', route: '/admin/configuracion' },
            { label: 'Log de Sistema', icon: '📋', route: '/admin/logs' }
        ],
        'docente': [
            { label: 'Mi Panel', icon: '📊', route: '/docente/dashboard' },
            { label: 'Gestor Contenido', icon: '📚', route: '/docente/cursos' },
            { label: 'Mis Alumnos', icon: '👥', route: '/docente/alumnos' },
            { label: 'Calendario', icon: '📅', route: '/docente/calendario' }
        ],
        'estudiante': [
            { label: 'Panel Estudiante', icon: '📊', route: '/estudiante/dashboard' },
            { label: 'Explorar Cursos', icon: '🌍', route: '/estudiante/explorar' },
            { label: 'Mis Logros', icon: '🎖️', route: '/estudiante/logros' },
            { label: 'Tienda Virtual', icon: '🛍️', route: '/tienda/catalogo' }
        ],
        'vendedor': [
            { label: 'Hub Comercial', icon: '📊', route: '/vendedor/dashboard' },
            { label: 'Reportes Ventas', icon: '📈', route: '/vendedor/reportes' },
            { label: 'Catálogo', icon: '🛍️', route: '/tienda/catalogo' },
            { label: 'Soporte Clientes', icon: '💬', route: '/vendedor/soporte' }
        ],
        'almacen': [
            { label: 'Stock Almacén', icon: '📦', route: '/almacen/dashboard' },
            { label: 'Catálogo Tienda', icon: '🛍️', route: '/almacen/productos' },
            { label: 'Rep. Inventario', icon: '📋', route: '/almacen/reportes' },
            { label: 'Rep. Compras', icon: '📝', route: '/almacen/compras' },
            { label: 'Proveedores', icon: '🤝', route: '/almacen/proveedores' }
        ],
        'cliente': [
            { label: 'Mi Cuenta', icon: '🛍️', route: '/cliente/dashboard' },
            { label: 'Ir a Tienda', icon: '🛒', route: '/tienda/catalogo' },
            { label: 'Mis Pedidos', icon: '📦', route: '/cliente/pedidos' },
            { label: 'Ayuda', icon: '🎧', route: '/cliente/ayuda' }
        ],
        'public': [
            { label: 'Regresar Inicio', icon: '🏠', route: '/' },
            { label: 'Ver Tienda', icon: '🛒', route: '/tienda/catalogo' }
        ]
    };

    // Signal computada que reacciona automáticamente al cambio de usuario/rol
    currentMenu = computed(() => {
        const rol = this.usuario()?.rol || 'public';
        return this.menuConfig[rol] || this.menuConfig['public'];
    });

    cerrarSesion() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
