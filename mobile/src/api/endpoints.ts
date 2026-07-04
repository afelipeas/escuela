import apiClient from './client';

// ============ AUTH ============
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  registro: (datos: any) =>
    apiClient.post('/auth/registro', datos),
};

// ============ USUARIOS ============
export const usuariosAPI = {
  getAll: (rol?: string) =>
    apiClient.get('/usuarios', { params: rol ? { rol } : {} }),
  getRecientes: () =>
    apiClient.get('/usuarios/recientes'),
  getClientes: () =>
    apiClient.get('/usuarios/clientes'),
  create: (usuario: any) =>
    apiClient.post('/usuarios', usuario),
  update: (usuario: any) =>
    apiClient.post('/usuarios/editar', usuario),
  delete: (id: number) =>
    apiClient.post('/usuarios/eliminar', { id }),
};

// ============ CURSOS ============
export const cursosAPI = {
  getAll: () =>
    apiClient.get('/cursos'),
  getById: (id: number) =>
    apiClient.get('/cursos/detalle', { params: { id } }),
  getMisCursos: () =>
    apiClient.get('/cursos/mis-cursos'),
  getCalificaciones: () =>
    apiClient.get('/cursos/calificaciones'),
  create: (curso: any) =>
    apiClient.post('/cursos', curso),
  subirMaterial: (id_curso: number, formData: FormData) =>
    apiClient.post('/cursos/subir-material', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============ LECCIONES ============
export const leccionesAPI = {
  create: (leccion: any) =>
    apiClient.post('/lecciones', leccion),
  update: (leccion: any) =>
    apiClient.post('/lecciones/editar', leccion),
  delete: (id: number) =>
    apiClient.post('/lecciones/eliminar', { id }),
  subirMaterial: (id_leccion: number, formData: FormData) =>
    apiClient.post('/lecciones/subir-material', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============ CLASES ============
export const clasesAPI = {
  getAll: () =>
    apiClient.get('/clases'),
  getResumenDocente: () =>
    apiClient.get('/clases/resumen-docente'),
  getMisAlumnos: () =>
    apiClient.get('/clases/mis-alumnos'),
  create: (clase: any) =>
    apiClient.post('/clases', clase),
  subirMaterial: (id_clase: number, formData: FormData) =>
    apiClient.post('/clases/subir-material', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============ AULA ============
export const aulaAPI = {
  getResumen: () =>
    apiClient.get('/aula/resumen'),
  getCursos: () =>
    apiClient.get('/aula/cursos'),
  getMisInscripciones: () =>
    apiClient.get('/aula/mis-inscripciones'),
  inscribir: (id_curso: number) =>
    apiClient.post('/aula/inscribir', { id_curso }),
  getLecciones: (id_curso: number) =>
    apiClient.get('/aula/lecciones', { params: { id_curso } }),
  getDetalleLeccion: (id_leccion: number) =>
    apiClient.get('/aula/leccion', { params: { id_leccion } }),
  completarLeccion: (id_leccion: number) =>
    apiClient.post('/aula/completar-leccion', { id_leccion }),
  getComentarios: (id_leccion: number) =>
    apiClient.get('/aula/comentarios', { params: { id_leccion } }),
  postComentario: (id_leccion: number, texto: string) =>
    apiClient.post('/aula/comentario', { id_leccion, texto }),
};

// ============ PRODUCTOS ============
export const productosAPI = {
  getAll: (filtros: any = {}) =>
    apiClient.get('/productos', { params: filtros }),
  getById: (id: number) =>
    apiClient.get('/productos/detalle', { params: { id } }),
  create: (producto: any) =>
    apiClient.post('/productos', producto),
  update: (producto: any) =>
    apiClient.post('/productos/editar', producto),
  delete: (id: number) =>
    apiClient.post('/productos/eliminar', { id }),
  subirImagen: (formData: FormData) =>
    apiClient.post('/productos/subir-imagen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============ CARRITO ============
export const carritoAPI = {
  get: () =>
    apiClient.get('/carrito'),
  agregar: (id_producto: number, cantidad: number = 1) =>
    apiClient.post('/carrito/agregar', { id_producto, cantidad }),
  eliminar: (id_producto: number) =>
    apiClient.delete('/carrito/eliminar', { params: { id_producto } }),
  vaciar: () =>
    apiClient.post('/carrito/vaciar', {}),
};

// ============ PEDIDOS ============
export const pedidosAPI = {
  getAll: () =>
    apiClient.get('/pedidos'),
  getDetalle: (id: number) =>
    apiClient.get('/pedidos/detalle', { params: { id } }),
  getPuntos: () =>
    apiClient.get('/pedidos/puntos'),
  checkout: (datos: any) =>
    apiClient.post('/pedidos/checkout', datos),
  crear: (datos: any) =>
    apiClient.post('/pedidos/crear', datos),
  actualizar: (id: number, datos: any) =>
    apiClient.put(`/pedidos/actualizar?id=${id}`, datos),
  eliminar: (id: number) =>
    apiClient.delete(`/pedidos/eliminar?id=${id}`),
};

// ============ VENTAS ============
export const ventasAPI = {
  getResumenAdmin: () =>
    apiClient.get('/ventas/resumen-admin'),
  getRecientes: () =>
    apiClient.get('/ventas/recientes'),
  getComisiones: () =>
    apiClient.get('/ventas/comisiones'),
  getReporte: (fechaInicio: string, fechaFin: string, vendedorId?: string) => {
    const params: any = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    if (vendedorId) params.vendedor_id = vendedorId;
    return apiClient.get('/ventas/reporte', { params });
  },
  getTopProductos: () =>
    apiClient.get('/ventas/top-productos'),
  getEstadisticas: () =>
    apiClient.get('/ventas/estadisticas'),
};

// ============ INVENTARIO ============
export const inventarioAPI = {
  getResumen: () =>
    apiClient.get('/inventario/resumen'),
  getCritico: () =>
    apiClient.get('/inventario/critico'),
  getMovimientos: () =>
    apiClient.get('/inventario/movimientos'),
  getStockCompleto: () =>
    apiClient.get('/inventario/stock-completo'),
  getReporte: (fechaInicio: string, fechaFin: string) =>
    apiClient.get('/inventario/reporte', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }),
};

// ============ ORDENES DE COMPRA ============
export const ordenesCompraAPI = {
  getAll: () =>
    apiClient.get('/ordenes-compra'),
  getDetalle: (id: number) =>
    apiClient.get('/ordenes-compra/detalle', { params: { id } }),
  getReporte: (fechaInicio: string, fechaFin: string) =>
    apiClient.get('/ordenes-compra/reporte', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }),
  create: (data: any) =>
    apiClient.post('/ordenes-compra', data),
  update: (data: any) =>
    apiClient.post('/ordenes-compra/editar', data),
  delete: (id: number) =>
    apiClient.post('/ordenes-compra/eliminar', { id }),
};

// ============ PROVEEDORES ============
export const proveedoresAPI = {
  getAll: () =>
    apiClient.get('/proveedores'),
  create: (proveedor: any) =>
    apiClient.post('/proveedores', proveedor),
};

// ============ NOTIFICACIONES ============
export const notificacionesAPI = {
  getAll: () =>
    apiClient.get('/notificaciones'),
  marcarLeida: (id_notificacion: number) =>
    apiClient.post('/notificaciones/marcar-leida', { id_notificacion }),
  marcarTodasLeidas: () =>
    apiClient.post('/notificaciones/marcar-todas-leidas', {}),
  enviarACurso: (id_curso: number, titulo: string, mensaje: string, tipo: string) =>
    apiClient.post('/notificaciones/enviar-a-curso', { id_curso, titulo, mensaje, tipo }),
};

// ============ AYUDA ============
export const ayudaAPI = {
  crearSolicitud: (solicitud: any) =>
    apiClient.post('/ayuda/contacto', solicitud),
  getTicketsVendedor: () =>
    apiClient.get('/ayuda/tickets'),
  getMisTickets: () =>
    apiClient.get('/ayuda/mis-tickets'),
  responder: (id_ticket: number, respuesta: string) =>
    apiClient.post('/ayuda/responder', { id_ticket, respuesta }),
};

// ============ COMENTARIOS ============
export const comentariosAPI = {
  listar: (id_leccion: number) =>
    apiClient.get('/comentarios', { params: { id_leccion } }),
  agregar: (id_leccion: number, texto: string) =>
    apiClient.post('/comentarios', { id_leccion, texto }),
  eliminar: (id: number) =>
    apiClient.post('/comentarios/eliminar', { id }),
};

// ============ LOGROS ============
export const logrosAPI = {
  getAll: () =>
    apiClient.get('/logros'),
  getMiProgreso: () =>
    apiClient.get('/logros/mi-progreso'),
};

// ============ CONFIGURACION ============
export const configuracionAPI = {
  get: () =>
    apiClient.get('/configuracion'),
  save: (config: any) =>
    apiClient.post('/configuracion', config),
  optimizar: () =>
    apiClient.post('/configuracion/optimizar', {}),
};

// ============ LOGS ============
export const logsAPI = {
  getAll: (nivel?: string, busqueda?: string) => {
    const params: any = {};
    if (nivel) params.nivel = nivel;
    if (busqueda) params.busqueda = busqueda;
    return apiClient.get('/logs', { params });
  },
  limpiar: () =>
    apiClient.post('/logs/limpiar', {}),
};
