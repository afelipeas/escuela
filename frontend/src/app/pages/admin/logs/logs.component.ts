import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-admin-logs',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './logs.component.html',
    styleUrl: './logs.component.css'
})
export class LogsComponent implements OnInit {
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    logs: any[] = [];
    cargando = false;
    nivelSeleccionado = '';
    busqueda = '';
    toastMsg = '';
    toastError = '';

    // Detalle de un Log seleccionado para el Modal
    logSeleccionado: any = null;
    mostrarModal = false;

    private busquedaTimer: any;

    niveles = [
        { valor: '', etiqueta: 'Todos los Niveles' },
        { valor: 'INFO', etiqueta: 'ℹ️ Información (INFO)' },
        { valor: 'ADVERTENCIA', etiqueta: '⚠️ Advertencia (WARNING)' },
        { valor: 'ERROR', etiqueta: '🚨 Error (ERROR)' },
        { valor: 'SEGURIDAD', etiqueta: '🛡️ Seguridad (SECURITY)' }
    ];

    ngOnInit(): void {
        this.cargarLogs();
    }

    cargarLogs(): void {
        this.cargando = true;
        this.dataService.getLogs(this.nivelSeleccionado, this.busqueda).subscribe({
            next: (data) => {
                this.logs = data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    onBusqueda(): void {
        clearTimeout(this.busquedaTimer);
        this.busquedaTimer = setTimeout(() => this.cargarLogs(), 400);
    }

    filtrar(): void {
        this.cargarLogs();
    }

    limpiarLogs(): void {
        if (confirm('🚨 ¡ATENCIÓN! ¿Estás seguro de que deseas vaciar permanentemente toda la bitácora de logs? Esta acción borrará el historial de auditoría del servidor.')) {
            this.cargando = true;
            this.dataService.limpiarLogs().subscribe({
                next: (res) => {
                    this.cargando = false;
                    if (res.ok) {
                        this.toastMsg = 'Bitácora limpiada exitosamente';
                        setTimeout(() => this.toastMsg = '', 3000);
                        this.cargarLogs();
                    } else {
                        this.toastError = res.mensaje || 'Error al vaciar logs.';
                        setTimeout(() => this.toastError = '', 3000);
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.cargando = false;
                    this.toastError = err.error?.mensaje || 'Error de conexión.';
                    setTimeout(() => this.toastError = '', 3000);
                    this.cdr.detectChanges();
                }
            });
        }
    }

    abrirDetalles(log: any): void {
        this.logSeleccionado = log;
        this.mostrarModal = true;
    }

    cerrarModal(): void {
        this.logSeleccionado = null;
        this.mostrarModal = false;
    }

    exportarLogs(): void {
        if (this.logs.length === 0) {
            this.toastError = 'No hay logs para exportar';
            setTimeout(() => this.toastError = '', 3000);
            return;
        }

        const cabecera = ['Fecha', 'Nivel', 'Usuario', 'IP', 'Acción', 'Detalles'].join(',');
        const filas = this.logs.map(l =>
            [l.fecha, l.nivel, l.usuario, l.ip, `"${(l.accion || '').replace(/"/g, '""')}"`, `"${(l.detalles || '').replace(/"/g, '""')}"`].join(',')
        );
        const csv = [cabecera, ...filas].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fechaStr = new Date().toISOString().slice(0, 10);
        a.download = `auditoria_sistema_${fechaStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
