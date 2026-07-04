import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-nueva-venta',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './nueva-venta.component.html',
    styleUrl: './nueva-venta.component.css'
})
export class NuevaVentaComponent implements OnInit {
    private dataService = inject(DataService);
    private router = inject(Router);

    clientes: any[] = [];
    productosDisponibles: any[] = [];
    loading = false;
    successMsg = '';
    errorMsg = '';

    pedido = {
        id_cliente: null as number | null,
        nombre_envio: '',
        email_envio: '',
        direccion_envio: '',
        ciudad_envio: '',
        subtotal: 0,
        costo_envio: 0,
        total: 0,
        metodo_pago: 'efectivo' as string,
        estado: 'pendiente' as string,
        notas: '',
        detalle: [] as { id_producto: number | null, producto_nombre: string, cantidad: number, precio_unitario: number }[]
    };

    ngOnInit(): void {
        this.cargarClientes();
        this.cargarProductos();
        this.agregarLineaDetalle();
    }

    cargarClientes(): void {
        this.dataService.getClientes().subscribe(data => this.clientes = data);
    }

    cargarProductos(): void {
        this.dataService.getProductosConPrecio().subscribe(data => this.productosDisponibles = data);
    }

    getProducto(id: number | null): any {
        return this.productosDisponibles.find(p => p.id === id);
    }

    onProductoChange(index: number): void {
        const linea = this.pedido.detalle[index];
        const prod = this.getProducto(linea.id_producto);
        if (prod) {
            linea.producto_nombre = prod.nombre;
            linea.precio_unitario = parseFloat(prod.precio) || 0;
        } else {
            linea.producto_nombre = '';
            linea.precio_unitario = 0;
        }
        this.recalcular();
    }

    recalcular(): void {
        let sub = 0;
        for (const line of this.pedido.detalle) {
            sub += (line.cantidad || 0) * (line.precio_unitario || 0);
        }
        this.pedido.subtotal = sub;
        this.pedido.costo_envio = sub > 150000 ? 0 : 12000;
        this.pedido.total = this.pedido.subtotal + this.pedido.costo_envio;
    }

    agregarLineaDetalle(): void {
        this.pedido.detalle.push({ id_producto: null, producto_nombre: '', cantidad: 1, precio_unitario: 0 });
    }

    eliminarLineaDetalle(index: number): void {
        if (this.pedido.detalle.length > 1) {
            this.pedido.detalle.splice(index, 1);
            this.recalcular();
        }
    }

    onClienteChange(): void {
        const cliente = this.clientes.find(c => c.id === this.pedido.id_cliente);
        if (cliente) {
            if (!this.pedido.nombre_envio) this.pedido.nombre_envio = cliente.nombre + ' ' + (cliente.apellido || '');
            if (!this.pedido.email_envio) this.pedido.email_envio = cliente.email || '';
        }
    }

    enviar(): void {
        if (!this.pedido.id_cliente) {
            this.errorMsg = 'Debe seleccionar un cliente';
            return;
        }
        if (!this.pedido.nombre_envio || !this.pedido.direccion_envio) {
            this.errorMsg = 'Nombre y dirección de envío son obligatorios';
            return;
        }
        const detalleValido = this.pedido.detalle.filter(d => d.id_producto && d.cantidad > 0);
        if (detalleValido.length === 0) {
            this.errorMsg = 'Debe agregar al menos un producto con cantidad válida';
            return;
        }

        this.loading = true;
        this.errorMsg = '';
        this.successMsg = '';

        const payload = {
            ...this.pedido,
            detalle: detalleValido.map(d => ({
                id_producto: d.id_producto,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario
            }))
        };

        this.dataService.crearPedidoManual(payload).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.ok) {
                    this.successMsg = `Pedido ${res.datos?.codigo || ''} creado exitosamente`;
                    setTimeout(() => this.successMsg = '', 3000);
                    setTimeout(() => this.router.navigate(['/admin/ventas']), 3000);
                } else {
                    this.errorMsg = res.mensaje || 'Error al crear pedido';
                }
            },
            error: (err) => {
                this.loading = false;
                this.errorMsg = 'Error de conexión con el servidor';
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/admin/ventas']);
    }
}