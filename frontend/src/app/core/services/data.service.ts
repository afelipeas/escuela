import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, delay, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private http = inject(HttpClient);
    public apiUrl = environment.apiUrl;

    // Signals globales para sincronización UI
    public puntosFeActuales = signal<number>(0);
    public cartCount = signal<number>(0);

    // Helper: Si ocurre un error de red o de autenticación (401), devolvemos data simulada para no romper la UI
    private fallbackData<T>(mockData: T): (err: any, caught: Observable<T>) => Observable<T> {
        return (error: any) => {
            console.warn('Fallback a datos simulados debido a error en backend:', error.status || error.message);
            return of(mockData);
        };
    }

    // --- TIENDA VIRTUAL ---
    getProductoById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/productos/detalle`, { params: { id } }).pipe(
            map(res => res.datos),
            timeout(15000),
            catchError(this.fallbackData<any>(null))
        );
    }

    getProductos(filtros: any = {}): Observable<any[]> {
        let params: any = {};
        if (filtros.categoria && filtros.categoria !== 'Todos') params.categoria = filtros.categoria;
        if (filtros.min_precio) params.min_precio = filtros.min_precio;
        if (filtros.max_precio) params.max_precio = filtros.max_precio;
        if (filtros.orden) params.orden = filtros.orden;
        if (filtros.admin) params.admin = filtros.admin;
        if (filtros.busqueda) params.busqueda = filtros.busqueda;

        return this.http.get<any>(`${this.apiUrl}/productos`, { params }).pipe(
            map(res => res.datos || []),
            timeout(15000), // Aumentamos a 15s por si el servidor local está lento
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getCarrito(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/carrito`).pipe(
            map(res => res.datos),
            tap(items => this.cartCount.set(items.reduce((acc: number, cur: any) => acc + cur.cantidad, 0))),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    agregarAlCarrito(id_producto: number, cantidad: number = 1): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/carrito/agregar`, { id_producto, cantidad }).pipe(
            tap(() => this.getCarrito().subscribe())
        );
    }

    eliminarDelCarrito(id_producto: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/carrito/eliminar?id_producto=${id_producto}`).pipe(
            tap(() => this.getCarrito().subscribe())
        );
    }

    vaciarCarrito(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/carrito/vaciar`, {}).pipe(
            tap(() => this.cartCount.set(0))
        );
    }

    procesarPedido(datosPedido: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/pedidos/checkout`, datosPedido);
    }

    getPedidos(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/pedidos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getMisPuntos(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/pedidos/puntos`).pipe(
            tap(res => {
                if (res.ok && res.datos?.puntos !== undefined) {
                    this.puntosFeActuales.set(res.datos.puntos);
                }
            }),
            catchError(this.fallbackData<any>({ puntos: 0 }))
        );
    }

    getDetallePedido(id: number): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/pedidos/detalle?id=${id}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    actualizarPedido(id: number, datos: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/pedidos/actualizar?id=${id}`, datos);
    }

    eliminarPedido(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/pedidos/eliminar?id=${id}`);
    }

    enviarSolicitudSoporte(solicitud: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/ayuda/contacto`, solicitud);
    }

    getSupportTicketsVendedor(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ayuda/tickets`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    responderSupportTicket(id_ticket: number, respuesta: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/ayuda/responder`, { id_ticket, respuesta });
    }

    getMisTicketsCliente(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ayuda/mis-tickets`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    // --- ADMINISTRACIÓN ---
    getAdminKPIs(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ventas/resumen-admin`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getTopProductos(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ventas/top-productos`).pipe(
            map(res => res.datos || []),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getEstadisticasVentas(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/ventas/estadisticas`).pipe(
            map(res => res.datos || {}),
            catchError(this.fallbackData<any>({}))
        );
    }

    getUsuariosRecientes(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/usuarios/recientes`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getTodosLosUsuarios(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/usuarios`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    crearUsuario(usuario: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/usuarios`, usuario);
    }

    editarUsuario(usuario: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/usuarios/editar`, usuario);
    }

    eliminarUsuario(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/usuarios/eliminar`, { id });
    }

    getConfiguracion(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/configuracion`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any>({}))
        );
    }

    guardarConfiguracion(config: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/configuracion`, config);
    }

    optimizarBaseDatos(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/configuracion/optimizar`, {});
    }

    getLogs(nivel: string = '', busqueda: string = ''): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/logs?nivel=${nivel}&busqueda=${busqueda}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    limpiarLogs(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/logs/limpiar`, {});
    }

    // --- ALMACÉN ---
    getResumenAlmacen(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/inventario/resumen`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getStockCritico(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/inventario/critico`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getMovimientosRecientes(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/inventario/movimientos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getReporteInventario(fechaInicio: string, fechaFin: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/inventario/reporte?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getReporteCompras(fechaInicio: string, fechaFin: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/ordenes-compra/reporte?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any>(null))
        );
    }

    getProveedores(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/proveedores`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getProductosConStock(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/productos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    crearOrdenCompra(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/ordenes-compra`, data);
    }

    getDetalleOrdenCompra(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/ordenes-compra/detalle?id=${id}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any>(null))
        );
    }

    editarOrdenCompra(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/ordenes-compra/editar`, data);
    }

    eliminarOrdenCompra(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/ordenes-compra/eliminar`, { id });
    }

    crearProducto(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/productos`, data);
    }

    editarProducto(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/productos/editar`, data);
    }

    eliminarProducto(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/productos/eliminar`, { id });
    }

    subirImagenProducto(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('imagen', file);
        return this.http.post<any>(`${this.apiUrl}/productos/subir-imagen`, formData);
    }

    getInventarioCompleto(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/inventario/stock-completo`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    // --- DOCENTE ---
    getResumenDocente(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/clases/resumen-docente`).pipe(
            map(res => res.datos || [
                { titulo: 'Clases Hoy', valor: '3', tendencia: 'Normal', icono: '👨‍🏫', clase: 'kpi-clases' },
                { titulo: 'Estudiantes', valor: '45', tendencia: '+2', icono: '👥', clase: 'kpi-alumnos' }
            ]),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getProximasClases(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/clases`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getAlumnosByDocente(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/clases/mis-alumnos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    crearClase(clase: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/clases`, clase);
    }

    crearCurso(curso: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/cursos`, curso);
    }

    getCursoById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/cursos/detalle?id=${id}`).pipe(
            map(res => res.datos)
        );
    }

    crearLeccion(leccion: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/lecciones`, leccion);
    }

    editarLeccion(leccion: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/lecciones/editar`, leccion);
    }

    eliminarLeccion(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/lecciones/eliminar`, { id });
    }

    subirMaterial(id_leccion: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('material', file);
        formData.append('id_leccion', id_leccion.toString());
        return this.http.post<any>(`${this.apiUrl}/lecciones/subir-material`, formData);
    }

    subirMaterialClase(id_clase: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('material', file);
        formData.append('id_clase', id_clase.toString());
        return this.http.post<any>(`${this.apiUrl}/clases/subir-material`, formData);
    }

    subirMaterialCurso(id_curso: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('material', file);
        formData.append('id_curso', id_curso.toString());
        return this.http.post<any>(`${this.apiUrl}/cursos/subir-material`, formData);
    }

    getComentariosDocente(id_leccion: number): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/comentarios?id_leccion=${id_leccion}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    agregarComentarioDocente(id_leccion: number, texto: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/comentarios`, { id_leccion, texto });
    }

    eliminarComentarioDocente(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/comentarios/eliminar`, { id });
    }

    // --- ESTUDIANTE / AULA ---
    getResumenEstudiante(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/aula/resumen`).pipe(
            tap(res => {
                const kpiPuntos = res.datos?.find((d: any) => d.titulo === 'Mis Puntos Fe');
                if (kpiPuntos) {
                    const valorNum = parseInt(kpiPuntos.valor.toString().replace(/,/g, ''));
                    this.puntosFeActuales.set(valorNum);
                }
            }),
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getClasesEstudiante(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/aula/cursos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    /**
     * Devuelve los IDs de TODOS los cursos en los que el estudiante está inscrito,
     * sin importar si el curso tiene lecciones o no.
     * Usado por "Explorar Cursos" para marcar correctamente el estado del botón.
     */
    getMisInscripcionesIds(): Observable<number[]> {
        return this.http.get<any>(`${this.apiUrl}/aula/mis-inscripciones`).pipe(
            map(res => (res.datos || []).map((id: any) => Number(id))),
            catchError(this.fallbackData<number[]>([]))
        );
    }

    getCursosDisponibles(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/cursos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    inscribirEnCurso(id_curso: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/aula/inscribir`, { id_curso });
    }

    getLeccionesByCurso(id_curso: number): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/aula/lecciones?id_curso=${id_curso}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getComentariosLeccion(id_leccion: number): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/aula/comentarios?id_leccion=${id_leccion}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    postComentarioLeccion(id_leccion: number, texto: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/aula/comentario`, { id_leccion, texto });
    }

    getDetalleLeccion(id_leccion: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/aula/leccion?id_leccion=${id_leccion}`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any>(null))
        );
    }

    completarLeccion(id_leccion: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/aula/completar-leccion`, { id_leccion }).pipe(
            tap(res => {
                if (res.ok && res.datos?.puntos_totales !== undefined) {
                    this.puntosFeActuales.set(res.datos.puntos_totales);
                }
            })
        );
    }

    getLogrosEstudiante(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/logros/mi-progreso`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getProductosConPrecio(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/productos`).pipe(
            map(res => res.datos || []),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getClientes(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/usuarios/clientes`).pipe(
            map(res => res.datos || []),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    crearPedidoManual(datos: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/pedidos/crear`, datos);
    }

    // --- VENDEDOR ---

    getVendedores(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/usuarios?rol=vendedor`).pipe(
            map(res => res.datos || []),
            catchError(this.fallbackData<any[]>([
                { id: 1, nombre: 'Marta Elena Gómez' },
                { id: 2, nombre: 'Carlos Andrés López' },
                { id: 3, nombre: 'Sandra Milena Torres' },
                { id: 4, nombre: 'Julián Esteban Ríos' }
            ]))
        );
    }

    getReporteVentas(fechaInicio: string, fechaFin: string, vendedorId: string = ''): Observable<any> {
        let url = `${this.apiUrl}/ventas/reporte?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        if (vendedorId) url += `&vendedor_id=${vendedorId}`;
        return this.http.get<any>(url).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any>({
                resumen: {
                    totalVentas: '$4,285,000',
                    totalTransacciones: 67,
                    ticketPromedio: '$63,955',
                    comisionesTotales: '$214,250'
                },
                porVendedor: [
                    { nombre: 'Marta Elena Gómez', ventas: 28, total: '$1,820,000', comision: '$91,000', porcentaje: 42 },
                    { nombre: 'Carlos Andrés López', ventas: 19, total: '$1,235,000', comision: '$61,750', porcentaje: 29 },
                    { nombre: 'Sandra Milena Torres', ventas: 12, total: '$780,000', comision: '$39,000', porcentaje: 18 },
                    { nombre: 'Julián Esteban Ríos', ventas: 8, total: '$450,000', comision: '$22,500', porcentaje: 11 }
                ],
                detalle: [
                    { fecha: '2026-05-28', vendedor: 'Marta Elena Gómez', cliente: 'Sofía Martínez', producto: 'Biblia para Niños', monto: '$145,000', estado: 'Completado' },
                    { fecha: '2026-05-28', vendedor: 'Carlos Andrés López', cliente: 'Juan Diego G.', producto: 'Pack Pegatinas', monto: '$89,000', estado: 'Completado' },
                    { fecha: '2026-05-27', vendedor: 'Marta Elena Gómez', cliente: 'Laura Mora', producto: 'Camiseta Blanca', monto: '$210,000', estado: 'Completado' },
                    { fecha: '2026-05-27', vendedor: 'Sandra Milena Torres', cliente: 'Carlos Ruiz', producto: 'Biblia para Niños', monto: '$145,000', estado: 'Completado' },
                    { fecha: '2026-05-26', vendedor: 'Julián Esteban Ríos', cliente: 'Marta Soler', producto: 'Pack Pegatinas', monto: '$89,000', estado: 'Completado' },
                    { fecha: '2026-05-26', vendedor: 'Carlos Andrés López', cliente: 'Felipe Gómez', producto: 'Camiseta Blanca', monto: '$210,000', estado: 'Completado' },
                    { fecha: '2026-05-25', vendedor: 'Marta Elena Gómez', cliente: 'Andrea Suárez', producto: 'Biblia para Niños', monto: '$145,000', estado: 'Completado' },
                    { fecha: '2026-05-25', vendedor: 'Sandra Milena Torres', cliente: 'Miguel Ángel R.', producto: 'Pack Pegatinas', monto: '$89,000', estado: 'Completado' }
                ]
            }))
        );
    }

    getResumenVentas(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ventas/comisiones`).pipe(
            map(res => {
                const total = res.datos?.reduce((acc: number, c: any) => acc + parseFloat(c.monto), 0) || 0;
                return [
                    { titulo: 'Ventas de Hoy', valor: '$0', tendencia: 'Pausa', icono: '📈', clase: 'kpi-ventas' },
                    { titulo: 'Pedidos Nuevos', valor: '0', tendencia: 'Limpio', icono: '🛒', clase: 'kpi-pedidos' },
                    { titulo: 'Comisiones Acum.', valor: '$' + (total).toLocaleString(), tendencia: '+5%', icono: '💎', clase: 'kpi-comisiones' },
                    { titulo: 'Meta Mensual', valor: '10%', tendencia: 'Iniciando', icono: '🎯', clase: 'kpi-meta' }
                ];
            }),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getVentasRecientes(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ventas/recientes`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getMisCursosDocente(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/cursos/mis-cursos`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getCalificacionesDocente(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/cursos/calificaciones`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    getConsultasClientes(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/ventas/consultas`).pipe(
            map(res => res.datos),
            catchError(this.fallbackData<any[]>([]))
        );
    }

    // --- NOTIFICACIONES ---
    getNotificaciones(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/notificaciones`);
    }

    marcarNotificacionLeida(id_notificacion: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/notificaciones/marcar-leida`, { id_notificacion });
    }

    marcarTodasLeidas(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/notificaciones/marcar-todas-leidas`, {});
    }

    enviarNotificacionACurso(id_curso: number, titulo: string, mensaje: string, tipo: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/notificaciones/enviar-a-curso`, { id_curso, titulo, mensaje, tipo });
    }
}
