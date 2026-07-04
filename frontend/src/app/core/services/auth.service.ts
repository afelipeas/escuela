import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'docente' | 'estudiante' | 'vendedor' | 'almacen' | 'cliente' | 'public';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/auth`;

    // Signal reactivo para reflejar el estado actual del usuario logueado
    currentUser = signal<{ id?: number, nombre: string, email?: string, rol: UserRole, foto: string } | null>(null);

    constructor() {
        // Al arrancar la pestaña, verificamos si existe una sesión previa no caducada en LocalStorage
        const perfilGuardado = localStorage.getItem('perfil_usuario');
        if (perfilGuardado) {
            try {
                this.currentUser.set(JSON.parse(perfilGuardado));
            } catch (error) {
                this.logout();
            }
        }
    }

    /**
     * Inicia sesión enviando las credenciales al Servidor PHP.
     */
    login(email: string, contrasena: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, { email, password: contrasena }).pipe(
            tap(res => {
                if (res.ok && res.datos && res.datos.token) {
                    // 1. Guardar el Token de Seguridad JWT (El Interceptor lo usará de ahora en adelante)
                    localStorage.setItem('auth_token', res.datos.token);

                    // 2. Construir el objeto local de usuario que alimentará las UI y Navbars
                    const perfilUsuario = {
                        id: res.datos.usuario.id,
                        nombre: res.datos.usuario.nombre,
                        email: res.datos.usuario.email,
                        rol: res.datos.usuario.rol as UserRole,
                        foto: '👤'
                    };

                    // 3. Persistir en texto dentro del navegador para evitar cerrojazos con F5
                    localStorage.setItem('perfil_usuario', JSON.stringify(perfilUsuario));

                    // 4. Notificar a componentes reactivos
                    this.currentUser.set(perfilUsuario);
                }
            }),
            catchError((err: HttpErrorResponse) => {
                // Atrapamos el error HTTP (como 401) y lo convertimos en un objeto para el NEXT bloque
                return of({ ok: false, status: err.status, error: err });
            })
        );
    }

    /**
     * Registra un nuevo usuario en el Servidor PHP.
     */
    register(datos: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/registro`, datos).pipe(
            catchError((err: HttpErrorResponse) => {
                return of({ ok: false, status: err.status, error: err });
            })
        );
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('perfil_usuario');
        this.currentUser.set(null);
    }

    isLoggedIn() {
        return this.currentUser() !== null;
    }

    getDashboardRoute(): string {
        const rol = this.currentUser()?.rol;
        switch (rol) {
            case 'admin': return '/admin/dashboard';
            case 'docente': return '/docente/dashboard';
            case 'estudiante': return '/estudiante/dashboard';
            case 'vendedor': return '/vendedor/dashboard';
            case 'almacen': return '/almacen/dashboard';
            case 'cliente': return '/cliente/dashboard';
            default: return '/';
        }
    }
}

