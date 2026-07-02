import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-ventas-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './ventas-dashboard.component.html',
    styleUrl: './ventas-dashboard.component.css'
})
export class VentasDashboardComponent implements OnInit {

    private cdr = inject(ChangeDetectorRef);

    // Usuario (Coordinador de Ventas / Admin)
    usuario = {
        nombre: 'Elena Rodríguez',
        rol: 'Directora Comercial',
        foto: '📊'
    };

    // KPI's Globales de Ventas
    metricasGlobales: any[] = [];

    // Listado Maestro de Pedidos
    pedidos: any[] = [];
    pedidosFiltrados: any[] = [];

    // Paginación
    paginaActual = 1;
    itemsPorPagina = 10;

    // Filtros de pedidos
    filtroPedidosInicio = '';
    filtroPedidosFin = '';
    filtroPedidosEstado = '';

    // Productos más vendidos
    topProductos: any[] = [];

    // Análisis del día
    analisisHoy = { texto: 'Cargando datos...', cargando: true };

    // Detalle de pedido seleccionado (modal)
    pedidoDetalle: any = null;
    itemsDetalle: any[] = [];
    cargandoDetalle = false;

    // Edición de pedido
    editando = false;
    editForm: any = {};
    guardandoEdicion = false;
    msgExito = '';
    msgError = '';
    toastMsg = '';

    // ─── REPORTE DE VENTAS ───
    mostrarReporte = false;
    cargandoReporte = false;
    vendedores: any[] = [];

    // Filtros
    filtroFechaInicio: string = '';
    filtroFechaFin: string = '';
    filtroVendedorId: string = '';

    // Resultado del reporte
    reporte: any = null;

    // Pestaña activa del reporte
    tabReporte: 'resumen' | 'detalle' = 'resumen';

    constructor(private router: Router, private dataService: DataService) { }

    ngOnInit(): void {
        // Establecer fechas por defecto (último mes)
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.filtroFechaFin = this.formatDate(hoy);
        this.filtroFechaInicio = this.formatDate(inicioMes);

        this.dataService.getVendedores().subscribe(v => this.vendedores = v);
        this.cargarPedidos();
        this.cargarKPIs();
        this.cargarTopProductos();
        this.cargarAnalisis();
    }

    cargarPedidos(): void {
        this.dataService.getPedidos().subscribe({
            next: (data) => {
                this.pedidos = data.map((p: any) => ({
                    id: p.id,
                    codigo: p.codigo,
                    cliente: p.cliente,
                    fecha: p.fecha_pedido,
                    total: '$' + Number(p.total).toLocaleString('es-CO'),
                    totalNum: Number(p.total),
                    metodo: p.metodo_pago,
                    estado: this.capitalizar(p.estado)
                }));
                this.aplicarFiltrosPedidos();
                this.cdr.detectChanges();
            }
        });
    }

    aplicarFiltrosPedidos(): void {
        let resultado = [...this.pedidos];

        if (this.filtroPedidosInicio) {
            resultado = resultado.filter(p => p.fecha >= this.filtroPedidosInicio);
        }
        if (this.filtroPedidosFin) {
            resultado = resultado.filter(p => p.fecha <= this.filtroPedidosFin + ' 23:59:59');
        }
        if (this.filtroPedidosEstado) {
            resultado = resultado.filter(p => p.estado === this.filtroPedidosEstado);
        }

        this.pedidosFiltrados = resultado;
        this.paginaActual = 1;
        this.cdr.detectChanges();
    }

    get pedidosPaginados(): any[] {
        const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
        return this.pedidosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
    }

    get totalPaginas(): number {
        return Math.ceil(this.pedidosFiltrados.length / this.itemsPorPagina);
    }

    get paginasArray(): number[] {
        const total = this.totalPaginas;
        const paginas: number[] = [];
        for (let i = 1; i <= total; i++) {
            paginas.push(i);
        }
        return paginas;
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas) {
            this.paginaActual = pagina;
            this.cdr.detectChanges();
        }
    }

    cargarKPIs(): void {
        this.dataService.getAdminKPIs().subscribe({
            next: (data) => {
                this.metricasGlobales = data.map((k: any) => ({
                    titulo: k.titulo,
                    valor: k.valor,
                    sub: k.tendencia,
                    icono: k.icono,
                    color: k.clase === 'kpi-alert' ? 'alerta' : 'exito'
                }));
                this.cdr.detectChanges();
            }
        });
    }

    cargarTopProductos(): void {
        this.dataService.getTopProductos().subscribe({
            next: (data) => {
                this.topProductos = data.map((p: any) => ({
                    nombre: p.nombre,
                    ventas: p.total_vendido || 0,
                    stock: p.stock_actual || 0
                }));
                this.cdr.detectChanges();
            }
        });
    }

    cargarAnalisis(): void {
        this.dataService.getEstadisticasVentas().subscribe({
            next: (stats: any) => {
                if (stats && stats.total_pedidos) {
                    const top = this.topProductos.length > 0 ? this.topProductos[0].nombre : 'N/A';
                    this.analisisHoy = {
                        texto: `${stats.total_pedidos} pedidos este mes por un total de $${Number(stats.total_ventas || 0).toLocaleString('es-CO')}. Ticket promedio: $${Number(stats.ticket_promedio || 0).toLocaleString('es-CO')}. Producto más vendido: ${top}.`,
                        cargando: false
                    };
                } else {
                    this.analisisHoy = { texto: 'No hay datos de ventas este mes.', cargando: false };
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.analisisHoy = { texto: 'No se pudieron cargar las estadísticas.', cargando: false };
                this.cdr.detectChanges();
            }
        });
    }

    capitalizar(str: string): string {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    }

    verDetalle(pedido: any): void {
        this.pedidoDetalle = pedido;
        this.cargandoDetalle = true;
        this.itemsDetalle = [];
        this.editando = false;
        this.msgExito = '';
        this.msgError = '';
        this.dataService.getDetallePedido(pedido.id).subscribe({
            next: (items) => {
                this.itemsDetalle = items;
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.itemsDetalle = [];
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            }
        });
        setTimeout(() => {
            const modal = document.getElementById('modalDetallePedido');
            if (modal) {
                const bsModal = new (window as any).bootstrap.Modal(modal);
                bsModal.show();
            }
        }, 0);
    }

    editarPedido(pedido: any): void {
        this.pedidoDetalle = pedido;
        this.editForm = {
            nombre_envio: '',
            email_envio: '',
            direccion_envio: '',
            ciudad_envio: '',
            metodo_pago: 'tarjeta',
            estado: 'pendiente',
            notas: ''
        };
        this.msgExito = '';
        this.msgError = '';
        this.editando = false;
        this.cargandoDetalle = true;
        this.itemsDetalle = [];

        const modal = document.getElementById('modalDetallePedido');
        if (modal) {
            const bsModal = new (window as any).bootstrap.Modal(modal);
            bsModal.show();
        }

        this.dataService.getDetallePedido(pedido.id).subscribe({
            next: (items) => {
                this.itemsDetalle = items;
                this.cdr.detectChanges();
            }
        });

        this.dataService.getPedidos().subscribe({
            next: (pedidos) => {
                const p = pedidos.find((x: any) => x.id === pedido.id);
                if (p) {
                    this.editForm = {
                        nombre_envio: p.nombre_envio || '',
                        email_envio: p.email_envio || '',
                        direccion_envio: p.direccion_envio || '',
                        ciudad_envio: p.ciudad_envio || '',
                        metodo_pago: p.metodo_pago || 'tarjeta',
                        estado: p.estado || 'pendiente',
                        notas: p.notas || ''
                    };
                }
                this.cargandoDetalle = false;
                this.editando = true;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            }
        });
    }

    guardarEdicion(): void {
        if (!this.pedidoDetalle) return;
        this.guardandoEdicion = true;
        this.msgExito = '';
        this.msgError = '';

        this.dataService.actualizarPedido(this.pedidoDetalle.id, this.editForm).subscribe({
            next: (res: any) => {
                this.guardandoEdicion = false;
                if (res.ok) {
                    this.toastMsg = 'Pedido actualizado exitosamente';
                    setTimeout(() => this.toastMsg = '', 3000);
                    const idx = this.pedidos.findIndex(p => p.id === this.pedidoDetalle.id);
                    if (idx !== -1) {
                        this.pedidos[idx].estado = this.capitalizar(this.editForm.estado);
                        this.pedidos[idx].metodo = this.editForm.metodo_pago;
                    }
                    this.cerrarDetalle();
                    this.cargarPedidos();
                } else {
                    this.msgError = res.mensaje || 'Error al actualizar';
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.guardandoEdicion = false;
                this.msgError = 'Error de conexión con el servidor';
                this.cdr.detectChanges();
            }
        });
    }

    cancelarEdicion(): void {
        this.editando = false;
        this.msgExito = '';
        this.msgError = '';
        this.cdr.detectChanges();
    }

    cerrarDetalle(): void {
        const modal = document.getElementById('modalDetallePedido');
        if (modal) {
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        this.pedidoDetalle = null;
        this.itemsDetalle = [];
        this.editando = false;
        this.msgExito = '';
        this.msgError = '';
    }

    cancelarPedido(pedido: any): void {
        if (!confirm(`¿Estás seguro de eliminar el pedido ${pedido.codigo || pedido.id}? Esta acción no se puede deshacer.`)) return;

        this.dataService.eliminarPedido(pedido.id).subscribe({
            next: (res: any) => {
                if (res.ok) {
                    this.toastMsg = 'Pedido eliminado exitosamente';
                    setTimeout(() => this.toastMsg = '', 3000);
                    this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
                    this.aplicarFiltrosPedidos();
                } else {
                    alert(res.mensaje || 'Error al eliminar el pedido');
                }
                this.cdr.detectChanges();
            },
            error: () => {
                alert('Error de conexión con el servidor');
                this.cdr.detectChanges();
            }
        });
    }

    private formatDate(d: Date): string {
        return d.toISOString().split('T')[0];
    }

    toggleReporte(): void {
        this.mostrarReporte = !this.mostrarReporte;
        if (this.mostrarReporte && !this.reporte) {
            this.generarReporte();
        }
    }

    verReporte(): void {
        if (!this.mostrarReporte) {
            this.mostrarReporte = true;
            if (!this.reporte) {
                this.generarReporte();
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    generarReporte(): void {
        if (!this.filtroFechaInicio || !this.filtroFechaFin) return;
        this.cargandoReporte = true;
        this.reporte = null;
        this.dataService.getReporteVentas(this.filtroFechaInicio, this.filtroFechaFin, this.filtroVendedorId)
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

    imprimirReporte(): void {
        window.print();
    }

    exportarCSV(): void {
        if (!this.reporte?.detalle) return;
        const cabecera = ['Fecha', 'Vendedor', 'Cliente', 'Producto', 'Monto', 'Estado'].join(',');
        const filas = this.reporte.detalle.map((r: any) =>
            [r.fecha, r.vendedor, r.cliente, r.producto, r.monto, r.estado].join(',')
        );
        const csv = [cabecera, ...filas].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ventas-${this.filtroFechaInicio}-${this.filtroFechaFin}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    cerrarSesion(): void {
        this.router.navigate(['/login']);
    }

    getBadgeClass(estado: string): string {
        const classes: any = {
            'Pendiente': 'bg-warning text-dark',
            'Pagado': 'bg-primary',
            'Enviado': 'bg-info',
            'Completado': 'bg-success',
            'Cancelado': 'bg-danger'
        };
        return classes[estado] || 'bg-secondary';
    }
}
