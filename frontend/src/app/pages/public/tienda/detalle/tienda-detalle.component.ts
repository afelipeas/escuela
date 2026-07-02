import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { DataService } from '../../../../core/services/data.service';

const DESCRIPCIONES_PRODUCTOS: Record<number, { especificaciones: string[], testimonios: any[], relacionados: any[] }> = {
    1: {
        especificaciones: ['Idioma: Español', 'Páginas: 384', 'Edad: 4-12 años', 'Encuadernación: Tapa dura', 'Ilustraciones: A color', 'Peso: 680g'],
        testimonios: [
            { usuario: 'Marta R.', texto: 'A mi hijo de 6 años le encanta, las historias son muy claras.', estrellas: 5 },
            { usuario: 'Carlos P.', texto: 'Excelente material para usar en la escuela dominical.', estrellas: 4 }
        ],
        relacionados: [2, 6, 5]
    },
    2: {
        especificaciones: ['Material: Madera de pino', 'Piezas: 15 + 12 animales', 'Pinturas: 6 colores acrílicos', 'Edad: 3+ años', 'Tamaño arca: 25cm x 12cm x 15cm', 'Peso: 450g'],
        testimonios: [
            { usuario: 'Lucía M.', texto: 'Mis hijos pasaron toda la tarde armándolo y pintando. Muy entretenido y educativo.', estrellas: 5 },
            { usuario: 'Andrés G.', texto: 'La calidad de la madera es excelente. Ideal para la clase de manualidades.', estrellas: 4 }
        ],
        relacionados: [5, 1, 4]
    },
    3: {
        especificaciones: ['Diámetro: 15cm', 'Material cuerpo: Madera lacada', 'Membrana: Cuero natural', 'Cascabeles: Latón', 'Peso: 180g', 'Edad: 3+ años'],
        testimonios: [
            { usuario: 'Sofía L.', texto: 'La usamos en la iglesia infantil y los niños se divierten mucho alabando con ella.', estrellas: 5 },
            { usuario: 'David R.', texto: 'Buena calidad de sonido, resistente para el uso rudo de los niños.', estrellas: 4 }
        ],
        relacionados: [4, 1, 6]
    },
    4: {
        especificaciones: ['Material: Algodón 100% peinado', 'Tallas: 2-12 años', 'Estampa: Serigráfica', 'Lavado: Máquina fría', 'Colores: Blanco, Azul marino, Gris'],
        testimonios: [
            { usuario: 'Ana P.', texto: 'La tela es muy suave, mi hijo no se la quiere quitar. El diseño es hermoso.', estrellas: 5 },
            { usuario: 'María F.', texto: 'Excelente calidad. Resistente a los lavados, no destiñe ni encoge.', estrellas: 5 }
        ],
        relacionados: [3, 1, 5]
    },
    5: {
        especificaciones: ['Cantidad: 12 colores', 'Mina: 3.5mm', 'Madera: Cedro', 'Certificación: ASTM D-4236', 'Incluye: Estuche organizador', 'No tóxico: Sí'],
        testimonios: [
            { usuario: 'Carmen V.', texto: 'Los compré para mi clase y duran mucho, la punta no se quiebra fácil.', estrellas: 4 },
            { usuario: 'Luis T.', texto: 'Colores muy vivos y el estuche metálico es un plus para guardarlos.', estrellas: 5 }
        ],
        relacionados: [2, 6, 4]
    },
    6: {
        especificaciones: ['Páginas: 160', 'Papel: Crema 90gsm', 'Encuadernación: Espiral', 'Tamaño: 14cm x 21cm', 'Secciones: 4', 'Versículos: 52'],
        testimonios: [
            { usuario: 'Valentina R.', texto: 'A mi hija le encanta escribir sus oraciones cada noche. Muy bonita.', estrellas: 5 },
            { usuario: 'Pedro S.', texto: 'La calidad del papel es excelente. Los versículos incluidos son muy inspiradores.', estrellas: 5 }
        ],
        relacionados: [1, 5, 3]
    }
};

@Component({
    selector: 'app-tienda-detalle',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './tienda-detalle.component.html',
    styleUrl: './tienda-detalle.component.css'
})
export class TiendaDetalleComponent implements OnInit {

    public authService = inject(AuthService);
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);
    producto: any = null;
    cantidad: number = 1;
    cargando = true;

    testimonios: any[] = [];
    productosRelacionados: any[] = [];

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.cargarProducto(id);
    }

    private cargarProducto(id: number): void {
        this.cargando = true;
        this.dataService.getProductoById(id).subscribe({
            next: (prod) => {
                if (prod) {
                    this.producto = prod;
                    this.cargarDatosAdicionales(prod.id);
                } else {
                    this.usarFallback(id);
                }
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.usarFallback(id);
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    private usarFallback(id: number): void {
        const data = DESCRIPCIONES_PRODUCTOS[id] || DESCRIPCIONES_PRODUCTOS[1];
        this.producto = {
            id: id,
            nombre: this.obtenerNombreFallback(id),
            precio: this.obtenerPrecioFallback(id),
            categoria: this.obtenerCategoriaFallback(id),
            imagen_url: this.obtenerImagenFallback(id),
            etiqueta: this.obtenerEtiquetaFallback(id),
            puntuacion: 4.5,
            ventas: 60,
            descripcion: 'Descripción no disponible. Por favor, intente más tarde.',
            especificaciones: data.especificaciones
        };
        this.testimonios = data.testimonios;
        this.cargarRelacionados(data.relacionados);
    }

    private cargarDatosAdicionales(id: number): void {
        // Convertir especificaciones de string separado por comas a array si es necesario
        if (typeof this.producto.especificaciones === 'string') {
            this.producto.especificaciones = this.producto.especificaciones
                .split(',')
                .map((e: string) => e.trim())
                .filter((e: string) => e.length > 0);
        }

        const data = DESCRIPCIONES_PRODUCTOS[id];
        if (data) {
            // Usar testimonios y relacionados del fallback (no están en la BD)
            this.testimonios = data.testimonios;
            this.cargarRelacionados(data.relacionados);
        } else {
            this.testimonios = [];
            this.productosRelacionados = [];
        }
    }

    private cargarRelacionados(ids: number[]): void {
        this.dataService.getProductos().subscribe(productos => {
            this.productosRelacionados = productos
                .filter((p: any) => ids.includes(p.id))
                .map((p: any) => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio: p.precio,
                    imagen: p.imagen_url
                }));
            this.cdr.detectChanges();
        });
    }

    private obtenerNombreFallback(id: number): string {
        const nombres: Record<number, string> = {
            1: 'Biblia para Niños "Aventura"',
            2: 'Kit Arca de Noé (Madera)',
            3: 'Pandereta "Alabanza"',
            4: 'Camiseta "Pequeño Gigante"',
            5: 'Set de 12 Lápices de Colores',
            6: 'Libreta de Oración "Mi Amigo Jesús"'
        };
        return nombres[id] || 'Producto';
    }

    private obtenerPrecioFallback(id: number): number {
        const precios: Record<number, number> = { 1: 65000, 2: 48000, 3: 28000, 4: 35000, 5: 14000, 6: 20000 };
        return precios[id] || 0;
    }

    private obtenerCategoriaFallback(id: number): string {
        const cats: Record<number, string> = { 1: 'Libros y Biblias', 2: 'Manualidades', 3: 'Instrumentos', 4: 'Ropa y Accesorios', 5: 'Manualidades', 6: 'Libros y Biblias' };
        return cats[id] || 'General';
    }

    private obtenerImagenFallback(id: number): string {
        const imgs: Record<number, string> = { 1: '📖', 2: '🚢', 3: '🥁', 4: '👕', 5: '✏️', 6: '📓' };
        return imgs[id] || '🎁';
    }

    private obtenerEtiquetaFallback(id: number): string | null {
        const etiquetas: Record<number, string> = { 1: 'Bestseller', 2: 'Nuevo', 4: 'Oferta', 6: 'Popular' };
        return etiquetas[id] || null;
    }

    cambiarCantidad(delta: number): void {
        this.cantidad = Math.max(1, this.cantidad + delta);
    }

    agregarAlCarrito(): void {
        this.dataService.agregarAlCarrito(this.producto.id, this.cantidad).subscribe({
            next: () => {
                alert(`¡${this.cantidad} unidad(es) de ${this.producto.nombre} añadidas al carrito! 🛒`);
                this.dataService.getCarrito().subscribe();
            },
            error: () => alert('No se pudo agregar el producto al carrito.')
        });
    }
}
