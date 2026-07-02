import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-soporte-vendedor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './soporte-vendedor.component.html',
    styleUrl: './soporte-vendedor.component.css'
})
export class SoporteVendedorComponent implements OnInit {
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    // Listado de tickets
    tickets: any[] = [];
    filtroEstado = 'Todos';

    // Detalle y respuesta
    activeTicket: any = null;
    respuestaTexto = '';

    // Estados
    cargando = false;
    enviandoRespuesta = false;
    mensajeExito = '';
    mensajeError = '';

    ngOnInit(): void {
        this.cargando = true;
        // Retardar sutilmente para asegurar token de sesión
        setTimeout(() => {
            this.cargarTickets();
        }, 150);
    }

    cargarTickets(): void {
        this.dataService.getSupportTicketsVendedor().subscribe({
            next: (data) => {
                this.tickets = data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    get ticketsFiltrados(): any[] {
        if (this.filtroEstado === 'Todos') {
            return this.tickets;
        }
        return this.tickets.filter(t => t.estado === this.filtroEstado);
    }

    get totalPendientes(): number {
        return this.tickets.filter(t => t.estado === 'Pendiente').length;
    }

    get totalResueltos(): number {
        return this.tickets.filter(t => t.estado === 'Resuelto').length;
    }

    selectTicket(ticket: any): void {
        this.activeTicket = ticket;
        this.respuestaTexto = '';
        this.mensajeExito = '';
        this.mensajeError = '';
    }

    closeModal(): void {
        this.activeTicket = null;
    }

    enviarRespuesta(): void {
        if (!this.respuestaTexto.trim()) {
            this.mensajeError = 'Por favor, escribe una respuesta antes de enviar.';
            return;
        }

        this.enviandoRespuesta = true;
        this.mensajeExito = '';
        this.mensajeError = '';

        this.dataService.responderSupportTicket(this.activeTicket.id, this.respuestaTexto).subscribe({
            next: (res) => {
                this.enviandoRespuesta = false;
                this.mensajeExito = res.mensaje || 'Respuesta registrada con éxito.';
                
                // Actualizar localmente el estado del ticket
                this.activeTicket.estado = 'Resuelto';
                const ticketOriginal = this.tickets.find(t => t.id === this.activeTicket.id);
                if (ticketOriginal) {
                    ticketOriginal.estado = 'Resuelto';
                }

                this.respuestaTexto = '';
                this.cdr.detectChanges();

                // Recargar listado en segundo plano después de un breve delay
                setTimeout(() => {
                    this.cargarTickets();
                }, 1500);
            },
            error: (err) => {
                this.enviandoRespuesta = false;
                this.mensajeError = err.error?.mensaje || 'Error al guardar la respuesta.';
                this.cdr.detectChanges();
            }
        });
    }

    marcarResueltoDirecto(ticket: any, event: Event): void {
        event.stopPropagation(); // Evitar que abra el modal
        
        this.dataService.responderSupportTicket(ticket.id, 'Ticket marcado como resuelto de forma directa por el vendedor de soporte. No se requirió comentario adicional.').subscribe({
            next: () => {
                ticket.estado = 'Resuelto';
                this.cargarTickets();
            }
        });
    }
}
