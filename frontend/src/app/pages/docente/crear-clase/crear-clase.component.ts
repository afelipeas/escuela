import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-crear-clase',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './crear-clase.component.html',
    styleUrl: './crear-clase.component.css'
})
export class CrearClaseComponent implements OnInit {
    private dataService = inject(DataService);
    private router = inject(Router);

    cursos = signal<any[]>([]);

    clase = {
        titulo: '',
        id_curso: 0,
        grupo: '',
        fecha: '',
        hora: '10:00', // Default hour
        descripcion: '',
        video_url: '',
        referencias_url: ''
    };

    enviando = false;

    // Multiple reference website URLs
    sitiosReferencia: string[] = [];
    nuevoSitio = '';

    // Support materials upload state
    archivoSeleccionado: File | null = null;
    subiendoArchivo = false;

    // Inline course creation modal state
    mostrarModalCurso = signal<boolean>(false);
    nuevoCurso = {
        titulo: '',
        descripcion: '',
        icono: '📚',
        color_tema: 'primary',
        estado: 'activo', // immediately usable!
        video_url: ''
    };
    creandoCurso = signal<boolean>(false);
    archivoSeleccionadoCurso: File | null = null;
    subiendoArchivoCurso = false;

    ngOnInit(): void {
        this.dataService.getMisCursosDocente().subscribe(data => {
            this.cursos.set(data);
            if (data.length > 0) {
                this.clase.id_curso = data[0].id;
            }
        });
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.archivoSeleccionado = file;
        }
    }

    onFileSelectedCurso(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.archivoSeleccionadoCurso = file;
        }
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

    crearCurso() {
        if (!this.nuevoCurso.titulo) {
            alert('Por favor, ingresa el título del curso.');
            return;
        }

        this.creandoCurso.set(true);
        this.dataService.crearCurso(this.nuevoCurso).subscribe({
            next: (res: any) => {
                const cursoId = res.datos?.id;
                if (this.archivoSeleccionadoCurso && cursoId) {
                    this.subiendoArchivoCurso = true;
                    this.dataService.subirMaterialCurso(cursoId, this.archivoSeleccionadoCurso).subscribe({
                        next: () => {
                            this.subiendoArchivoCurso = false;
                            this.finalizarCreacionCursoInline();
                        },
                        error: () => {
                            this.subiendoArchivoCurso = false;
                            this.finalizarCreacionCursoInline(); // Finish anyway
                        }
                    });
                } else {
                    this.finalizarCreacionCursoInline();
                }
            },
            error: (err) => {
                alert('Error al crear el curso');
                this.creandoCurso.set(false);
            }
        });
    }

    finalizarCreacionCursoInline() {
        this.dataService.getMisCursosDocente().subscribe(data => {
            this.cursos.set(data);
            // Try to auto-select the newly created course
            const recienCreado = data.find((c: any) => c.titulo === this.nuevoCurso.titulo);
            if (recienCreado) {
                this.clase.id_curso = recienCreado.id;
            }
            this.creandoCurso.set(false);
            this.mostrarModalCurso.set(false);
            this.nuevoCurso = { titulo: '', descripcion: '', icono: '📚', color_tema: 'primary', estado: 'activo', video_url: '' };
            this.archivoSeleccionadoCurso = null;
            alert('¡Curso creado exitosamente y seleccionado!');
        });
    }

    guardarClase() {
        if (!this.clase.titulo || !this.clase.id_curso || !this.clase.fecha || !this.clase.hora) {
            alert('Por favor, completa los campos obligatorios: Título, Curso, Fecha y Hora.');
            return;
        }

        this.clase.referencias_url = this.sitiosReferencia.join(', ');
        this.enviando = true;
        this.dataService.crearClase(this.clase).subscribe({
            next: (res: any) => {
                const classId = res.datos?.id;
                if (this.archivoSeleccionado && classId) {
                    this.subiendoArchivo = true;
                    this.dataService.subirMaterialClase(classId, this.archivoSeleccionado).subscribe({
                        next: () => {
                            this.subiendoArchivo = false;
                            alert('¡Clase programada y material de apoyo subido con éxito!');
                            this.router.navigate(['/docente/dashboard']);
                        },
                        error: (err) => {
                            this.subiendoArchivo = false;
                            alert('La clase se programó con éxito, pero hubo un error al cargar el archivo de apoyo.');
                            this.router.navigate(['/docente/dashboard']);
                        }
                    });
                } else {
                    alert(res.mensaje || '¡Clase programada con éxito!');
                    this.router.navigate(['/docente/dashboard']);
                }
            },
            error: (err: any) => {
                alert('Error al programar la clase: ' + (err.error?.mensaje || 'Error desconocido'));
                this.enviando = false;
            }
        });
    }
}
