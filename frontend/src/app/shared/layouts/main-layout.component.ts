import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
    private authService = inject(AuthService);
    private dataService = inject(DataService);
    private router = inject(Router);

    usuario = this.authService.currentUser;

    // Estado de notificaciones
    notificaciones = signal<any[]>([]);
    totalSinLeer = signal<number>(0);
    mostrarNotifDropdown = signal<boolean>(false);

    // Estado de Perfil de Usuario
    mostrarUserDropdown = signal<boolean>(false);

    ngOnInit(): void {
        this.cargarNotificaciones();
        setInterval(() => this.cargarNotificaciones(), 120000);
    }

    cargarNotificaciones() {
        if (!this.usuario()) return;
        this.dataService.getNotificaciones().subscribe({
            next: (res) => {
                if (res.ok) {
                    this.notificaciones.set(res.datos.notificaciones);
                    this.totalSinLeer.set(res.datos.totalSinLeer);
                }
            }
        });
    }

    toggleNotifDropdown(event: Event) {
        event.stopPropagation();
        this.mostrarUserDropdown.set(false); // Cerrar el otro dropdown
        this.mostrarNotifDropdown.update(v => !v);
    }

    toggleUserDropdown(event: Event) {
        event.stopPropagation();
        this.mostrarNotifDropdown.set(false); // Cerrar el otro dropdown
        this.mostrarUserDropdown.update(v => !v);
    }

    marcarLeida(notif: any) {
        if (notif.leido) return;
        this.dataService.marcarNotificacionLeida(notif.id).subscribe(() => {
            this.cargarNotificaciones();
        });
    }

    marcarTodasLeidas() {
        this.dataService.marcarTodasLeidas().subscribe(() => {
            this.cargarNotificaciones();
        });
    }

    verTodas() {
        this.mostrarNotifDropdown.set(false);
    }

    cerrarSesion() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    @HostListener('document:click')
    cerrarDropdowns() {
        this.mostrarNotifDropdown.set(false);
        this.mostrarUserDropdown.set(false);
    }

    getIcon(tipo: string): string {
        switch (tipo) {
            case 'tarea': return '📝';
            case 'evento': return '📅';
            case 'novedad': return '✨';
            default: return '🔔';
        }
    }
}
