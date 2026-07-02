import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Obtenemos el token almacenado en el LocalStorage
    const token = localStorage.getItem('auth_token');

    // Comprobamos si la petición va dirigida hacia nuestro backend (evitando inyectar tokens a otras APIs externas si existieran)
    const isApiUrl = req.url.startsWith('http://localhost/escuela/backend/api');

    if (token && isApiUrl) {
        // Clonamos la petición original para inyectarle el Header Authorization
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        // Pasamos la petición modificada
        return next(authReq);
    }

    // Si no hay token o no va a nuestra API, dejamos que la petición siga normal
    return next(req);
};
