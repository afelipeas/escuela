import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../../../core/services/data.service';

@Component({
    selector: 'app-lecciones-gestor',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './lecciones-gestor.component.html',
    styleUrl: './lecciones-gestor.component.css'
})
export class LeccionesGestorComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private dataService = inject(DataService);

    cursoId = 0;
    curso = signal<any>(null);
    lecciones = signal<any[]>([]);
    
    // New Lesson form
    nuevaLeccion = {
        titulo: '',
        descripcion: '',
        video_url: '',
        orden: 1
    };
    
    mostrarModal = signal<boolean>(false);
    enviando = signal<boolean>(false);
    editando = signal<boolean>(false);
    leccionEnEdicionId = signal<number | null>(null);
    mensajeExito = signal<string>('');
    mensajeError = signal<string>('');

    // Multiple reference website URLs
    sitiosReferencia: string[] = [];
    nuevoSitio = '';

    // File upload state
    archivoSeleccionado: File | null = null;
    subiendoArchivo = signal<boolean>(false);

    ngOnInit(): void {
        this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
        this.cargarDatos();
    }

    private convertirUrlYouTube(url: string): string {
        if (!url) return url;
        const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        return url;
    }

    cargarDatos() {
        this.dataService.getCursoById(this.cursoId).subscribe(data => this.curso.set(data));
        this.dataService.getLeccionesByCurso(this.cursoId).subscribe(data => {
            this.lecciones.set(data);
            if (!this.editando()) {
                this.nuevaLeccion.orden = data.length + 1;
            }
        });
    }

    abrirModalNuevaLeccion() {
        this.editando.set(false);
        this.leccionEnEdicionId.set(null);
        this.nuevaLeccion = { titulo: '', descripcion: '', video_url: '', orden: this.lecciones().length + 1 };
        this.sitiosReferencia = [];
        this.nuevoSitio = '';
        this.archivoSeleccionado = null;
        this.mostrarModal.set(true);
    }

    abrirEditarLeccion(leccion: any) {
        this.editando.set(true);
        this.leccionEnEdicionId.set(leccion.id);
        this.nuevaLeccion = {
            titulo: leccion.titulo || '',
            descripcion: leccion.descripcion || '',
            video_url: leccion.video_url || '',
            orden: leccion.orden || 1
        };
        this.sitiosReferencia = leccion.referencias_url ? leccion.referencias_url.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        this.nuevoSitio = '';
        this.archivoSeleccionado = null;
        this.mostrarModal.set(true);
    }

    agregarSitio() {
        const url = this.nuevoSitio.trim();
        if (url) {
            let formattedUrl = url;
            if (!/^https?:\/\//i.test(url)) {
                formattedUrl = 'https://' + url;
            }
            this.sitiosReferencia.push(formattedUrl);
            this.nuevoSitio = '';
        }
    }

    eliminarSitio(index: number) {
        this.sitiosReferencia.splice(index, 1);
    }

    guardarLeccion() {
        if (!this.nuevaLeccion.titulo) return;

        this.mensajeExito.set('');
        this.mensajeError.set('');

        if (this.editando()) {
            this.enviando.set(true);
            const payload = {
                id: this.leccionEnEdicionId(),
                titulo: this.nuevaLeccion.titulo,
                descripcion: this.nuevaLeccion.descripcion,
                video_url: this.convertirUrlYouTube(this.nuevaLeccion.video_url),
                orden: this.nuevaLeccion.orden,
                referencias_url: this.sitiosReferencia.join(', ')
            };
            this.dataService.editarLeccion(payload).subscribe({
                next: (res) => {
                    const leccionId = this.leccionEnEdicionId()!;
                    if (this.archivoSeleccionado) {
                        this.subirArchivo(leccionId);
                    } else {
                        this.mensajeExito.set('Lección actualizada exitosamente');
                        setTimeout(() => this.finalizarCreacion(), 1200);
                    }
                },
                error: (err) => {
                    this.enviando.set(false);
                    this.mensajeError.set(err.error?.mensaje || 'Error al guardar la lección. Intente de nuevo.');
                }
            });
        } else {
            this.crearLeccion();
        }
    }

    crearLeccion() {
        if (!this.nuevaLeccion.titulo) return;

        this.mensajeExito.set('');
        this.mensajeError.set('');

        this.enviando.set(true);
        const payload = {
            ...this.nuevaLeccion,
            video_url: this.convertirUrlYouTube(this.nuevaLeccion.video_url),
            id_curso: this.cursoId,
            referencias_url: this.sitiosReferencia.join(', ')
        };

        this.dataService.crearLeccion(payload).subscribe({
            next: (res) => {
                const newId = res.datos.id;

                if (this.archivoSeleccionado) {
                    this.subirArchivo(newId);
                } else {
                    this.mensajeExito.set('Lección creada exitosamente');
                    setTimeout(() => this.finalizarCreacion(), 1200);
                }
            },
            error: (err) => {
                this.enviando.set(false);
                this.mensajeError.set(err.error?.mensaje || 'Error al crear la lección. Intente de nuevo.');
            }
        });
    }

    eliminarLeccion(id: number) {
        if (confirm('¿Estás seguro de que deseas eliminar esta lección? Esta acción no se puede deshacer y borrará todo el progreso y material asociado.')) {
            this.dataService.eliminarLeccion(id).subscribe({
                next: () => this.cargarDatos()
            });
        }
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.archivoSeleccionado = file;
        }
    }

    subirArchivo(leccionId: number) {
        if (!this.archivoSeleccionado) return;
        
        this.subiendoArchivo.set(true);
        this.dataService.subirMaterial(leccionId, this.archivoSeleccionado).subscribe({
            next: () => {
                this.subiendoArchivo.set(false);
                this.finalizarCreacion();
            },
            error: () => {
                this.subiendoArchivo.set(false);
                this.finalizarCreacion(); // We finish anyway, maybe show error
            }
        });
    }

    finalizarCreacion() {
        this.cargarDatos();
        this.mostrarModal.set(false);
        this.enviando.set(false);
        this.editando.set(false);
        this.leccionEnEdicionId.set(null);
        this.nuevaLeccion = { titulo: '', descripcion: '', video_url: '', orden: this.lecciones().length + 1 };
        this.archivoSeleccionado = null;
        this.sitiosReferencia = [];
        this.nuevoSitio = '';
    }
}
