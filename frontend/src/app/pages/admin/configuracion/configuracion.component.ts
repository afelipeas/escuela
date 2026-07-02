import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-admin-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configuracion.component.html',
    styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    // Estado local
    cargando = false;
    cargandoOpt = false;
    mensajeExito = '';
    mensajeError = '';
    toastMsg = '';
    tabActiva = 'general'; // general | puntos | toggles | herramientas

    // Datos del sistema
    config = {
        general: {
            nombre_plataforma: '',
            lema: '',
            periodo_activo: '',
            email_contacto: ''
        },
        puntos: {
            puntos_leccion: 50,
            puntos_curso: 200,
            puntos_asistencia: 20
        },
        toggles: {
            tienda_activa: true,
            notificaciones_activas: true,
            comentarios_lecciones: true,
            registro_abierto: true
        }
    };

    // Resultados de la optimización de Base de Datos
    tablasOptimizadas: any[] = [];

    ngOnInit(): void {
        this.cargarConfiguracion();
    }

    cargarConfiguracion(): void {
        this.cargando = true;
        this.dataService.getConfiguracion().subscribe({
            next: (data) => {
                if (data && data.general) {
                    this.config = data;
                }
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargando = false;
                this.mensajeError = 'Error al cargar la configuración del sistema.';
                this.cdr.detectChanges();
            }
        });
    }

    cambiarTab(tab: string): void {
        this.tabActiva = tab;
        this.mensajeError = '';
        this.mensajeExito = '';
        this.tablasOptimizadas = [];
    }

    guardar(): void {
        this.mensajeError = '';
        this.mensajeExito = '';
        this.cargando = true;

        this.dataService.guardarConfiguracion(this.config).subscribe({
            next: (res) => {
                this.cargando = false;
                if (res.ok) {
                    this.toastMsg = 'Configuración guardada exitosamente';
                    setTimeout(() => this.toastMsg = '', 3000);
                } else {
                    this.mensajeError = res.mensaje || 'Error al guardar la configuración.';
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.cargando = false;
                this.mensajeError = err.error?.mensaje || 'Error de conexión al guardar configuración.';
                this.cdr.detectChanges();
            }
        });
    }

    optimizarDB(): void {
        this.mensajeError = '';
        this.mensajeExito = '';
        this.cargandoOpt = true;
        this.tablasOptimizadas = [];

        this.dataService.optimizarBaseDatos().subscribe({
            next: (res) => {
                this.cargandoOpt = false;
                if (res.ok) {
                    this.toastMsg = 'Base de datos optimizada exitosamente';
                    setTimeout(() => this.toastMsg = '', 3000);
                    this.tablasOptimizadas = res.datos || [];
                } else {
                    this.mensajeError = res.mensaje || 'Error durante la optimización.';
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.cargandoOpt = false;
                this.mensajeError = err.error?.mensaje || 'Error al optimizar la base de datos.';
                this.cdr.detectChanges();
            }
        });
    }
}
