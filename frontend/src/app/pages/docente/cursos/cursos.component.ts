import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-docente-cursos',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './cursos.component.html',
    styleUrl: './cursos.component.css'
})
export class DocenteCursosComponent implements OnInit {
    private dataService = inject(DataService);
    
    cursos = signal<any[]>([]);
    cargando = signal<boolean>(true);
    
    // Modal state
    mostrarModal = signal<boolean>(false);
    nuevoCurso = {
        titulo: '',
        descripcion: '',
        icono: '📚',
        color_tema: 'primary',
        estado: 'borrador',
        video_url: ''
    };
    enviando = signal<boolean>(false);

    // Support materials state
    archivoSeleccionado: File | null = null;
    subiendoArchivo = signal<boolean>(false);

    ngOnInit(): void {
        this.cargarCursos();
    }

    cargarCursos() {
        this.cargando.set(true);
        this.dataService.getMisCursosDocente().subscribe({
            next: (data) => {
                this.cursos.set(data);
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false)
        });
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.archivoSeleccionado = file;
        }
    }

    crearCurso() {
        if (!this.nuevoCurso.titulo) return;
        
        this.enviando.set(true);
        this.dataService.crearCurso(this.nuevoCurso).subscribe({
            next: (res: any) => {
                const cursoId = res.datos?.id;
                if (this.archivoSeleccionado && cursoId) {
                    this.subiendoArchivo.set(true);
                    this.dataService.subirMaterialCurso(cursoId, this.archivoSeleccionado).subscribe({
                        next: () => {
                            this.finalizarCreacion();
                        },
                        error: () => {
                            this.finalizarCreacion(); // Finish anyway
                        }
                    });
                } else {
                    this.finalizarCreacion();
                }
            },
            error: () => this.enviando.set(false)
        });
    }

    finalizarCreacion() {
        this.cargarCursos();
        this.mostrarModal.set(false);
        this.enviando.set(false);
        this.subiendoArchivo.set(false);
        this.nuevoCurso = { titulo: '', descripcion: '', icono: '📚', color_tema: 'primary', estado: 'borrador', video_url: '' };
        this.archivoSeleccionado = null;
        alert('¡Curso creado exitosamente!');
    }

    getColorCss(colorTema: string | null): string {
        const mapa: Record<string, string> = {
            'primary': '#0d6efd',
            'azul': '#0d6efd',
            'verde': '#198754',
            'rojo': '#dc3545',
            'naranja': '#fd7e14',
            'purpura': '#6f42c1',
        };
        if (!colorTema) return '#dee2e6';
        return mapa[colorTema.toLowerCase()] || colorTema;
    }
}
