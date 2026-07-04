// URL del backend PHP. Ajusta segun donde subas los archivos en infinityfree:
// Si subes la carpeta backend/ a la raiz del sitio: usa /api (sin /backend/)
// Si creas una subcarpeta backend/: usa /backend/api
export const API_URL = 'https://escuela-dominical-mjqr.onrender.com/api';

export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  muted: '#94A3B8',
};

export const ROLES_LABELS: Record<string, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  estudiante: 'Estudiante',
  vendedor: 'Vendedor',
  almacen: 'Almacen',
  cliente: 'Cliente',
};

export const ESTADOS_PEDIDO: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const CATEGORIAS_PRODUCTO = [
  'Todos',
  'Biblias',
  'Libros',
  'Ropa',
  'Accesorios',
  'Material Didactico',
  'Regalos',
];

export const COLORES_ROL: Record<string, string> = {
  admin: '#7C3AED',
  docente: '#2563EB',
  estudiante: '#059669',
  vendedor: '#D97706',
  almacen: '#DC2626',
  cliente: '#6366F1',
};
