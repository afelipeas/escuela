import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    private authService = inject(AuthService);
    private enrutador = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    // Datos del formulario de acceso
    credenciales = {
        usuario: '',
        contrasena: ''
    };

    // Estados del componente
    contrasenaVisible = false;
    cargando = false;
    mensajeError = '';
    camposTocados = false;

    alternarContrasena(): void {
        this.contrasenaVisible = !this.contrasenaVisible;
    }

    iniciarSesion(): void {
        this.camposTocados = true;

        if (!this.credenciales.usuario.trim() || !this.credenciales.contrasena.trim()) {
            this.mensajeError = 'Por favor completa todos los campos para continuar.';
            return;
        }

        this.cargando = true;
        this.mensajeError = '';

        this.authService.login(this.credenciales.usuario, this.credenciales.contrasena).subscribe({
            next: (res) => {
                this.cargando = false;
                
                if (res.ok && res.datos) {
                    // Navegar dinámicamente según el rol en la Base de Datos
                    const rol = res.datos.usuario.rol;
                    if (rol === 'admin') this.enrutador.navigate(['/admin/dashboard']);
                    else if (rol === 'vendedor') this.enrutador.navigate(['/vendedor/dashboard']);
                    else if (rol === 'docente') this.enrutador.navigate(['/docente/dashboard']);
                    else if (rol === 'almacen') this.enrutador.navigate(['/almacen/dashboard']);
                    else if (rol === 'cliente') this.enrutador.navigate(['/cliente/dashboard']);
                    else this.enrutador.navigate(['/estudiante/dashboard']);
                } else {
                    // Contraseña incorrecta u otro error (convertido de catchError)
                    if (res.status === 401 || res.status === 403) {
                        this.mensajeError = '🚧 El usuario o la contraseña son incorrectos.';
                    } else {
                        this.mensajeError = '⚠️ Error de conexión con el servidor backend.';
                    }
                }
                this.cdr.detectChanges(); // <--- FORZAR ACTUALIZACIÓN DE UI
            },
            error: (err) => {
                this.cargando = false;
                this.mensajeError = '⚠️ Fallo crítico de red o de código.';
                this.cdr.detectChanges(); // <--- FORZAR ACTUALIZACIÓN DE UI
            }
        });
    }

    alEscribir(): void {
        if (this.mensajeError) {
            this.mensajeError = '';
        }
    }

    loginConGoogle(): void {
        alert('Pronto: Integración con la API de Google (Google Identity Services) para Iniciar Sesión.');
    }
}
