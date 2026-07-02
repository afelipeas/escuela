import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

interface Proveedor {
    id: number;
    nombre: string;
    contacto: string;
    telefono: string;
    email: string;
    categoria: string;
    estado: 'Activo' | 'Inactivo';
}

@Component({
    selector: 'app-proveedores',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './proveedores.component.html',
    styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {
    private dataService = inject(DataService);

    // Estado reactivo para la lista de proveedores
    proveedores = signal<Proveedor[]>([
        { id: 1, nombre: 'Editoriales Unidas', contacto: 'Carlos Ruiz', telefono: '300 123 4567', email: 'ventas@unidas.com', categoria: 'Libros', estado: 'Activo' },
        { id: 2, nombre: 'Distribuidora Musical', contacto: 'Ana Mora', telefono: '315 987 6543', email: 'soporte@music.co', categoria: 'Instrumentos', estado: 'Activo' },
        { id: 3, nombre: 'Artesanías del Valle', contacto: 'Pedro Gómez', telefono: '320 456 7890', email: 'artes@valle.com', categoria: 'Decoración', estado: 'Inactivo' },
        { id: 4, nombre: 'Papelería Central', contacto: 'Lucía Fernández', telefono: '311 222 3333', email: 'info@papelcentral.com', categoria: 'Oficina', estado: 'Activo' }
    ]);

    // Manejo de Modal
    mostrarModal = false;
    editando = false;
    proveedorActual: Proveedor = this.getEmptyProveedor();

    ngOnInit(): void { }

    getEmptyProveedor(): Proveedor {
        return { id: 0, nombre: '', contacto: '', telefono: '', email: '', categoria: '', estado: 'Activo' };
    }

    abrirModal(p?: Proveedor) {
        if (p) {
            this.editando = true;
            this.proveedorActual = { ...p };
        } else {
            this.editando = false;
            this.proveedorActual = this.getEmptyProveedor();
        }
        this.mostrarModal = true;
    }

    cerrarModal() {
        this.mostrarModal = false;
    }

    guardarProveedor() {
        if (this.editando) {
            this.proveedores.update(list =>
                list.map(p => p.id === this.proveedorActual.id ? this.proveedorActual : p)
            );
        } else {
            const nuevoId = Math.max(...this.proveedores().map(p => p.id), 0) + 1;
            this.proveedores.update(list => [...list, { ...this.proveedorActual, id: nuevoId }]);
        }
        this.cerrarModal();
    }

    eliminarProveedor(id: number) {
        if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
            this.proveedores.update(list => list.filter(p => p.id !== id));
        }
    }

    toggleEstado(p: Proveedor) {
        const nuevoEstado = p.estado === 'Activo' ? 'Inactivo' : 'Activo';
        this.proveedores.update(list =>
            list.map(item => item.id === p.id ? { ...item, estado: nuevoEstado } : item)
        );
    }
}
