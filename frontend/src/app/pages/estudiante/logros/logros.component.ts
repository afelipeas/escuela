import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-logros',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './logros.component.html',
    styleUrl: './logros.component.css'
})
export class LogrosComponent implements OnInit {
    private dataService = inject(DataService);
    public authService = inject(AuthService);

    // Signals para reactividad perfecta
    logros = signal<any[]>([]);
    stats = signal<any>({ puntos: 0, logros: 0 });
    cargando = signal<boolean>(true);

    // Lógica de rango calculada en el cliente para inmediatez
    rango = signal<string>('Aprendiz');
    progresoRango = signal<number>(0);

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.cargando.set(true);
        
        // Ejecutamos ambas peticiones en paralelo
        forkJoin({
            listaLogros: this.dataService.getLogrosEstudiante(),
            resumenStats: this.dataService.getResumenEstudiante()
        }).subscribe({
            next: (res: any) => {
                this.logros.set(res.listaLogros || []);
                
                // Extraer puntos del resumen
                const kpiPuntos = res.resumenStats?.find((d: any) => d.titulo === 'Mis Puntos Fe');
                const valorPuntos = kpiPuntos ? parseInt(kpiPuntos.valor.toString().replace(/,/g, '')) : 0;
                
                this.stats.set({
                    puntos: valorPuntos,
                    logros: res.listaLogros?.length || 0
                });

                this.calcularRango(valorPuntos);
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false)
        });
    }

    calcularRango(puntos: number): void {
        if (puntos >= 2000) {
            this.rango.set('Guerrero de la Fe');
            this.progresoRango.set(100);
        } else if (puntos >= 1000) {
            this.rango.set('Discípulo Avanzado');
            this.progresoRango.set(((puntos - 1000) / 1000) * 100);
        } else if (puntos >= 500) {
            this.rango.set('Explorador Bíblico');
            this.progresoRango.set(((puntos - 500) / 500) * 100);
        } else {
            this.rango.set('Pequeño Sembrador');
            this.progresoRango.set((puntos / 500) * 100);
        }
    }
}
