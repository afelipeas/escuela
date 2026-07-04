# AGENTS.md — Escuela Dominical Virtual

## Stack

- **Frontend**: Angular 21, Bootstrap 5, TypeScript (strict), Vitest
- **Backend**: Vanilla PHP (no framework, no Composer), PDO/MySQL
- **Auth**: JWT (manual implementation, 24h expiry)
- **Deploy**: Vercel (frontend SPA), PHP on infinityfree.io (backend)

## Quick commands

```bash
# Frontend
cd frontend && npm install
ng serve                    # dev server on localhost:4200
ng build --configuration production   # production build
ng test                     # run unit tests (vitest)

# Backend
# No build step. Serve via Apache+PHP with mod_rewrite enabled.
# Requires MySQL database 'escuela_dominical_db' (root, no password — XAMPP default).

# Seed test data (destructive — truncates transactional tables)
php backend/seed_all.php

# Import schema
# Import backend/escuela_dominical_db.sql (at repo root) into MySQL
```

## Architecture

### Backend routing (no framework)

The backend has a **hand-rolled router** at `backend/app/Routes/api.php`. It splits the URI by `/`, extracts `modulo` and `accion` from path segments, then dispatches via a `switch` statement. There is no route registration file or annotation — to add a route, add a `case` block. The third path segment is treated as an integer ID.

All API responses follow this envelope:
```json
{ "ok": true, "datos": {...}, "mensaje": "..." }
```

### Backend autoloader (no Composer)

`backend/index.php` registers a manual PSR-4-style autoloader. Namespaces `App\` map to `backend/app/` and `Config\` to `backend/config/`. If you add a new class, place it in the correct directory matching its namespace — no `composer dump-autoload` needed.

### Frontend API URLs are hardcoded

Both `auth.service.ts` and `data.service.ts` hardcode `http://localhost/escuela/backend/api` — they do NOT use the `environment.apiUrl` from `environments/`. When changing the backend URL, update these files directly. The production environment file (`environment.prod.ts`) points to `https://escueladominical.infinityfree.io/backend/api` but is only swapped in during `ng build --configuration production`.

### Angular zoneless mode

This project uses Angular 21 **without zone.js**. The app config in `frontend/src/app/app.config.ts` uses `provideZonelessChangeDetection()`. This means change detection runs on signals/signal updates, not on browser events. If UI doesn't update after a state change, ensure you're using Angular signals (`signal()`, `computed()`) — traditional mutable properties won't trigger re-renders.

### Role-based UI structure

Routes and pages are organized by user role under `frontend/src/app/pages/`:
- `public/` — login, registro, tienda, perfil (no sidebar)
- `admin/` — dashboard, ventas, usuarios, configuracion, logs, productos, compras
- `docente/` — dashboard, crear-clase, cursos, alumnos, calendario, calificaciones
- `estudiante/` — dashboard, logros, explorar-cursos, calificaciones, calendario
- `vendedor/` — dashboard, nueva-venta, reportes, soporte
- `almacen/` — dashboard, compras, proveedores, reportes
- `cliente/` — dashboard, pedidos, ayuda

Protected routes use `MainLayoutComponent` (sidebar). The `authGuard` redirects unauthenticated users to `/login`.

Roles are defined as a union type: `'admin' | 'docente' | 'estudiante' | 'vendedor' | 'almacen' | 'cliente' | 'public'`.

### Database

MySQL database `escuela_dominical_db`. Connection configured in `backend/config/app.php` (hardcoded constants). The `Database.php` class is a PDO singleton. Default credentials: `root` with empty password.

### Vercel deployment

Root `vercel.json` runs `cd frontend && ng build --configuration production` and serves from `frontend/dist/frontend`. SPA fallback rewrites all routes to `index.html`.

## Conventions

- **Language**: All code, comments, variable names, and UI text are in **Spanish**.
- **Indentation**: 2 spaces (see `.editorconfig`).
- **Component structure**: Each Angular component has separate `.ts`, `.html`, `.css` files (no inline templates/styles).
- **Prettier config** (in `package.json`): 100 char print width, single quotes, Angular HTML parser.
- **No ESLint** configured — rely on TypeScript strict mode and `angularCompilerOptions` strict templates.
- **No CI/CD pipeline** — no GitHub Actions or similar.
- **PHP middleware**: `backend/app/Middleware/AuthMiddleware.php` and `RoleMiddleware.php` exist but routing applies them manually in the switch blocks (not automatically).

## Gotchas

- `.gitignore` excludes `*.md` and `AGENTS.md` — this file won't be tracked by git unless you remove those rules.
- The backend has no `vendor/` directory or Composer — all PHP dependencies are handwritten (JWT helper, Validator, Paginator, Response).
- `scratch_*.php`, `test*.php`, `debug*.php` are gitignored — use these for local experimentation.
- The `escuela_dominical_db.sql` schema file is at the repo root (not inside `backend/`), despite being a backend concern.
