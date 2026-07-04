import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../../../core/services/data.service';

@Component({
    selector: 'app-comentarios-leccion',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './comentarios-leccion.component.html',
    styleUrl: './comentarios-leccion.component.css'
})
export class ComentariosLeccionComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private dataService = inject(DataService);

    cursoId = 0;
    leccionId = 0;
    curso = signal<any>(null);
    leccion = signal<any>(null);
    comentarios = signal<any[]>([]);

    nuevoComentarioTexto = signal<string>('');
    enviando = signal<boolean>(false);
    cargando = signal<boolean>(true);

    ngOnInit(): void {
        this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
        this.leccionId = Number(this.route.snapshot.paramMap.get('leccionId'));
        this.cargarDatos();
    }

    cargarDatos() {
        this.cargando.set(true);
        this.dataService.getCursoById(this.cursoId).subscribe(data => this.curso.set(data));
        this.dataService.getDetalleLeccion(this.leccionId).subscribe(data => {
            this.leccion.set(data);
            this.cargando.set(false);
        });
        this.cargarComentarios();
    }

    cargarComentarios() {
        this.dataService.getComentariosDocente(this.leccionId).subscribe(data => {
            this.comentarios.set(data);
        });
    }

    enviarComentario() {
        const texto = this.nuevoComentarioTexto().trim();
        if (!texto) return;

        this.enviando.set(true);
        this.dataService.agregarComentarioDocente(this.leccionId, texto).subscribe({
            next: () => {
                this.nuevoComentarioTexto.set('');
                this.enviando.set(false);
                this.cargarComentarios();
            },
            error: () => this.enviando.set(false)
        });
    }

    eliminarComentario(id: number) {
        if (confirm('¿Eliminar este comentario permanentemente?')) {
            this.dataService.eliminarComentarioDocente(id).subscribe({
                next: () => this.cargarComentarios()
            });
        }
    }
}