import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Registro: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  VentasDashboard: undefined;
  Usuarios: undefined;
  Configuracion: undefined;
  Logs: undefined;
  AdminProductos: undefined;
  AdminCompras: undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};

export type DocenteStackParamList = {
  DocenteDashboard: undefined;
  CrearClase: undefined;
  DocenteCursos: undefined;
  LeccionesGestor: { cursoId: number; cursoTitulo: string };
  ComentariosLeccion: { leccionId: number; leccionTitulo: string };
  Alumnos: undefined;
  CalendarioDocente: undefined;
  DocenteCalificaciones: undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};

export type EstudianteStackParamList = {
  EstudianteDashboard: undefined;
  ExplorarCursos: undefined;
  MisCursos: undefined;
  AulaCurso: { cursoId: number; cursoTitulo: string };
  AulaLeccion: { leccionId: number; leccionTitulo: string };
  Logros: undefined;
  Calificaciones: undefined;
  Calendario: undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};

export type VendedorStackParamList = {
  VendedorDashboard: undefined;
  NuevaVenta: undefined;
  VendedorReportes: undefined;
  SoporteVendedor: undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};

export type AlmacenStackParamList = {
  AlmacenDashboard: undefined;
  AlmacenCompras: undefined;
  Proveedores: undefined;
  AlmacenReportes: undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};

export type ClienteStackParamList = {
  ClienteDashboard: undefined;
  Pedidos: undefined;
  Ayuda: undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};

export type TiendaStackParamList = {
  TiendaCatalogo: undefined;
  TiendaDetalle: { productoId: number };
  TiendaCarrito: undefined;
};

export type MainDrawerParamList = {
  AdminTabs: NavigatorScreenParams<AdminStackParamList> | undefined;
  DocenteTabs: NavigatorScreenParams<DocenteStackParamList> | undefined;
  EstudianteTabs: NavigatorScreenParams<EstudianteStackParamList> | undefined;
  VendedorTabs: NavigatorScreenParams<VendedorStackParamList> | undefined;
  AlmacenTabs: NavigatorScreenParams<AlmacenStackParamList> | undefined;
  ClienteTabs: NavigatorScreenParams<ClienteStackParamList> | undefined;
  Tienda: NavigatorScreenParams<TiendaStackParamList> | undefined;
  Perfil: undefined;
  Notificaciones: undefined;
};
