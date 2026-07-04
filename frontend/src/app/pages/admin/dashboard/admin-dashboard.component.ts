import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    usuarioAdmin = this.authService.currentUser;

    // Datos Reactivos
    kpis: any[] = [];
    ventasRecientes: any[] = [];
    usuariosNuevos: any[] = [];
    fechaActual = '';

    ngOnInit(): void {
        // Obtener fecha actual en español
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const hoy = new Date();
        const dia = hoy.getDate();
        const mes = meses[hoy.getMonth()];
        const anio = hoy.getFullYear();
        this.fechaActual = `${dia} de ${mes}, ${anio}`;

        // Retardar sutilmente la petición para asegurar la persistencia del Token en el Interceptor
        setTimeout(() => {
            this.cargarDatos();
        }, 150);
    }

    cargarDatos(): void {
        this.dataService.getAdminKPIs().subscribe(data => {
            this.kpis = data;
            this.cdr.detectChanges();
        });
        this.dataService.getVentasRecientes().subscribe(data => {
            this.ventasRecientes = data;
            this.cdr.detectChanges();
        });
        this.dataService.getUsuariosRecientes().subscribe(data => {
            this.usuariosNuevos = data;
            this.cdr.detectChanges();
        });
    }
}
