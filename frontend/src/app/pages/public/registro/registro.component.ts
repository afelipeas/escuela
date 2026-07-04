import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './registro.component.html',
    styleUrl: './registro.component.css'
})
export class RegistroComponent {

    // Paso actual del formulario (1, 2 o 3)
    pasoActual = 1;
    totalPasos = 3;

    // Estados del componente
    cargando = false;
    registroExitoso = false;
    mensajeError = '';
    camposTocados = false;

    // Contraseña visible
    contrasenaVisible = false;
    confirmarContrasenaVisible = false;

    // Paso 1 — Datos Personales
    datosPersonales = {
        nombre: '',
        apellido: '',
        telefono: '',
        fechaNacimiento: ''
    };

    // Paso 2 — Credenciales de Acceso
    datosAcceso = {
        nombreUsuario: '',
        correo: '',
        contrasena: '',
        confirmarContrasena: ''
    };

    // Paso 3 — Tipo de Perfil
    tipoUsuario = '';   // 'estudiante' | 'cliente'
    aceptaTerminos = false;
    aceptaComunicaciones = false;

    // Indicadores de fortaleza de contraseña
    get fortalezaContrasena(): number {
        const c = this.datosAcceso.contrasena;
        if (!c) return 0;
        let puntos = 0;
        if (c.length >= 8) puntos++;
        if (/[A-Z]/.test(c)) puntos++;
        if (/[0-9]/.test(c)) puntos++;
        if (/[^A-Za-z0-9]/.test(c)) puntos++;
        return puntos;
    }

    get etiquetaFortaleza(): string {
        const nivel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
        return nivel[this.fortalezaContrasena] || '';
    }

    get claseFortaleza(): string {
        const clases = ['', 'barra-debil', 'barra-regular', 'barra-buena', 'barra-fuerte'];
        return clases[this.fortalezaContrasena] || '';
    }

    // Getters de validación por paso
    get paso1Valido(): boolean {
        return (
            this.datosPersonales.nombre.trim().length >= 2 &&
            this.datosPersonales.apellido.trim().length >= 2
        );
    }

    get paso2Valido(): boolean {
        return (
            this.datosAcceso.nombreUsuario.trim().length >= 3 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.datosAcceso.correo) &&
            this.datosAcceso.contrasena.length >= 8 &&
            this.datosAcceso.contrasena === this.datosAcceso.confirmarContrasena
        );
    }

    get paso3Valido(): boolean {
        return this.tipoUsuario !== '' && this.aceptaTerminos;
    }

    get contrasenasCoinciden(): boolean {
        return (
            this.datosAcceso.confirmarContrasena !== '' &&
            this.datosAcceso.contrasena === this.datosAcceso.confirmarContrasena
        );
    }

    constructor(private enrutador: Router, private authService: AuthService) { }

    /** Avanza al siguiente paso, validando el actual */
    siguientePaso(): void {
        this.camposTocados = true;
        this.mensajeError = '';

        if (this.pasoActual === 1 && !this.paso1Valido) {
            this.mensajeError = 'Por favor completa los campos obligatorios (Nombre y Apellido).';
            return;
        }

        if (this.pasoActual === 2 && !this.paso2Valido) {
            this.mensajeError = 'Por favor verifica todos los campos del formulario.';
            return;
        }

        if (this.pasoActual < this.totalPasos) {
            this.pasoActual++;
            this.camposTocados = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /** Retrocede al paso anterior */
    pasoPrevio(): void {
        if (this.pasoActual > 1) {
            this.pasoActual--;
            this.mensajeError = '';
            this.camposTocados = false;
        }
    }

    /** Selecciona el tipo de usuario */
    seleccionarRol(rol: string): void {
        this.tipoUsuario = rol;
        this.mensajeError = '';
    }

    /** Alterna visibilidad del campo contraseña */
    alternarContrasena(): void {
        this.contrasenaVisible = !this.contrasenaVisible;
    }

    /** Alterna visibilidad del campo confirmar contraseña */
    alternarConfirmarContrasena(): void {
        this.confirmarContrasenaVisible = !this.confirmarContrasenaVisible;
    }

    /** Limpia el mensaje de error al escribir */
    alEscribir(): void {
        if (this.mensajeError) this.mensajeError = '';
    }

    /** Envía el formulario de registro */
    registrarse(): void {
        this.camposTocados = true;

        if (!this.paso3Valido) {
            this.mensajeError = !this.tipoUsuario
                ? 'Por favor selecciona tu tipo de perfil.'
                : 'Debes aceptar los Términos y Condiciones para continuar.';
            return;
        }

        this.cargando = true;
        this.mensajeError = '';

        const payload = {
            nombre_usuario: this.datosAcceso.nombreUsuario,
            nombre: this.datosPersonales.nombre,
            apellido: this.datosPersonales.apellido,
            email: this.datosAcceso.correo,
            password: this.datosAcceso.contrasena,
            rol: this.tipoUsuario,
            telefono: this.datosPersonales.telefono,
            fecha_nacimiento: this.datosPersonales.fechaNacimiento
        };

        this.authService.register(payload).subscribe(res => {
            this.cargando = false;
            if (res.ok !== false) {
                this.registroExitoso = true;
                setTimeout(() => {
                    this.enrutador.navigate(['/login']);
                }, 3000);
            } else {
                let msjError = 'Error al registrar el usuario.';
                if (res.error?.error?.mensaje) {
                    msjError = res.error.error.mensaje;
                } else if (res.error?.status === 409) {
                    msjError = 'El correo o nombre de usuario ya están registrados.';
                }
                this.mensajeError = msjError;
            }
        });
    }

    /** Calcula el porcentaje de progreso */
    get porcentajeProgreso(): number {
        return ((this.pasoActual - 1) / (this.totalPasos - 1)) * 100;
    }
}
