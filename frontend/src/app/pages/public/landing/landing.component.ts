import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

    // Estado del menú hamburguesa (móvil)
    menuAbierto = false;

    // Estado de la barra de navegación al hacer scroll
    barraScrolleada = false;

    // Observadores para limpiar al destruir el componente
    private observadorEntrada: IntersectionObserver | null = null;
    private observadoresContadores: IntersectionObserver[] = [];

    // Datos de estadísticas
    estadisticas = [
        { objetivo: 500, sufijo: '+', etiqueta: 'Estudiantes Activos' },
        { objetivo: 20, sufijo: '+', etiqueta: 'Docentes' },
        { objetivo: 150, sufijo: '+', etiqueta: 'Clases Disponibles' },
        { objetivo: 200, sufijo: '+', etiqueta: 'Productos en Tienda' }
    ];

    // Datos de características
    caracteristicas = [
        { icono: '📱', titulo: 'Diseño Responsivo', descripcion: 'Accede desde tu celular, tablet o computadora con la mejor experiencia visual.' },
        { icono: '🔒', titulo: '100% Seguro', descripcion: 'Plataforma protegida con HTTPS, contraseñas cifradas y acceso controlado por roles.' },
        { icono: '⚡', titulo: 'Rápido y Confiable', descripcion: 'Carga en menos de 3 segundos y soporta hasta 500 usuarios simultáneos.' },
        { icono: '🌍', titulo: 'Acceso desde Cualquier Lugar', descripcion: 'No importa dónde estés, puedes conectarte a la escuela dominical virtual.' },
        { icono: '👨‍👩‍👧‍👦', titulo: 'Para Toda la Familia', descripcion: 'Roles para estudiantes, padres, docentes y administradores en un solo sistema.' },
        { icono: '✝️', titulo: 'Valores Cristianos', descripcion: 'Contenido basado en la fe, diseñado para el crecimiento espiritual de los niños.' }
    ];

    // Escucha el evento scroll para activar la barra de nav
    @HostListener('window:scroll', [])
    alScrollear(): void {
        this.barraScrolleada = window.scrollY > 60;
    }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            this.inicializarAnimacionesEntrada();
            this.inicializarContadores();
        }, 100);
    }

    /** Abre o cierra el menú en versión móvil */
    alternarMenu(): void {
        this.menuAbierto = !this.menuAbierto;
    }

    /** Cierra el menú al hacer click en un enlace */
    cerrarMenu(): void {
        this.menuAbierto = false;
    }

    /** Configura el observador de intersección para las animaciones de entrada */
    private inicializarAnimacionesEntrada(): void {
        this.observadorEntrada = new IntersectionObserver(
            (entradas) => {
                entradas.forEach(entrada => {
                    if (entrada.isIntersecting) {
                        entrada.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        const elementosAnimados = document.querySelectorAll('.animar-entrada');
        elementosAnimados.forEach(el => this.observadorEntrada!.observe(el));
    }

    /** Configura los contadores animados en la sección de estadísticas */
    private inicializarContadores(): void {
        const contadores = document.querySelectorAll<HTMLElement>('.contador-numero');

        contadores.forEach(elemento => {
            const observador = new IntersectionObserver(
                (entradas) => {
                    entradas.forEach(entrada => {
                        if (entrada.isIntersecting) {
                            const objetivo = parseInt(elemento.dataset['objetivo'] || '0');
                            this.ejecutarAnimacionContador(elemento, objetivo);
                            observador.disconnect();
                        }
                    });
                },
                { threshold: 0.5 }
            );

            observador.observe(elemento);
            this.observadoresContadores.push(observador);
        });
    }

    /** Anima un elemento contador desde 0 hasta su valor objetivo */
    private ejecutarAnimacionContador(elemento: HTMLElement, objetivo: number): void {
        const duracionMs = 2000;
        const cantidadPasos = 60;
        const incremento = objetivo / cantidadPasos;
        const intervaloMs = duracionMs / cantidadPasos;
        let valorActual = 0;

        const temporizador = setInterval(() => {
            valorActual += incremento;
            if (valorActual >= objetivo) {
                valorActual = objetivo;
                clearInterval(temporizador);
            }
            elemento.textContent = Math.floor(valorActual).toLocaleString('es-CO');
        }, intervaloMs);
    }

    ngOnDestroy(): void {
        // Limpiamos los observadores al destruir el componente
        this.observadorEntrada?.disconnect();
        this.observadoresContadores.forEach(obs => obs.disconnect());
    }
}
