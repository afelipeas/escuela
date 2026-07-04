import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-almacen-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './almacen-dashboard.component.html',
    styleUrl: './almacen-dashboard.component.css'
})
export class AlmacenDashboardComponent implements OnInit {
    private dataService = inject(DataService);

    // Datos asíncronos
    kpis: any[] = [];
    stockCritico: any[] = [];
    movimientosRecientes: any[] = [];
    inventarioCompleto = signal<any[]>([]);
    cargandoInventario = signal(true);

    // Control de filtro de búsqueda
    busqueda = signal('');

    ngOnInit(): void {
        this.dataService.getResumenAlmacen().subscribe(data => this.kpis = data);
        this.dataService.getStockCritico().subscribe(data => this.stockCritico = data);
        this.dataService.getMovimientosRecientes().subscribe(data => this.movimientosRecientes = data);
        this.dataService.getInventarioCompleto().subscribe({
            next: (data) => {
                this.inventarioCompleto.set(data);
                this.cargandoInventario.set(false);
            },
            error: () => this.cargandoInventario.set(false)
        });
    }

    get inventarioFiltrado(): any[] {
        const q = this.busqueda().toLowerCase().trim();
        if (!q) return this.inventarioCompleto();
        return this.inventarioCompleto().filter(p =>
            p.nombre?.toLowerCase().includes(q) ||
            p.categoria?.toLowerCase().includes(q) ||
            p.referencia?.toLowerCase().includes(q)
        );
    }

    getEstadoClase(estado: string): string {
        if (estado === 'agotado') return 'danger';
        if (estado === 'critico') return 'warning';
        return 'success';
    }

    getEstadoTexto(estado: string): string {
        if (estado === 'agotado') return 'Agotado';
        if (estado === 'critico') return 'Stock Bajo';
        return 'Saludable';
    }
}
