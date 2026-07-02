import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-perfil',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './perfil.component.html',
    styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {

    public authService = inject(AuthService);

    // Datos del usuario (se inicializan dinámicamente en ngOnInit)
    usuario = {
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        rol: '',
        foto: '👤',
        fechaRegistro: '',
        biografia: ''
    };

    // Modelos para edición
    perfilEdit = { ...this.usuario };
    passwordEdit = { actual: '', nueva: '', confirmar: '' };

    seccionActiva: string = 'general'; // general, seguridad, preferencias
    mensajeExito: string = '';

    constructor(private router: Router) { }

    ngOnInit(): void {
        const user = this.authService.currentUser();
        if (user) {
            const fullNombre = user.nombre || '';
            const parts = fullNombre.trim().split(/\s+/);
            let nombre = '';
            let apellido = '';
            if (parts.length > 0) {
                nombre = parts[0];
                if (parts.length > 1) {
                    apellido = parts.slice(1).join(' ');
                }
            }

            const rolesDisplay: Record<string, string> = {
                'admin': 'Administrador',
                'docente': 'Docente',
                'estudiante': 'Estudiante',
                'vendedor': 'Vendedor',
                'almacen': 'Almacén',
                'cliente': 'Cliente'
            };
            const rolKey = user.rol || 'cliente';
            const rolDisplay = rolesDisplay[rolKey] || 'Cliente';

            let biografia = '';
            if (rolKey === 'estudiante') {
                biografia = 'Me encanta aprender sobre las historias de la Biblia y participar en las manualidades de la escuela.';
            } else if (rolKey === 'cliente') {
                biografia = 'Cliente de la Tienda Virtual. Interesado en adquirir recursos y materiales didácticos.';
            } else {
                biografia = `Usuario con rol de ${rolDisplay} en la plataforma.`;
            }

            this.usuario = {
                nombre: nombre,
                apellido: apellido,
                email: user.email || '',
                telefono: rolKey === 'estudiante' ? '+57 321 456 7890' : '+57 300 123 4567',
                rol: rolDisplay,
                foto: user.foto || '👤',
                fechaRegistro: '15 de Enero, 2026',
                biografia: biografia
            };

            this.perfilEdit = { ...this.usuario };
        }
    }

    guardarPerfil(): void {
        this.usuario = { ...this.perfilEdit };
        this.mostrarMensaje('¡Perfil actualizado con éxito! ✨');
    }

    cambiarPassword(): void {
        if (this.passwordEdit.nueva === this.passwordEdit.confirmar) {
            this.mostrarMensaje('¡Contraseña actualizada correctamente! 🔐');
            this.passwordEdit = { actual: '', nueva: '', confirmar: '' };
        }
    }

    mostrarMensaje(msg: string): void {
        this.mensajeExito = msg;
        setTimeout(() => this.mensajeExito = '', 4000);
    }

    cerrarSesion(): void {
        this.router.navigate(['/login']);
    }
}
