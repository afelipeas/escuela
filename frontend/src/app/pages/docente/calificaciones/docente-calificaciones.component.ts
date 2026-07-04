import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-docente-calificaciones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './docente-calificaciones.component.html',
    styleUrl: './docente-calificaciones.component.css'
})
export class DocenteCalificacionesComponent implements OnInit {
    private dataService = inject(DataService);

    alumnosCalificaciones = signal<any[]>([]);
    cargando = signal<boolean>(true);
    filtroCurso = signal<string>('todos');
    busqueda = signal<string>('');

    // List of unique course titles for the filter dropdown
    cursosUnicos = computed(() => {
        const list = this.alumnosCalificaciones();
        const titles = list.map((a: any) => a.curso_titulo);
        return ['todos', ...Array.from(new Set(titles))];
    });

    // Enrolled students list filtered by course and name/email
    calificacionesFiltradas = computed(() => {
        const list = this.alumnosCalificaciones();
        const fCurso = this.filtroCurso();
        const search = this.busqueda().toLowerCase().trim();

        return list.filter((a: any) => {
            const matchesCourse = fCurso === 'todos' || a.curso_titulo === fCurso;
            const matchesSearch = !search || 
                a.estudiante_nombre.toLowerCase().includes(search) || 
                a.estudiante_email.toLowerCase().includes(search);
            return matchesCourse && matchesSearch;
        });
    });

    // Summary statistics
    totalAlumnosUnicos = computed(() => {
        const list = this.alumnosCalificaciones();
        const ids = list.map((a: any) => a.id_estudiante);
        return new Set(ids).size;
    });

    promedioProgreso = computed(() => {
        const list = this.calificacionesFiltradas();
        if (list.length === 0) return 0;
        const sum = list.reduce((acc, curr) => acc + (Number(curr.progreso_pct) || 0), 0);
        return Math.round(sum / list.length);
    });

    puntosTotalesEntregados = computed(() => {
        const list = this.calificacionesFiltradas();
        return list.reduce((acc, curr) => acc + (Number(curr.puntos_ganados) || 0), 0);
    });

    ngOnInit(): void {
        this.cargarCalificaciones();
    }

    cargarCalificaciones() {
        this.cargando.set(true);
        this.dataService.getCalificacionesDocente().subscribe({
            next: (data) => {
                this.alumnosCalificaciones.set(data);
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false)
        });
    }

    obtenerNota(progreso: number): { texto: string, clase: string } {
        if (progreso >= 90) return { texto: 'Sobresaliente', clase: 'badge-sobresaliente' };
        if (progreso >= 70) return { texto: 'Notable', clase: 'badge-notable' };
        if (progreso >= 50) return { texto: 'Aprobado', clase: 'badge-aprobado' };
        return { texto: 'En Progreso', clase: 'badge-progreso' };
    }
}
