import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, map } from 'rxjs';

@Component({
    selector: 'app-estudiante-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './estudiante-dashboard.component.html',
    styleUrl: './estudiante-dashboard.component.css'
})
export class EstudianteDashboardComponent {
    private dataService = inject(DataService);
    private authService = inject(AuthService);

    usuario = this.authService.currentUser;

    // toSignal() bridges observables into Angular's signal graph.
    // When the HTTP response arrives the template automatically re-renders —
    // no zone.js, no subscribe, no ChangeDetectorRef.
    private clasesRaw = toSignal(
        this.dataService.getClasesEstudiante().pipe(catchError(() => of([]))),
        { initialValue: null }  // null means "still loading"
    );

    resumen = toSignal(
        this.dataService.getResumenEstudiante().pipe(catchError(() => of([]))),
        { initialValue: [] as any[] }
    );

    logros = toSignal(
        this.dataService.getLogrosEstudiante().pipe(catchError(() => of([]))),
        { initialValue: [] as any[] }
    );

    // Derived signals
    cargando = computed(() => this.clasesRaw() === null);

    clasesActuales = computed(() => {
        const data = this.clasesRaw();
        if (!data) return [];
        return data.map((m: any) => ({
            ...m,
            progreso: Number(m.progreso_pct) || 0,
            color: 'card-' + (m.color_tema || 'naranja'),
            leccionActual: m.leccion_actual || 'Continuar lección',
            primera_leccion_id: m.primera_leccion_id,
            total_lecciones: Number(m.total_lecciones) || 0
        }));
    });

    // Anuncios del docente: vacío hasta que exista un endpoint en el backend.
    anunciosDocente: any[] = [];
}
