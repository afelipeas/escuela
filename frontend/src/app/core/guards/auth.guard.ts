import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificamos si el usuario tiene una sesión activa válida
    if (authService.isLoggedIn()) {
        return true; // Acceso permitido
    }

    // No está logueado, lo redirigimos al Login protegiendo así la ruta
    return router.parseUrl('/login');
};
