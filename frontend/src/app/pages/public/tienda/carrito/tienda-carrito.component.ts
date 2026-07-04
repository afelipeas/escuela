import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../../core/services/data.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-tienda-carrito',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './tienda-carrito.component.html',
    styleUrl: './tienda-carrito.component.css'
})
export class TiendaCarritoComponent implements OnInit {

    public dataService = inject(DataService);
    public authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    carrito: any[] = [];
    cargando = true;

    // Datos del formulario de envío/pago
    formCompra = {
        nombre_envio: '',
        direccion_envio: '',
        metodo_pago: 'tarjeta'
    };

    pasoActual: number = 1; // 1: Carrito, 2: Checkout, 3: Éxito
    errorCheckout = '';

    ngOnInit(): void {
        this.cargarCarrito();
    }

    cargarCarrito(): void {
        this.cargando = true;
        this.dataService.getCarrito().subscribe({
            next: (data) => {
                this.carrito = data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => { this.cargando = false; this.cdr.detectChanges(); }
        });
    }

    get subtotal(): number {
        return this.carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    }

    get costoEnvio(): number {
        return (this.subtotal > 150000 || this.subtotal === 0) ? 0 : 12000;
    }

    get total(): number {
        return this.subtotal + this.costoEnvio;
    }

    actualizarCantidad(id_producto: number, delta: number): void {
        this.dataService.agregarAlCarrito(id_producto, delta).subscribe(() => {
            this.cargarCarrito();
        });
    }

    eliminarItem(id_producto: number): void {
        if (confirm('¿Eliminar este producto del carrito?')) {
            this.dataService.eliminarDelCarrito(id_producto).subscribe(() => {
                this.cargarCarrito();
            });
        }
    }

    irACheckout(): void {
        if (this.carrito.length > 0) {
            this.pasoActual = 2;
            window.scrollTo(0, 0);
        }
    }

    confirmarPedido(): void {
        this.cargando = true;
        this.errorCheckout = '';

        const datosFinales = {
            ...this.formCompra,
            items: this.carrito
        };

        this.dataService.procesarPedido(datosFinales).subscribe({
            next: (res) => {
                this.pasoActual = 3;
                this.carrito = [];
                this.cargando = false;
                window.scrollTo(0, 0);
                this.cdr.detectChanges();
                if (this.formCompra.metodo_pago === 'puntos') {
                    this.dataService.getResumenEstudiante().subscribe();
                }
            },
            error: (err) => {
                this.errorCheckout = err.error?.mensaje || 'Error al procesar el pedido';
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    irATienda(): void {
        this.router.navigate(['/tienda/catalogo']);
    }
}
