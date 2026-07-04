import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
    selector: 'app-explorar-cursos',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './explorar-cursos.component.html',
    styleUrl: './explorar-cursos.component.css'
})
export class ExplorarCursosComponent implements OnInit {
    private dataService = inject(DataService);
    private destroyRef  = inject(DestroyRef);

    /** true mientras los dos endpoints no hayan respondido */
    cargando = signal(true);

    /**
     * Lista mutable de cursos. Cada objeto tiene la propiedad `yaInscrito`
     * que se actualiza DIRECTAMENTE tras una inscripción exitosa, sin
     * depender de computeds encadenados ni de re-fetches.
     */
    private _cursos = signal<any[]>([]);
    cursos = this._cursos.asReadonly();

    /** ID del curso cuya petición HTTP está en vuelo (evita doble clic) */
    inscribiendoId = signal<number | null>(null);

    ngOnInit(): void {
        forkJoin({
            todos: this.dataService.getCursosDisponibles().pipe(catchError(() => of([]))),
            // Usamos el endpoint dedicado que devuelve los IDs de inscripción SIN
            // filtrar por cantidad de lecciones, a diferencia de getClasesEstudiante()
            // que excluye cursos vacíos (sin lecciones) del resultado.
            idsInscritos: this.dataService.getMisInscripcionesIds().pipe(catchError(() => of([] as number[])))
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(({ todos, idsInscritos }) => {
            const setInscritos = new Set(idsInscritos);
            this._cursos.set(
                todos.map((c: any) => ({
                    ...c,
                    yaInscrito: setInscritos.has(Number(c.id))
                }))
            );
            this.cargando.set(false);
        });
    }

    inscribir(curso: any): void {
        if (curso.yaInscrito || this.inscribiendoId() !== null) return;

        this.inscribiendoId.set(Number(curso.id));

        this.dataService.inscribirEnCurso(curso.id).subscribe({
            next: (res) => {
                /**
                 * Actualizamos DIRECTAMENTE el objeto del curso en la lista.
                 * Usando .update() con .map() creamos un nuevo array (inmutable),
                 * por lo que Angular detecta el cambio y re-renderiza sin ambigüedad.
                 */
                this._cursos.update(lista =>
                    lista.map(c =>
                        Number(c.id) === Number(curso.id)
                            ? { ...c, yaInscrito: true }
                            : c
                    )
                );
                this.inscribiendoId.set(null);
                alert(res.mensaje || '¡Inscripción exitosa! 📖');
            },
            error: (err) => {
                this.inscribiendoId.set(null);
                alert(err.error?.mensaje || 'Error al procesar la inscripción.');
            }
        });
    }
}

