import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-aula-leccion',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './leccion.component.html',
    styleUrl: './leccion.component.css'
})
export class AulaLeccionComponent implements OnInit, OnDestroy {

    private route = inject(ActivatedRoute);
    public dataService = inject(DataService);
    public authService = inject(AuthService);
    private sanitizer = inject(DomSanitizer);

    // Estado usando Signals
    leccion = signal<any>({
        id: 0,
        titulo: 'Cargando...',
        materia: 'Cargando...',
        descripcion: '',
        video_url: '',
        duracion_min: 15,
        completada: false
    });

    materiales = signal<any[]>([]);
    leccionesMismoCurso = signal<any[]>([]);
    comentarios = signal<any[]>([]);

    nuevoComentario = signal<string>('');
    enviandoComentario = signal<boolean>(false);

    // Control de tiempo mínimo para completar
    videoTerminado = signal<boolean>(false);
    tiempoVisualizando = signal<number>(0);
    tiempoMinimo = signal<number>(0);
    private timerInterval: any = null;

    // URL segura del video
    safeVideoUrl = computed(() => {
        const url = this.leccion().video_url;
        if (!url) return null;
        return this.sanitizer.bypassSecurityTrustResourceUrl(this.convertirUrlYouTube(url));
    });

    private convertirUrlYouTube(url: string): string {
        if (!url) return url;
        // youtube.com/watch?v=XXXXX
        const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        // youtu.be/XXXXX
        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        // youtube.com/embed/XXXXX (ya está en formato embed)
        const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
        if (embedMatch) return url;
        // youtube.com/shorts/XXXXX
        const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        return url;
    }

    ngOnInit(): void {
        this.route.params.subscribe((params: any) => {
            const id = params['id'];
            if (id) {
                this.detenerTimer();
                this.videoTerminado.set(false);
                this.tiempoVisualizando.set(0);
                this.cargarDatos(id);
            }
        });
    }

    ngOnDestroy(): void {
        this.detenerTimer();
    }

    cargarDatos(id: number): void {
        this.dataService.getDetalleLeccion(id).subscribe((data: any) => {
            if (data) {
                const leccionConBooleano = {
                    ...data,
                    completada: !!data.completada
                };
                this.leccion.set(leccionConBooleano);
                this.materiales.set(data.materiales || []);

                // Calcular tiempo mínimo (70% de la duración en segundos)
                const duracionSeg = (data.duracion_min || 15) * 60;
                this.tiempoMinimo.set(Math.floor(duracionSeg * 0.7));

                this.dataService.getLeccionesByCurso(data.id_curso).subscribe((list: any) => {
                    this.leccionesMismoCurso.set(list);
                });

                this.cargarComentarios(id);

                // Iniciar timer si la lección no está completada
                if (!leccionConBooleano.completada && data.video_url) {
                    this.iniciarTimer();
                }
            }
        });
    }

    private iniciarTimer(): void {
        this.detenerTimer();
        this.timerInterval = setInterval(() => {
            this.tiempoVisualizando.update(t => t + 1);
            if (this.tiempoVisualizando() >= this.tiempoMinimo()) {
                this.videoTerminado.set(true);
                this.detenerTimer();
            }
        }, 1000);
    }

    private detenerTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    get tiempoRestante(): number {
        return Math.max(0, this.tiempoMinimo() - this.tiempoVisualizando());
    }

    get progresoVideo(): number {
        if (this.tiempoMinimo() === 0) return 0;
        return Math.min(100, Math.floor((this.tiempoVisualizando() / this.tiempoMinimo()) * 100));
    }

    formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    cargarComentarios(id_leccion: number): void {
        this.dataService.getComentariosLeccion(id_leccion).subscribe(list => {
            this.comentarios.set(list);
        });
    }

    enviarComentario(): void {
        const texto = this.nuevoComentario().trim();
        if (!texto) return;

        this.enviandoComentario.set(true);
        this.dataService.postComentarioLeccion(this.leccion().id, texto).subscribe({
            next: () => {
                this.nuevoComentario.set('');
                this.enviandoComentario.set(false);
                this.cargarComentarios(this.leccion().id);
            },
            error: (err) => {
                alert('No se pudo publicar el comentario: ' + (err.error?.mensaje || 'Error desconocido'));
                this.enviandoComentario.set(false);
            }
        });
    }

    marcarComoCompletada(): void {
        if (this.leccion().completada) return;
        if (!this.videoTerminado()) return;

        this.dataService.completarLeccion(this.leccion().id).subscribe({
            next: (res: any) => {
                this.leccion.update(prev => ({ ...prev, completada: true }));
                this.detenerTimer();
                alert(res.mensaje || '¡Felicidades! Has completado esta lección. 💎');
            },
            error: (err) => {
                const msg = err.error?.mensaje || 'Error desconocido al guardar el progreso.';
                alert('No se pudo finalizar la lección: ' + msg);
            }
        });
    }
}
