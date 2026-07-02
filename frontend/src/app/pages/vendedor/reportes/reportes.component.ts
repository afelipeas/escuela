import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-vendedor-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.css'
})
export class VendedorReportesComponent implements OnInit {
    private dataService = inject(DataService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    // Filtros de fecha
    filtroFechaInicio: string = '';
    filtroFechaFin: string = '';
    cargandoReporte = false;

    // Reporte cargado
    reporte: any = null;

    // Información del Vendedor logueado
    get vendedor() {
        const u = this.authService.currentUser();
        return {
            nombre: u?.nombre || 'Vendedor Comercial',
            avatar: '💰',
            cuotaMes: '$5,000,000'
        };
    }

    ngOnInit(): void {
        // Inicializar fechas por defecto (desde inicio del mes actual)
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.filtroFechaFin = this.formatDate(hoy);
        this.filtroFechaInicio = this.formatDate(inicioMes);

        // Cargar reporte automáticamente al inicio
        this.generarReporte();
    }

    private formatDate(d: Date): string {
        return d.toISOString().split('T')[0];
    }

    generarReporte(): void {
        if (!this.filtroFechaInicio || !this.filtroFechaFin) return;
        this.cargandoReporte = true;
        this.reporte = null;

        const u = this.authService.currentUser();
        const vendedorId = u?.id ? u.id.toString() : '';

        this.dataService.getReporteVentas(this.filtroFechaInicio, this.filtroFechaFin, vendedorId)
            .subscribe({
                next: (data) => {
                    this.reporte = data;
                    this.cargandoReporte = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.cargandoReporte = false;
                    this.cdr.detectChanges();
                }
            });
    }

    // Porcentaje de la meta mensual (Marta o cualquier vendedor tiene meta de $5,000,000)
    get porcentajeMeta(): number {
        if (!this.reporte?.resumen?.totalVentas) return 0;
        const total = parseFloat(this.reporte.resumen.totalVentas.replace('$', '').replace(/,/g, '')) || 0;
        const pct = (total / 5000000) * 100;
        return Math.round(pct);
    }

    get faltanteMeta(): string {
        if (!this.reporte?.resumen?.totalVentas) return '$5,000,000';
        const total = parseFloat(this.reporte.resumen.totalVentas.replace('$', '').replace(/,/g, '')) || 0;
        const faltante = Math.max(5000000 - total, 0);
        return '$' + faltante.toLocaleString();
    }

    get strokeDashOffsetGauge(): number {
        // La escala del stroke es 100, así que el offset para x% es 100 - x
        return Math.max(100 - this.porcentajeMeta, 0);
    }

    // KPI's de Reporte dinámicos
    get metricasReporte() {
        const totalV = this.reporte?.resumen?.totalVentas || '$0';
        const totalT = this.reporte?.resumen?.totalTransacciones || 0;
        const ticketP = this.reporte?.resumen?.ticketPromedio || '$0';
        const comisionT = this.reporte?.resumen?.comisionesTotales || '$0';
        const pct = this.porcentajeMeta;

        return [
            { titulo: 'Mis Ventas Totales', valor: totalV, sub: `${pct}% de la meta`, icono: '📈', color: 'exito' },
            { titulo: 'Comisiones Acumuladas', valor: comisionT, sub: 'Por pagar: 5%', icono: '💎', color: 'info' },
            { titulo: 'Venta Promedio', valor: ticketP, sub: 'Ticket Promedio', icono: '🎫', color: 'alerta' },
            { titulo: 'Clientes Atendidos', valor: totalT.toString(), sub: 'Transacciones', icono: '👤', color: 'prima' }
        ];
    }

    // Historial agrupado por fecha para la tabla principal
    get historialVentas() {
        if (!this.reporte?.detalle) return [];
        const agrupado: Record<string, { fecha: string, transacciones: number, total: number, comision: number }> = {};

        this.reporte.detalle.forEach((d: any) => {
            const f = d.fecha;
            const totalVal = parseFloat(d.monto.replace('$', '').replace(/,/g, '')) || 0;
            
            // Si la comisión ya viene calculada o usamos el 5% estandar
            const comisionVal = totalVal * 0.05;

            if (!agrupado[f]) {
                agrupado[f] = { fecha: f, transacciones: 0, total: 0, comision: 0 };
            }
            agrupado[f].transacciones += 1;
            agrupado[f].total += totalVal;
            agrupado[f].comision += comisionVal;
        });

        return Object.keys(agrupado).map(key => {
            const item = agrupado[key];
            return {
                fecha: this.formatReadableDate(item.fecha),
                transacciones: item.transacciones,
                total: '$' + item.total.toLocaleString(),
                comision: '$' + item.comision.toLocaleString(),
                rawDate: key
            };
        }).sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    }

    // Alturas dinámicas para las barras del gráfico simulado
    get barrasGrafico() {
        const hist = this.historialVentas.slice(0, 5).reverse();
        if (hist.length === 0) return [];
        
        const maxTotal = Math.max(...hist.map(h => parseFloat(h.total.replace('$', '').replace(/,/g, '')) || 1));
        
        return hist.map(h => {
            const totalVal = parseFloat(h.total.replace('$', '').replace(/,/g, '')) || 0;
            const pctHeight = maxTotal > 0 ? (totalVal / maxTotal) * 90 + 10 : 30; // Min 10% para que se vea barra
            return {
                altura: pctHeight + '%',
                total: h.total,
                fecha: h.fecha.split(' ')[0] + ' ' + h.fecha.split(' ')[1] // Solo Día + Mes
            };
        });
    }

    private formatReadableDate(dateStr: string): string {
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const meses = ['Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene']; // Ajustado índice
                const dia = parseInt(parts[2], 10);
                const mesNum = parseInt(parts[1], 10);
                const mesesCorrecto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const mes = mesesCorrecto[mesNum - 1] || 'Feb';
                const anio = parts[0];
                return `${dia} ${mes} ${anio}`;
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    }

    exportarReporte(tipo: string): void {
        alert(`Generando reporte de mis ventas en formato ${tipo}...`);
        if (tipo === 'PDF') {
            window.print();
        } else {
            // CSV
            if (!this.reporte?.detalle) return;
            const cabecera = ['Fecha', 'Cliente', 'Producto', 'Monto', 'Estado'].join(',');
            const filas = this.reporte.detalle.map((r: any) =>
                [r.fecha, r.cliente, r.producto, r.monto, r.estado].join(',')
            );
            const csv = [cabecera, ...filas].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mis-ventas-${this.filtroFechaInicio}-${this.filtroFechaFin}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}
