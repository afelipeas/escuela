import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-calificaciones',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calificaciones.component.html',
    styleUrl: './calificaciones.component.css'
})
export class CalificacionesComponent {
    private dataService = inject(DataService);

    clasesRaw = toSignal(
        this.dataService.getClasesEstudiante().pipe(catchError(() => of([]))),
        { initialValue: [] as any[] }
    );

    // Filtrar solo las que tienen algún progreso para el reporte
    reporteAcademico = computed(() => {
        const data = this.clasesRaw();
        return data.map((c: any) => {
            const progreso = Number(c.progreso_pct) || 0;
            return {
                ...c,
                progreso: progreso,
                estado: progreso >= 100 ? 'Completado' : 'En Curso',
                nota: progreso >= 100 ? 'Sobresaliente' : 'Pendiente'
            };
        });
    });

    promedioGeneral = computed(() => {
        const data = this.reporteAcademico();
        if (data.length === 0) return 0;
        const total = data.reduce((acc, curr) => acc + curr.progreso, 0);
        return Math.round(total / data.length);
    });
}
