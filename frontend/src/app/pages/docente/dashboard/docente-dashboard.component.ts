import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-docente-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './docente-dashboard.component.html',
    styleUrl: './docente-dashboard.component.css'
})
export class DocenteDashboardComponent implements OnInit {
    private dataService = inject(DataService);
    private authService = inject(AuthService);

    usuario = this.authService.currentUser;

    // Usamos signals para todo (mejor compatibilidad con zoneless)
    resumen = signal<any[]>([]);
    proximasClases = signal<any[]>([]);
    misCursos = signal<any[]>([]);

    // Class details modal signals
    mostrarDetallesClase = signal<boolean>(false);
    claseSeleccionada = signal<any>(null);
    archivoSeleccionado = signal<File | null>(null);
    subiendoArchivo = signal<boolean>(false);

    // Formulario de notificación
    notif = {
        id_curso: 0,
        titulo: '',
        mensaje: '',
        tipo: 'novedad'
    };
    enviando = false;

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        // Cargar estadísticas
        this.dataService.getResumenDocente().subscribe(data => this.resumen.set(data));

        // Cargar tabla de próximas clases
        this.dataService.getProximasClases().subscribe(data => {
            this.proximasClases.set(data);
            // Si la clase seleccionada está abierta en el modal, actualizar sus datos también
            if (this.claseSeleccionada()) {
                const actualizada = data.find(c => c.id === this.claseSeleccionada().id);
                if (actualizada) {
                    this.claseSeleccionada.set(actualizada);
                }
            }
        });

        // Cargar cursos para enviar notificaciones
        this.dataService.getMisCursosDocente().subscribe({
            next: (data) => {
                this.misCursos.set(data);
                if (data.length > 0 && this.notif.id_curso === 0) {
                    this.notif.id_curso = data[0].id;
                }
            },
            error: (err) => {
                console.error('Error cargando cursos:', err);
            }
        });
    }

    enviarNotificacion(): void {
        if (!this.notif.id_curso || !this.notif.titulo || !this.notif.mensaje) {
            alert('Por favor completa todos los campos (Curso, Título y Mensaje)');
            return;
        }

        this.enviando = true;
        this.dataService.enviarNotificacionACurso(
            Number(this.notif.id_curso),
            this.notif.titulo,
            this.notif.mensaje,
            this.notif.tipo
        ).subscribe({
            next: (res) => {
                alert(res.mensaje || '¡Notificación enviada con éxito!');
                this.notif.titulo = '';
                this.notif.mensaje = '';
                this.enviando = false;
            },
            error: (err) => {
                alert('Error al enviar: ' + (err.error?.mensaje || 'Error desconocido'));
                this.enviando = false;
            }
        });
    }

    abrirDetallesClase(clase: any): void {
        this.claseSeleccionada.set(clase);
        this.archivoSeleccionado.set(null);
        this.mostrarDetallesClase.set(true);
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.archivoSeleccionado.set(file);
        }
    }

    subirMaterialClase(): void {
        if (!this.claseSeleccionada() || !this.archivoSeleccionado()) return;

        this.subiendoArchivo.set(true);
        this.dataService.subirMaterialClase(this.claseSeleccionada().id, this.archivoSeleccionado()!).subscribe({
            next: (res) => {
                alert('¡Material de apoyo subido correctamente!');
                this.archivoSeleccionado.set(null);
                this.subiendoArchivo.set(false);
                this.cargarDatos(); // This will also update the open modal with the newly uploaded material filename and url!
            },
            error: (err) => {
                alert('Error al subir el archivo: ' + (err.error?.mensaje || 'Error desconocido'));
                this.subiendoArchivo.set(false);
            }
        });
    }

    obtenerMaterialDescargaUrl(url: string): string {
        return this.dataService.apiUrl.replace('/api', '/') + url;
    }
}
