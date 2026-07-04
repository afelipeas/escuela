import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-almacen-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.css'
})
export class AlmacenReportesComponent implements OnInit {

    private dataService = inject(DataService);

    fechaInicio: string = '';
    fechaFin: string = '';
    cargando = signal(false);

    metricasAlmacen = signal<any[]>([]);
    inventarioItems = signal<any[]>([]);
    distribucionCategorias = signal<{ nombre: string, porcentaje: number, color: string }[]>([]);

    private coloresCat: string[] = ['', 'bg-info', 'bg-success', 'bg-warning', 'bg-danger', 'bg-purpura'];

    ngOnInit(): void {
        const hoy = new Date();
        this.fechaFin = hoy.toISOString().split('T')[0];
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaInicio = primerDia.toISOString().split('T')[0];
        this.cargarReporte();
    }

    cargarReporte(): void {
        if (!this.fechaInicio || !this.fechaFin) return;
        this.cargando.set(true);

        this.dataService.getReporteInventario(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                this.inventarioItems.set(data);
                this.calcularKPIs();
                this.calcularDistribucion();
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
            }
        });
    }

    private calcularKPIs(): void {
        const items = this.inventarioItems();
        const saldoInicialTotal = items.reduce((sum, i) => sum + Number(i.saldo_inicial), 0);
        const entradasTotal = items.reduce((sum, i) => sum + Number(i.entradas), 0);
        const salidasTotal = items.reduce((sum, i) => sum + Number(i.salidas), 0);
        const saldoFinalTotal = items.reduce((sum, i) => sum + Number(i.saldo_final), 0);
        const criticos = items.filter(i => Number(i.saldo_final) < 5).length;

        this.metricasAlmacen.set([
            { titulo: 'Saldo Inicial', valor: saldoInicialTotal.toLocaleString(), sub: 'unidades al inicio', icono: '📊', color: 'info' },
            { titulo: 'Entradas', valor: entradasTotal.toLocaleString(), sub: 'compras + devoluciones', icono: '📥', color: 'verde' },
            { titulo: 'Salidas', valor: salidasTotal.toLocaleString(), sub: 'ventas + ajustes(-)', icono: '📤', color: 'rojo' },
            { titulo: 'Saldo Final', valor: saldoFinalTotal.toLocaleString(), sub: criticos > 0 ? criticos + ' críticos' : 'sin novedad', icono: '📦', color: 'purpura' }
        ]);
    }

    private calcularDistribucion(): void {
        const items = this.inventarioItems();
        const total = items.reduce((sum, i) => sum + Number(i.saldo_final), 0);
        if (total === 0) {
            this.distribucionCategorias.set([]);
            return;
        }
        const agrupado: Record<string, number> = {};
        for (const item of items) {
            const cat = item.categoria || 'Sin categoría';
            agrupado[cat] = (agrupado[cat] || 0) + Number(item.saldo_final);
        }
        this.distribucionCategorias.set(
            Object.entries(agrupado)
                .sort(([, a], [, b]) => b - a)
                .map(([nombre, valor], idx) => ({
                    nombre,
                    porcentaje: Math.round((valor / total) * 100),
                    color: this.coloresCat[idx % this.coloresCat.length]
                }))
        );
    }

    getEstadoClase(stock: number): string {
        if (stock <= 0) return 'danger';
        if (stock < 5) return 'warning';
        return 'success';
    }

    getEstadoTexto(stock: number): string {
        if (stock <= 0) return 'Agotado';
        if (stock < 5) return 'Stock Bajo';
        return 'Saludable';
    }

    exportarCSV(): void {
        const items = this.inventarioItems();
        if (!items.length) return;
        const cabecera = ['Referencia', 'Producto', 'Categoría', 'Saldo Inicial', 'Entradas', 'Salidas', 'Saldo Final', 'Estado'].join(',');
        const filas = items.map(i =>
            [i.referencia, i.producto, i.categoria, i.saldo_inicial, i.entradas, i.salidas, i.saldo_final, this.getEstadoTexto(i.saldo_final)].join(',')
        );
        const csv = [cabecera, ...filas].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-inventario-${this.fechaInicio}-${this.fechaFin}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    imprimirReporte(): void {
        window.print();
    }
}
