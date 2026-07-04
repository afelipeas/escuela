import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-cliente-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cliente-dashboard.component.html',
    styleUrl: './cliente-dashboard.component.css'
})
export class ClienteDashboardComponent implements OnInit {
    private authService = inject(AuthService);
    public dataService = inject(DataService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    usuario = this.authService.currentUser;
    pedidos: any[] = [];
    loading = true;

    ngOnInit(): void {
        setTimeout(() => {
            this.cargarPedidos();
            this.cargarPuntos();
        }, 150);
    }

    cargarPuntos(): void {
        this.dataService.getMisPuntos().subscribe({
            next: () => this.cdr.detectChanges()
        });
    }

    canjearPuntos(): void {
        this.router.navigate(['/tienda/catalogo']);
    }

    cargarPedidos(): void {
        this.loading = true;
        this.dataService.getPedidos().subscribe({
            next: (data) => {
                this.pedidos = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getEstadoClass(estado: string): string {
        const e = estado.toLowerCase();
        if (e === 'entregado') return 'bg-success';
        if (e === 'en_camino' || e === 'en camino') return 'bg-info';
        if (e === 'pagado') return 'bg-primary';
        if (e === 'cancelado') return 'bg-danger';
        return 'bg-warning';
    }
}
