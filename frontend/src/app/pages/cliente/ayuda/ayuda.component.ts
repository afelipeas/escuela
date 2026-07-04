import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';

@Component({
    selector: 'app-cliente-ayuda',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ayuda.component.html',
    styleUrl: './ayuda.component.css'
})
export class AyudaComponent implements OnInit {
    private dataService = inject(DataService);
    private cdr = inject(ChangeDetectorRef);

    // Formulario de Soporte
    categoria = '';
    asunto = '';
    mensaje = '';

    // Estados de envío
    enviando = false;
    mensajeExito = '';
    mensajeError = '';

    // Tickets del cliente
    tickets: any[] = [];
    cargandoTickets = false;

    // FAQs Acordeón
    activeFaqIndex: number | null = null;

    faqs = [
        {
            pregunta: '💎 ¿Qué son los Puntos Fe y cómo los obtengo?',
            respuesta: 'Los Puntos Fe son recompensas exclusivas que se otorgan automáticamente al asistir a tus clases programadas, completar lecciones en los módulos académicos de tus cursos inscritos y participar en actividades. ¡Úsalos para canjear fabulosos premios directamente en la Tienda Virtual!'
        },
        {
            pregunta: '📦 ¿Cuánto tiempo tarda en entregarse un pedido o canje?',
            respuesta: 'Todos los pedidos de canje se procesan y empaquetan en un plazo de 24 a 48 horas hábiles. El despacho mediante correo nacional certificado demora entre 3 y 5 días hábiles, dependiendo del destino geográfico y cobertura.'
        },
        {
            pregunta: '🚚 ¿Cómo puedo rastrear mis pedidos activos?',
            respuesta: 'Es muy fácil. Dirígete a la opción "Mis Pedidos" en tu menú lateral izquierdo. Verás tarjetas organizadas con el detalle de cada compra y un botón interactivo que te mostrará una barra de progreso paso a paso de tu envío en tiempo real.'
        },
        {
            pregunta: '🎓 ¿Cómo me inscribo a nuevos cursos académicos?',
            respuesta: 'Ve a la opción "Cursos" o "Explorar" en el menú, selecciona el taller de tu preferencia, y haz clic en el botón de inscripción. Una vez confirmado, aparecerá inmediatamente en tu panel académico para que empieces a ver las lecciones.'
        },
        {
            pregunta: '🔒 ¿Cómo puedo reportar un error en mis calificaciones o puntos?',
            respuesta: 'Completa el formulario de soporte que se encuentra a continuación en esta misma sección, selecciona la categoría correspondiente ("Problema con Calificaciones" o "Problema con Puntos") y describe detalladamente tu caso. Nuestro equipo técnico auditará la bitácora y lo resolverá en menos de 24 horas.'
        }
    ];

    toggleFaq(index: number): void {
        this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
    }

    ngOnInit(): void {
        this.cargarTickets();
    }

    cargarTickets(): void {
        this.cargandoTickets = true;
        this.dataService.getMisTicketsCliente().subscribe({
            next: (data) => {
                this.tickets = data;
                this.cargandoTickets = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargandoTickets = false;
                this.cdr.detectChanges();
            }
        });
    }

    enviarFormulario(): void {
        if (!this.categoria || !this.asunto || !this.mensaje) {
            this.mensajeError = 'Por favor, completa todos los campos del formulario antes de enviar.';
            this.mensajeExito = '';
            return;
        }

        this.enviando = true;
        this.mensajeError = '';
        this.mensajeExito = '';

        const solicitud = {
            categoria: this.categoria,
            asunto: this.asunto,
            mensaje: this.mensaje
        };

        this.dataService.enviarSolicitudSoporte(solicitud).subscribe({
            next: (res) => {
                this.enviando = false;
                this.mensajeExito = res.mensaje || '¡Solicitud enviada con éxito!';
                // Limpiar formulario
                this.categoria = '';
                this.asunto = '';
                this.mensaje = '';
                this.cargarTickets();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.enviando = false;
                this.mensajeError = err.error?.mensaje || 'Ocurrió un error al enviar tu solicitud. Intenta nuevamente.';
                this.cdr.detectChanges();
            }
        });
    }
}
