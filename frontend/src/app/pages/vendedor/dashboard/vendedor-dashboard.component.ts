import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);

@Component({
    selector: 'app-vendedor-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './vendedor-dashboard.component.html',
    styleUrl: './vendedor-dashboard.component.css'
})
export class VendedorDashboardComponent implements OnInit {
    private dataService = inject(DataService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    usuario = this.authService.currentUser;

    // Datos asíncronos
    kpis: any[] = [];
    ventasRecientes: any[] = [];
    consultasClientes: any[] = [];

    // Modal detalle
    pedidoDetalle: any = null;
    itemsDetalle: any[] = [];
    cargandoDetalle = false;

    ngOnInit(): void {
        // Retardar sutilmente la petición para asegurar la persistencia y carga del Token en el Interceptor
        setTimeout(() => {
            this.cargarDatos();
        }, 150);
    }

    getEstadoClass(estado: string): string {
        return estado.toLowerCase().replace(/\s+/g, '-');
    }

    verDetalle(pedido: any): void {
        this.pedidoDetalle = pedido;
        this.itemsDetalle = [];
        this.cargandoDetalle = true;
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
    }

    cerrarDetalle(): void {
        this.pedidoDetalle = null;
        this.itemsDetalle = [];
    }

    cargarDatos(): void {
        this.dataService.getResumenVentas().subscribe((data: any) => {
            this.kpis = data;
            this.cdr.detectChanges();
        });

        this.dataService.getVentasRecientes().subscribe((data: any) => {
            this.ventasRecientes = data;
            this.cdr.detectChanges();
        });

        this.dataService.getConsultasClientes().subscribe((data: any) => {
            this.consultasClientes = data;
            this.cdr.detectChanges();
        });
    }
}
