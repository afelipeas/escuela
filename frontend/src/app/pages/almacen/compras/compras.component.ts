import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-almacen-compras',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './compras.component.html',
    styleUrl: './compras.component.css'
})
export class AlmacenComprasComponent implements OnInit {

    private dataService = inject(DataService);
    private authService = inject(AuthService);
    private router = inject(Router);

    // Información del Jefe de Almacén / Compras
    usuario = {
        nombre: 'Ricardo Montaner',
        rol: 'Gestor de Adquisiciones',
        foto: '🛒'
    };

    fechaInicio: string = '';
    fechaFin: string = '';
    cargando = signal(false);

    // KPI's de Compras
    metricasCompras = signal<any[]>([]);

    // Listado de Órdenes de Compra
    ordenesCompra = signal<any[]>([]);

    // Distribución del gasto
    distribucionGasto = signal<{ nombre: string, monto: string, porcentaje: number, color: string }[]>([]);

    private coloresCat: string[] = ['bg-naranja', 'bg-azul', 'bg-verde', 'bg-rojo', 'bg-purpura'];

    // Modal nueva orden
    mostrarModal = false;
    mostrarModalProducto = false;
    guardando = false;
    proveedores: any[] = [];
    productos: any[] = [];

    nuevoProducto = {
        nombre: '',
        precio: 0,
        precio_costo: 0,
        categoria: '',
        stock_actual: 0,
        stock_minimo: 5
    };

    formData = {
        id_proveedor: '',
        fecha_estimada: '',
        notas: ''
    };

    detalle: any[] = [];
    indiceProductoEnEdicion: number | null = null;

    // Modal editar / detalle orden
    mostrarModalDetalle = false;
    editando = false;
    ordenActual: any = null;
    detalleActual: any[] = [];
    ordenEditForm = {
        id_proveedor: '',
        total: 0,
        estado: '',
        fecha_estimada: '',
        notas: ''
    };
    guardandoEdicion = false;

    estadosDisponibles = ['pendiente', 'en_transito', 'recibido', 'cancelado'];

    constructor() { }

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

    nuevaOrden(): void {
        this.formData = { id_proveedor: '', fecha_estimada: '', notas: '' };
        this.detalle = [{ id_producto: '', cantidad: 1, precio_costo: 0 }];
        this.guardando = false;
        this.mostrarModal = true;

        this.dataService.getProveedores().subscribe({
            next: (data) => { this.proveedores = data; }
        });
        this.dataService.getProductosConStock().subscribe({
            next: (data) => { this.productos = data; }
        });
    }

    cerrarModal(): void {
        this.mostrarModal = false;
    }

    agregarDetalle(): void {
        this.detalle.push({ id_producto: '', cantidad: 1, precio_costo: 0 });
    }

    eliminarDetalle(index: number): void {
        if (this.detalle.length > 1) {
            this.detalle.splice(index, 1);
        }
    }

    onProductoChange(index: number): void {
        const item = this.detalle[index];
        if (item.id_producto === 'nuevo') {
            item.id_producto = '';
            this.abrirModalProducto(index);
            return;
        }
        const prod = this.productos.find(p => p.id === Number(item.id_producto));
        if (prod && prod.precio_costo) {
            item.precio_costo = prod.precio_costo;
        }
    }

    abrirModalProducto(index: number): void {
        this.indiceProductoEnEdicion = index;
        this.nuevoProducto = { nombre: '', precio: 0, precio_costo: 0, categoria: '', stock_actual: 0, stock_minimo: 5 };
        this.mostrarModalProducto = true;
    }

    cerrarModalProducto(): void {
        this.mostrarModalProducto = false;
    }

    guardarProducto(): void {
        if (!this.nuevoProducto.nombre || !this.nuevoProducto.precio_costo) return;

        this.dataService.crearProducto(this.nuevoProducto).subscribe({
            next: (res) => {
                this.dataService.getProductosConStock().subscribe({
                    next: (data) => {
                        this.productos = data;
                        this.cerrarModalProducto();
                        const nuevoProd = data[data.length - 1];
                        if (nuevoProd && this.indiceProductoEnEdicion !== null) {
                            this.detalle[this.indiceProductoEnEdicion].id_producto = nuevoProd.id;
                            this.detalle[this.indiceProductoEnEdicion].precio_costo = nuevoProd.precio_costo;
                            this.indiceProductoEnEdicion = null;
                        }
                    }
                });
            },
            error: () => {
                alert('Error al crear el producto. Intente nuevamente.');
            }
        });
    }

    calcularSubtotal(index: number): void {
    }

    calcularTotal(): number {
        return this.detalle.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precio_costo)), 0);
    }

    formValid(): boolean {
        if (!this.formData.id_proveedor) return false;
        if (this.detalle.length === 0) return false;
        return this.detalle.every(item => item.id_producto && Number(item.cantidad) > 0 && Number(item.precio_costo) >= 0);
    }

    guardarOrden(): void {
        if (!this.formValid()) return;
        this.guardando = true;

        const payload = {
            id_proveedor: Number(this.formData.id_proveedor),
            total: this.calcularTotal(),
            fecha_estimada: this.formData.fecha_estimada || null,
            notas: this.formData.notas || null,
            detalles: this.detalle.map(item => ({
                id_producto: Number(item.id_producto),
                cantidad: Number(item.cantidad),
                precio_costo: Number(item.precio_costo)
            }))
        };

        this.dataService.crearOrdenCompra(payload).subscribe({
            next: (res: any) => {
                this.guardando = false;
                if (res && res.ok === false) {
                    alert('Error: ' + (res.mensaje || 'No se pudo crear la orden'));
                    return;
                }
                this.cerrarModal();
                this.cargarReporte();
            },
            error: (err: any) => {
                this.guardando = false;
                const mensaje = err.error?.mensaje || err.message || 'Error al conectar con el servidor';
                alert('Error al crear la orden: ' + mensaje);
            }
        });
    }

    abrirDetalleOrden(orden: any): void {
        this.ordenActual = orden;
        this.editando = false;
        this.mostrarModalDetalle = true;
        this.detalleActual = [];

        this.ordenEditForm = {
            id_proveedor: orden.id_proveedor,
            total: orden.total,
            estado: orden.estado,
            fecha_estimada: orden.fecha_estimada ? orden.fecha_estimada.split(' ')[0] : '',
            notas: orden.notas || ''
        };

        this.dataService.getProveedores().subscribe({
            next: (data) => { this.proveedores = data; }
        });

        this.dataService.getDetalleOrdenCompra(orden.id).subscribe({
            next: (data) => {
                if (data && data.detalles) {
                    this.detalleActual = data.detalles.map((d: any) => ({
                        id: d.id,
                        id_producto: d.id_producto,
                        producto_nombre: d.producto_nombre,
                        cantidad: d.cantidad_pedida,
                        precio_costo: d.precio_costo_unitario
                    }));
                }
            }
        });
    }

    cerrarModalDetalle(): void {
        this.mostrarModalDetalle = false;
        this.editando = false;
    }

    toggleEditarOrden(): void {
        this.editando = !this.editando;
    }

    guardarEdicionOrden(): void {
        this.guardandoEdicion = true;

        const payload: any = {
            id: this.ordenActual.id,
            id_proveedor: Number(this.ordenEditForm.id_proveedor),
            total: Number(this.ordenEditForm.total),
            estado: this.ordenEditForm.estado,
            fecha_estimada: this.ordenEditForm.fecha_estimada || null,
            notas: this.ordenEditForm.notas || null
        };

        this.dataService.editarOrdenCompra(payload).subscribe({
            next: (res: any) => {
                this.guardandoEdicion = false;
                if (res && res.ok === false) {
                    alert('Error: ' + (res.mensaje || 'No se pudo actualizar'));
                    return;
                }
                this.cerrarModalDetalle();
                this.cargarReporte();
            },
            error: (err: any) => {
                this.guardandoEdicion = false;
                alert('Error al actualizar: ' + (err.error?.mensaje || err.message));
            }
        });
    }

    eliminarOrden(id: number): void {
        if (!confirm('¿Estás seguro de eliminar esta orden de compra? Esta acción no se puede deshacer.')) return;

        this.dataService.eliminarOrdenCompra(id).subscribe({
            next: (res: any) => {
                if (res && res.ok === false) {
                    alert('Error: ' + (res.mensaje || 'No se pudo eliminar'));
                    return;
                }
                this.cerrarModalDetalle();
                this.cargarReporte();
            },
            error: (err: any) => {
                alert('Error al eliminar: ' + (err.error?.mensaje || err.message));
            }
        });
    }

    exportarCompras(formato: string): void {
        alert(`Generando reporte de compras en formato ${formato}...`);
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
