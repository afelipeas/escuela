import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-alumnos',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './alumnos.component.html',
    styleUrl: './alumnos.component.css'
})
export class AlumnosComponent {
    private dataService = inject(DataService);

    alumnosRaw = toSignal(
        this.dataService.getAlumnosByDocente().pipe(catchError(() => of([]))),
        { initialValue: [] as any[] }
    );

    searchTerm = signal('');

    // Filtrar la lista de alumnos según la búsqueda
    alumnosFiltrados = computed(() => {
        const term = this.searchTerm().toLowerCase();
        return this.alumnosRaw().filter((a: any) => 
            a.nombre.toLowerCase().includes(term) || 
            a.apellido.toLowerCase().includes(term) ||
            a.email.toLowerCase().includes(term)
        );
    });

    onSearch(event: any) {
        this.searchTerm.set(event.target.value);
    }
}
