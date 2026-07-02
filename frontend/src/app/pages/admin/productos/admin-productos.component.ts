import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-admin-productos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-productos.component.html',
    styleUrl: './admin-productos.component.css'
})
export class AdminProductosComponent implements OnInit {
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    productos: any[] = [];
    productosFiltrados: any[] = [];
    cargando = false;
    busqueda = '';
    filtroCategoria = 'Todos';
    mostrarInactivos = false;

    mostrarModal = false;
    editando = false;
    mensajeError = '';
    mensajeExito = '';

    formProducto = {
        id: null as number | null,
        nombre: '',
        descripcion: '',
        precio: 0,
        precio_costo: 0,
        categoria: '',
        imagen_url: '',
        etiqueta: '',
        especificaciones: '',
        stock_actual: 0,
        stock_minimo: 5,
        activo: 1
    };

    subiendoImagen = false;
    previewImagen = '';

    categorias = ['Libros y Biblias', 'Manualidades', 'Instrumentos', 'Ropa y Accesorios'];
    etiquetas = ['', 'Bestseller', 'Nuevo', 'Oferta', 'Popular'];

    ngOnInit(): void {
        this.cargarProductos();
    }

    cargarProductos(): void {
        this.cargando = true;
        const params: any = { admin: '1' };
        if (this.filtroCategoria !== 'Todos') params.categoria = this.filtroCategoria;

        this.dataService.getProductos(params).subscribe({
            next: (data) => {
                this.productos = data;
                this.aplicarFiltro();
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    aplicarFiltro(): void {
        let lista = this.mostrarInactivos
            ? [...this.productos]
            : this.productos.filter(p => p.activo == 1);

        if (this.busqueda.trim()) {
            const q = this.busqueda.toLowerCase();
            lista = lista.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                (p.categoria || '').toLowerCase().includes(q)
            );
        }

        this.productosFiltrados = lista;
    }

    onBusquedaChange(val: string): void {
        this.busqueda = val;
        this.aplicarFiltro();
    }

    onCategoriaChange(): void {
        this.cargarProductos();
    }

    onInactivosChange(): void {
        this.aplicarFiltro();
    }

    abrirNuevoModal(): void {
        this.editando = false;
        this.mensajeError = '';
        this.mensajeExito = '';
        this.previewImagen = '';
        this.formProducto = {
            id: null, nombre: '', descripcion: '', precio: 0, precio_costo: 0,
            categoria: '', imagen_url: '', etiqueta: '', especificaciones: '',
            stock_actual: 0, stock_minimo: 5, activo: 1
        };
        this.mostrarModal = true;
    }

    abrirEditarModal(producto: any): void {
        this.editando = true;
        this.mensajeError = '';
        this.mensajeExito = '';
        this.previewImagen = producto.imagen_url || '';
        this.formProducto = {
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: Number(producto.precio),
            precio_costo: Number(producto.precio_costo) || 0,
            categoria: producto.categoria || '',
            imagen_url: producto.imagen_url || '',
            etiqueta: producto.etiqueta || '',
            especificaciones: producto.especificaciones || '',
            stock_actual: producto.stock_actual || 0,
            stock_minimo: producto.stock_minimo || 5,
            activo: producto.activo
        };
        this.mostrarModal = true;
    }

    cerrarModal(): void {
        this.mostrarModal = false;
        this.mensajeError = '';
        this.mensajeExito = '';
        this.previewImagen = '';
        this.subiendoImagen = false;
    }

    guardarProducto(): void {
        this.mensajeError = '';
        this.mensajeExito = '';

        if (!this.formProducto.nombre || !this.formProducto.precio) {
            this.mensajeError = 'Nombre y precio son campos requeridos.';
            return;
        }

        this.cargando = true;

        if (this.editando) {
            this.dataService.editarProducto(this.formProducto).subscribe({
                next: (res) => {
                    this.cargando = false;
                    if (res.ok) {
                        this.mensajeExito = 'Producto actualizado correctamente.';
                        setTimeout(() => this.cerrarModal(), 1200);
                        this.cargarProductos();
                    } else {
                        this.mensajeError = res.mensaje || 'Error al actualizar.';
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.cargando = false;
                    this.mensajeError = err.error?.mensaje || 'Error al actualizar.';
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.dataService.crearProducto(this.formProducto).subscribe({
                next: (res) => {
                    this.cargando = false;
                    if (res.ok) {
                        this.mensajeExito = 'Producto creado correctamente.';
                        setTimeout(() => this.cerrarModal(), 1200);
                        this.cargarProductos();
                    } else {
                        this.mensajeError = res.mensaje || 'Error al crear.';
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.cargando = false;
                    this.mensajeError = err.error?.mensaje || 'Error al crear.';
                    this.cdr.detectChanges();
                }
            });
        }
    }

    eliminarProducto(producto: any): void {
        if (confirm(`¿Estás seguro de eliminar "${producto.nombre}" del catálogo?`)) {
            this.dataService.eliminarProducto(producto.id).subscribe({
                next: (res) => {
                    if (res.ok) {
                        this.cargarProductos();
                    } else {
                        alert(res.mensaje || 'Error al eliminar.');
                    }
                },
                error: (err) => alert(err.error?.mensaje || 'Error al eliminar.')
            });
        }
    }

    toggleActivo(producto: any): void {
        const nuevoEstado = producto.activo ? 0 : 1;
        const data = {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            precio_costo: producto.precio_costo,
            categoria: producto.categoria,
            imagen_url: producto.imagen_url,
            etiqueta: producto.etiqueta,
            especificaciones: producto.especificaciones,
            stock_actual: producto.stock_actual,
            stock_minimo: producto.stock_minimo,
            descripcion: producto.descripcion,
            activo: nuevoEstado
        };
        this.dataService.editarProducto(data).subscribe({
            next: () => this.cargarProductos(),
            error: (err) => alert(err.error?.mensaje || 'Error al cambiar estado.')
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
            this.mensajeError = 'La imagen no puede superar 5MB.';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.previewImagen = reader.result as string;
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);

        this.subiendoImagen = true;
        this.mensajeError = '';
        this.dataService.subirImagenProducto(file).subscribe({
            next: (res) => {
                this.subiendoImagen = false;
                if (res.ok) {
                    this.formProducto.imagen_url = res.datos.url;
                } else {
                    this.mensajeError = res.mensaje || 'Error al subir imagen.';
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.subiendoImagen = false;
                this.mensajeError = err.error?.mensaje || 'Error al subir imagen.';
                this.cdr.detectChanges();
            }
        });
    }

    formatearPrecio(precio: number): string {
        return '$' + Number(precio).toLocaleString('es-CO');
    }
}
