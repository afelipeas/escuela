import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // ─── CRÍTICO: Sin zone.js instalado, ESTE provider es el que le dice
    // a Angular cómo y cuándo re-renderizar. Con provideZoneChangeDetection
    // (el que teníamos) Angular esperaba zone.js que no existe, por eso
    // solo re-renderizaba cuando el usuario hacía clic (evento del browser).
    // provideZonelessChangeDetection() es el API correcto para Angular 21
    // sin zone.js: programa re-renders basados en señales/signals.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
