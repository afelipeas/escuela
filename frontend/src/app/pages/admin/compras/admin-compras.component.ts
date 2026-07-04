import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-admin-compras',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-compras.component.html',
    styleUrl: '../../almacen/compras/compras.component.css'
})
export class AdminComprasComponent implements OnInit {

    private dataService = inject(DataService);

    fechaInicio: string = '';
    fechaFin: string = '';
    cargando = signal(false);

    metricasCompras = signal<any[]>([]);
    ordenesCompra = signal<any[]>([]);
    distribucionGasto = signal<{ nombre: string, monto: string, porcentaje: number, color: string }[]>([]);

    private coloresCat: string[] = ['bg-naranja', 'bg-azul', 'bg-verde', 'bg-rojo', 'bg-purpura'];

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

        this.dataService.getReporteCompras(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                if (!data) {
                    this.ordenesCompra.set([]);
                    this.metricasCompras.set([]);
                    this.distribucionGasto.set([]);
                    this.cargando.set(false);
                    return;
                }
                this.ordenesCompra.set(data.ordenes || []);
                this.calcularKPIs(data.resumen);
                this.calcularDistribucion(data.categorias);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
            }
        });
    }

    private calcularKPIs(resumen: any): void {
        if (!resumen) {
            this.metricasCompras.set([]);
            return;
        }
        const gasto = Number(resumen.gasto_total || 0);
        this.metricasCompras.set([
            { titulo: 'Gasto Total', valor: '$' + gasto.toLocaleString(), sub: resumen.pendientes + ' pendientes', icono: '💸', color: 'naranja' },
            { titulo: 'Órdenes Activas', valor: String(Number(resumen.pendientes) + Number(resumen.en_transito)), sub: resumen.en_transito + ' en camino', icono: '📝', color: 'azul' },
            { titulo: 'Proveedores', valor: String(resumen.proveedores_activos || 0), sub: 'en el período', icono: '🤝', color: 'verde' },
            { titulo: 'Recibidas', valor: String(resumen.recibidos || 0), sub: 'de ' + resumen.total_ordenes + ' totales', icono: '✅', color: 'rojo' }
        ]);
    }

    private calcularDistribucion(categorias: any[]): void {
        if (!categorias || categorias.length === 0) {
            this.distribucionGasto.set([]);
            return;
        }
        const total = categorias.reduce((sum: number, c: any) => sum + Number(c.gasto_categoria), 0);
        if (total === 0) {
            this.distribucionGasto.set([]);
            return;
        }
        this.distribucionGasto.set(
            categorias.map((cat, idx) => ({
                nombre: cat.categoria || 'Sin categoría',
                monto: '$' + Number(cat.gasto_categoria).toLocaleString(),
                porcentaje: Math.round((Number(cat.gasto_categoria) / total) * 100),
                color: this.coloresCat[idx % this.coloresCat.length]
            }))
        );
    }

    exportarCSV(): void {
        const ordenes = this.ordenesCompra();
        if (!ordenes.length) return;
        const cabecera = ['N° Orden', 'Proveedor', 'Responsable', 'Fecha', 'Monto Total', 'Estado'].join(',');
        const filas = ordenes.map(o =>
            [o.codigo, o.proveedor_nombre, o.responsable_nombre, this.formatearFecha(o.fecha_orden), o.total, this.getEstadoTexto(o.estado)].join(',')
        );
        const csv = [cabecera, ...filas].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-compras-${this.fechaInicio}-${this.fechaFin}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    imprimirReporte(): void {
        window.print();
    }

    getEstadoClase(estado: string): string {
        switch (estado) {
            case 'recibido': return 'success';
            case 'en_transito': return 'info';
            case 'pendiente': return 'warning';
            case 'cancelado': return 'danger';
            default: return 'secondary';
        }
    }

    getEstadoTexto(estado: string): string {
        switch (estado) {
            case 'recibido': return 'Recibido';
            case 'en_transito': return 'En Tránsito';
            case 'pendiente': return 'Pendiente';
            case 'cancelado': return 'Cancelado';
            default: return estado;
        }
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}