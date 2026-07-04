import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-admin-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './usuarios.component.html',
    styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    usuarios: any[] = [];
    usuariosFiltrados: any[] = [];
    busqueda = '';

    // Variables de control de Modal
    mostrarModal = false;
    editando = false;
    cargando = false;
    mensajeError = '';
    mensajeExito = '';

    // Modelo del Formulario
    formUsuario = {
        id: null as number | null,
        nombre_usuario: '',
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'cliente',
        estado: 'activo'
    };

    rolesDisponibles = [
        { valor: 'admin', etiqueta: 'Administrador' },
        { valor: 'docente', etiqueta: 'Docente' },
        { valor: 'estudiante', etiqueta: 'Estudiante' },
        { valor: 'vendedor', etiqueta: 'Vendedor' },
        { valor: 'almacen', etiqueta: 'Almacén' },
        { valor: 'cliente', etiqueta: 'Cliente / Canjeador' }
    ];

    estadosDisponibles = [
        { valor: 'activo', etiqueta: 'Activo' },
        { valor: 'inactivo', etiqueta: 'Inactivo' }
    ];

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    cargarUsuarios(): void {
        this.cargando = true;
        this.dataService.getTodosLosUsuarios().subscribe({
            next: (data) => {
                this.usuarios = data;
                this.aplicarFiltro();
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    aplicarFiltro(): void {
        if (!this.busqueda.trim()) {
            this.usuariosFiltrados = [...this.usuarios];
        } else {
            const query = this.busqueda.toLowerCase();
            this.usuariosFiltrados = this.usuarios.filter(u => 
                (u.nombre + ' ' + u.apellido).toLowerCase().includes(query) ||
                u.nombre_usuario.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query) ||
                u.rol.toLowerCase().includes(query)
            );
        }
    }

    abrirNuevoModal(): void {
        this.editando = false;
        this.mostrarModal = true;
        this.mensajeError = '';
        this.mensajeExito = '';
        this.formUsuario = {
            id: null,
            nombre_usuario: '',
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            rol: 'cliente',
            estado: 'activo'
        };
    }

    abrirEditarModal(usuario: any): void {
        this.editando = true;
        this.mostrarModal = true;
        this.mensajeError = '';
        this.mensajeExito = '';
        this.formUsuario = {
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            password: '', // Vacío por seguridad
            rol: usuario.rol,
            estado: usuario.estado
        };
    }

    cerrarModal(): void {
        this.mostrarModal = false;
        this.mensajeError = '';
        this.mensajeExito = '';
    }

    guardarUsuario(): void {
        this.mensajeError = '';
        this.mensajeExito = '';

        if (!this.formUsuario.nombre_usuario || !this.formUsuario.nombre || !this.formUsuario.apellido || !this.formUsuario.email || !this.formUsuario.rol) {
            this.mensajeError = 'Por favor completa todos los campos requeridos.';
            return;
        }

        if (!this.editando && !this.formUsuario.password) {
            this.mensajeError = 'La contraseña es obligatoria para nuevos usuarios.';
            return;
        }

        this.cargando = true;

        if (this.editando) {
            this.dataService.editarUsuario(this.formUsuario).subscribe({
                next: (res) => {
                    this.cargando = false;
                    if (res.ok) {
                        this.mensajeExito = 'Usuario actualizado correctamente.';
                        setTimeout(() => this.cerrarModal(), 1500);
                        this.cargarUsuarios();
                    } else {
                        this.mensajeError = res.mensaje || 'Error al actualizar usuario.';
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.cargando = false;
                    this.mensajeError = err.error?.mensaje || 'Error al actualizar usuario.';
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.dataService.crearUsuario(this.formUsuario).subscribe({
                next: (res) => {
                    this.cargando = false;
                    if (res.ok) {
                        this.mensajeExito = 'Usuario creado correctamente.';
                        setTimeout(() => this.cerrarModal(), 1500);
                        this.cargarUsuarios();
                    } else {
                        this.mensajeError = res.mensaje || 'Error al crear usuario.';
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.cargando = false;
                    this.mensajeError = err.error?.mensaje || 'Error al crear usuario.';
                    this.cdr.detectChanges();
                }
            });
        }
    }

    eliminarUsuario(usuario: any): void {
        if (confirm(`¿Estás completamente seguro de que deseas eliminar permanentemente al usuario ${usuario.nombre} ${usuario.apellido}?`)) {
            this.dataService.eliminarUsuario(usuario.id).subscribe({
                next: (res) => {
                    if (res.ok) {
                        this.cargarUsuarios();
                    } else {
                        alert(res.mensaje || 'Error al eliminar usuario.');
                    }
                },
                error: (err) => {
                    alert(err.error?.mensaje || 'Error al eliminar usuario.');
                }
            });
        }
    }
}
