import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataService } from '../../../../core/services/data.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-tienda-catalogo',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './tienda-catalogo.component.html',
    styleUrl: './tienda-catalogo.component.css'
})
export class TiendaCatalogoComponent implements OnInit, OnDestroy {

    public dataService = inject(DataService);
    public authService = inject(AuthService);
    private router = inject(Router);

    // Valor del input — propiedad plana, NO signal (evita re-render del input)
    textoBusqueda = '';

    // Signals para estado de UI
    cargando = signal<boolean>(true);
    productos = signal<any[]>([]);
    busqueda = signal<string>('');
    sugerencias = signal<any[]>([]);
    mostrarSugerencias = signal<boolean>(false);
    buscando = signal<boolean>(false);

    private debounceTimer: any = null;
    private busquedaSub: Subscription | null = null;
    private clickOutsideHandler!: (event: Event) => void;

    // Filtros
    categoriaSeleccionada = signal<string>('Todos');
    precioMin = signal<number>(5000);
    ordenSeleccionado = signal<string>('precio ASC');

    productosFiltrados = computed(() => {
        const prods = this.productos();
        const query = this.busqueda().toLowerCase().trim();
        if (!query) return prods;
        return prods.filter(p =>
            p.nombre.toLowerCase().includes(query) ||
            p.descripcion.toLowerCase().includes(query)
        );
    });

    categorias = [
        { nombre: 'Todos', icono: '🌈' },
        { nombre: 'Libros y Biblias', icono: '📖' },
        { nombre: 'Manualidades', icono: '🎨' },
        { nombre: 'Instrumentos', icono: '🥁' },
        { nombre: 'Ropa y Accesorios', icono: '👕' }
    ];

    ngOnInit(): void {
        this.cargarProductos(true);
        this.dataService.getCarrito().subscribe();

        this.clickOutsideHandler = (event: Event) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-bar-wrap')) {
                this.mostrarSugerencias.set(false);
            }
        };
        document.addEventListener('click', this.clickOutsideHandler);
    }

    ngOnDestroy(): void {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        if (this.busquedaSub) this.busquedaSub.unsubscribe();
        document.removeEventListener('click', this.clickOutsideHandler);
    }

    cargarProductos(inicial: boolean = false): void {
        this.cargando.set(true);

        const filtros = {
            categoria: this.categoriaSeleccionada(),
            min_precio: inicial ? null : this.precioMin(),
            orden: this.ordenSeleccionado()
        };

        this.dataService.getProductos(filtros).subscribe({
            next: (data) => {
                this.productos.set(data || []);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar productos:', err);
                this.productos.set([]);
                this.cargando.set(false);
            }
        });
    }

    seleccionarCategoria(cat: string): void {
        this.categoriaSeleccionada.set(cat);
        this.cargarProductos();
    }

    aplicarFiltros(): void {
        this.cargarProductos();
    }

    actualizarBusqueda(val: string): void {
        this.textoBusqueda = val;

        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        if (this.busquedaSub) this.busquedaSub.unsubscribe();

        if (!val || val.trim().length < 2) {
            this.sugerencias.set([]);
            this.mostrarSugerencias.set(false);
            this.buscando.set(false);
            return;
        }

        this.buscando.set(true);
        this.mostrarSugerencias.set(true);

        this.debounceTimer = setTimeout(() => {
            this.busquedaSub = this.dataService.getProductos({ busqueda: val.trim() }).subscribe({
                next: (data) => {
                    this.sugerencias.set(data || []);
                    this.buscando.set(false);
                },
                error: () => {
                    this.sugerencias.set([]);
                    this.buscando.set(false);
                }
            });
        }, 300);
    }

    onBusquedaFocus(): void {
        if (this.textoBusqueda.length >= 2 && this.sugerencias().length > 0) {
            this.mostrarSugerencias.set(true);
        }
    }

    seleccionarSugerencia(producto: any): void {
        this.mostrarSugerencias.set(false);
        this.textoBusqueda = '';
        this.router.navigate(['/tienda/producto', producto.id]);
    }

    onBuscarEnter(): void {
        this.mostrarSugerencias.set(false);
        this.busqueda.set(this.textoBusqueda);
    }

    cerrarSugerencias(): void {
        this.mostrarSugerencias.set(false);
    }

    agregarAlCarrito(producto: any): void {
        this.dataService.agregarAlCarrito(producto.id).subscribe({
            next: () => alert(`¡${producto.nombre} agregado al carrito! 🛒`),
            error: () => alert('No se pudo agregar el producto al carrito.')
        });
    }
}
