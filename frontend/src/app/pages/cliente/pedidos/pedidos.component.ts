import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-cliente-pedidos',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pedidos.component.html',
    styleUrl: './pedidos.component.css'
})
export class PedidosComponent implements OnInit {
    private dataService = inject(DataService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    pedidos: any[] = [];
    cargando = false;

    // Detalle de Pedido seleccionado
    pedidoSeleccionado: any = null;
    itemsDetalle: any[] = [];
    mostrarModal = false;
    cargandoDetalle = false;

    ngOnInit(): void {
        this.cargarPedidos();
    }

    cargarPedidos(): void {
        this.cargando = true;
        this.dataService.getPedidos().subscribe({
            next: (data) => {
                this.pedidos = data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    abrirDetalles(pedido: any): void {
        this.pedidoSeleccionado = pedido;
        this.mostrarModal = true;
        this.cargandoDetalle = true;
        this.itemsDetalle = [];

        this.dataService.getDetallePedido(pedido.id).subscribe({
            next: (data) => {
                this.itemsDetalle = data;
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            }
        });
    }

    cerrarModal(): void {
        this.pedidoSeleccionado = null;
        this.mostrarModal = false;
        this.itemsDetalle = [];
    }

    irATienda(): void {
        this.router.navigate(['/tienda/catalogo']);
    }

    // Calcula el número de paso activo para el tracker de envío
    getStepActive(estado: string): number {
        const est = (estado || '').toLowerCase();
        if (est === 'cancelado') return -1;
        if (est === 'entregado') return 4;
        if (est === 'en_camino') return 3;
        if (est === 'pagado') return 2;
        return 1;
    }
}
