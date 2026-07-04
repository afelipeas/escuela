export type UserRole = 'admin' | 'docente' | 'estudiante' | 'vendedor' | 'almacen' | 'cliente';

export interface Usuario {
  id: number;
  nombre_usuario?: string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: UserRole;
  estado?: string;
  foto_url?: string;
  biografia?: string;
  puntos?: number;
  fecha_registro?: string;
}

export interface Curso {
  id: number;
  id_docente: number;
  titulo: string;
  descripcion?: string;
  icono?: string;
  color_tema?: string;
  estado: string;
  video_url?: string;
  material_url?: string;
  fecha_creacion?: string;
  docente_nombre?: string;
  total_lecciones?: number;
}

export interface Leccion {
  id: number;
  id_curso: number;
  titulo: string;
  descripcion?: string;
  video_url?: string;
  duracion_min?: number;
  orden: number;
  bloqueada?: boolean;
  completada?: boolean;
  puntos_ganados?: number;
}

export interface Clase {
  id: number;
  id_curso: number;
  id_docente: number;
  titulo: string;
  grupo?: string;
  fecha: string;
  hora: string;
  descripcion?: string;
  estado: string;
  curso_titulo?: string;
  material_url?: string;
  material_nombre?: string;
}

export interface Inscripcion {
  id: number;
  id_estudiante: number;
  id_curso: number;
  progreso_pct: number;
  fecha_inscripcion: string;
  curso_titulo?: string;
  curso_icono?: string;
  curso_color?: string;
  docente_nombre?: string;
  total_lecciones?: number;
  lecciones_completadas?: number;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_costo?: number;
  categoria?: string;
  imagen_url?: string;
  etiqueta?: string;
  especificaciones?: string;
  stock_actual?: number;
  stock_minimo?: number;
  activo?: boolean;
}

export interface CarritoItem {
  id_producto: number;
  cantidad: number;
  nombre?: string;
  precio?: number;
  imagen_url?: string;
  subtotal?: number;
}

export interface Pedido {
  id: number;
  codigo: string;
  id_cliente: number;
  nombre_envio?: string;
  email_envio?: string;
  direccion_envio?: string;
  ciudad_envio?: string;
  subtotal: number;
  costo_envio: number;
  total: number;
  metodo_pago?: string;
  estado: string;
  notas?: string;
  fecha_pedido: string;
}

export interface DetallePedido {
  id_producto: number;
  nombre_producto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo?: string;
  leido: boolean;
  fecha_creacion: string;
}

export interface Logro {
  id: number;
  titulo: string;
  descripcion?: string;
  icono: string;
  puntos_requeridos: number;
  fecha_obtenido?: string;
}

export interface OrdenCompra {
  id: number;
  codigo: string;
  id_proveedor: number;
  proveedor_nombre?: string;
  total: number;
  estado: string;
  fecha_orden: string;
  notas?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  categoria?: string;
  estado?: string;
}

export interface MovimientoInventario {
  id: number;
  id_producto: number;
  producto_nombre?: string;
  tipo: string;
  cantidad: number;
  motivo?: string;
  fecha: string;
  responsable_nombre?: string;
}

export interface SystemLog {
  id: number;
  fecha: string;
  nivel: string;
  usuario: string;
  accion: string;
  ip?: string;
  detalles?: string;
}

export interface KPI {
  titulo: string;
  valor: string;
  tendencia: string;
  icono: string;
  clase?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  datos: T;
  mensaje: string;
  errores?: string[];
}
