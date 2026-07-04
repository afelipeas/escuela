import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-docente-calendario',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendario.component.html',
    styleUrl: './calendario.component.css'
})
export class CalendarioDocenteComponent implements OnInit {
    private dataService = inject(DataService);

    mesActual = signal<string>('');
    diasMes: number[] = [];
    celdasVacias: any[] = [];
    
    viewYear = signal(new Date().getFullYear());
    viewMonth = signal(new Date().getMonth());

    // Fetch upcoming classes from backend
    clasesRaw = toSignal(
        this.dataService.getProximasClases().pipe(catchError(() => of([]))),
        { initialValue: [] as any[] }
    );

    // Process classes into events
    eventos = computed(() => {
        const data = this.clasesRaw() || [];
        const y = this.viewYear();
        const m = this.viewMonth() + 1;

        return data.filter((c: any) => {
            if (!c.fecha) return false;
            const parts = c.fecha.split('-');
            if (parts.length !== 3) return false;
            return parseInt(parts[0], 10) === y && parseInt(parts[1], 10) === m;
        }).map((c: any) => {
            return {
                dia: parseInt(c.fecha.split('-')[2], 10),
                titulo: c.titulo,
                hora: c.hora,
                color: c.estado === 'en_curso' ? 'bg-rojo' : 'bg-naranja'
            };
        });
    });

    ngOnInit(): void {
        this.actualizarCalendario();
    }

    cambiarMes(offset: number) {
        let newMonth = this.viewMonth() + offset;
        let newYear = this.viewYear();
        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }
        this.viewMonth.set(newMonth);
        this.viewYear.set(newYear);
        this.actualizarCalendario();
    }

    actualizarCalendario() {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const year = this.viewYear();
        const month = this.viewMonth();

        this.mesActual.set(`${meses[month]} ${year}`);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        this.diasMes = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const firstDayOfWeek = new Date(year, month, 1).getDay();
        this.celdasVacias = Array.from({ length: firstDayOfWeek });
    }

    getEvento(dia: number) {
        return this.eventos().filter(e => e.dia === dia);
    }
}
