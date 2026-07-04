-- ================================================================
-- BASE DE DATOS: escuela_dominical_db
-- PROYECTO: Escuela Dominical Virtual
-- MOTOR: MySQL 8.x | XAMPP + phpMyAdmin
-- AUTOR: Generado por afelipeas@gmail.com, en colaboración con Antigravity AI
-- FECHA: Abril 2026
-- VERSIÓN: 2.0 (Diseño verificado contra todos los módulos del frontend)
-- ================================================================

-- Crear y seleccionar la base de datos
-- Desactivar verificación de llaves foráneas durante la creación
SET FOREIGN_KEY_CHECKS = 0;
-- ================================================================
-- MÓDULO 1: USUARIOS Y AUTENTICACIÓN
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA 1: usuarios
-- Descripción: Tabla central del sistema. Almacena todos los
-- perfiles del sistema en un solo lugar: administradores, docentes,
-- estudiantes, vendedores, personal de almacén y clientes.
-- Cada usuario se distingue por el campo 'rol'.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id                      INT NOT NULL AUTO_INCREMENT,
    nombre_usuario          VARCHAR(60) NOT NULL UNIQUE COMMENT 'Alias único de acceso (del wizard de registro)',
    nombre                  VARCHAR(80) NOT NULL,
    apellido                VARCHAR(80) NOT NULL,
    email                   VARCHAR(120) NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada con bcrypt',
    telefono                VARCHAR(20) NULL,
    fecha_nacimiento        DATE NULL,
    rol                     ENUM('admin','docente','estudiante','vendedor','almacen','cliente') NOT NULL DEFAULT 'cliente',
    foto_url                VARCHAR(255) NULL COMMENT 'URL de avatar o foto de perfil',
    biografia               TEXT NULL COMMENT 'Descripción personal visible en el módulo Perfil',
    estado                  ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
    acepta_comunicaciones   TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Checkbox del paso 3 del registro',
    fecha_registro          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso           DATETIME NULL,
    PRIMARY KEY (id),
    INDEX idx_email         (email),
    INDEX idx_rol           (rol),
    INDEX idx_estado        (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 2: sesiones
-- Descripción: Control de tokens de autenticación por dispositivo.
-- Permite manejar múltiples sesiones activas por usuario y
-- revocar accesos específicos sin cerrar todas las sesiones.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    id              INT NOT NULL AUTO_INCREMENT,
    id_usuario      INT NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE COMMENT 'Token JWT o de sesión PHP',
    ip_address      VARCHAR(45) NULL COMMENT 'IP del dispositivo de acceso',
    expira_en       DATETIME NOT NULL,
    creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_token (token),
    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ================================================================
-- MÓDULO 2: ESCUELA VIRTUAL (LMS)
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA 3: cursos
-- Descripción: Las materias o módulos que ofrece la escuela.
-- Cada curso es creado por un docente y puede contener múltiples
-- lecciones. Los estudiantes se inscriben en estos cursos.
-- Ejemplos: "Héroes de la Biblia", "Cantos y Alabanzas".
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cursos (
    id              INT NOT NULL AUTO_INCREMENT,
    id_docente      INT NOT NULL COMMENT 'Docente responsable del curso',
    titulo          VARCHAR(150) NOT NULL,
    descripcion     TEXT NULL,
    icono           VARCHAR(10) NULL COMMENT 'Emoji representativo del curso',
    color_tema      VARCHAR(30) NULL COMMENT 'Valor CSS: naranja, azul, verde, purpura',
    estado          ENUM('activo','borrador','archivado') NOT NULL DEFAULT 'borrador',
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_docente (id_docente),
    INDEX idx_estado  (estado),
    CONSTRAINT fk_curso_docente
        FOREIGN KEY (id_docente) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 4: clases_programadas
-- Descripción: Sesiones en vivo o eventos de clase creados por
-- el docente mediante el formulario "Crear Clase". Incluye el
-- grupo de edad, fecha y hora programada. Visible en el dashboard
-- del docente como "Próximas Clases".
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clases_programadas (
    id              INT NOT NULL AUTO_INCREMENT,
    id_curso        INT NOT NULL,
    id_docente      INT NOT NULL,
    titulo          VARCHAR(150) NOT NULL COMMENT 'Ej: Clase sobre el Arca de Noé',
    grupo           VARCHAR(80) NULL COMMENT 'Ej: Grupo A (4-6 años)',
    fecha           DATE NOT NULL,
    hora            TIME NOT NULL,
    descripcion     TEXT NULL,
    estado          ENUM('programada','en_curso','finalizada','cancelada') NOT NULL DEFAULT 'programada',
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fecha       (fecha),
    INDEX idx_curso_clase (id_curso),
    CONSTRAINT fk_clase_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_clase_docente
        FOREIGN KEY (id_docente) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 5: lecciones
-- Descripción: Cada unidad de contenido dentro de un curso.
-- Contiene el video principal (URL de YouTube), descripción
-- y duración. Las lecciones se pueden ordenar y bloquear
-- para que el estudiante las vea en secuencia.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lecciones (
    id              INT NOT NULL AUTO_INCREMENT,
    id_curso        INT NOT NULL,
    titulo          VARCHAR(150) NOT NULL,
    descripcion     TEXT NULL,
    video_url       VARCHAR(500) NULL COMMENT 'URL de YouTube embed',
    duracion_min    INT NULL COMMENT 'Duración en minutos',
    orden           INT NOT NULL DEFAULT 1 COMMENT 'Posición dentro del curso',
    bloqueada       TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = visible solo al completar la anterior',
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_curso_leccion (id_curso),
    INDEX idx_orden         (orden),
    CONSTRAINT fk_leccion_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 6: materiales_leccion
-- Descripción: Archivos de apoyo adjuntos a cada lección.
-- Ejemplos: Guías de estudio en PDF, dibujos para colorear,
-- cuestionarios de repaso. Visibles en la vista de la lección.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materiales_leccion (
    id          INT NOT NULL AUTO_INCREMENT,
    id_leccion  INT NOT NULL,
    nombre      VARCHAR(150) NOT NULL COMMENT 'Nombre visible del archivo',
    tipo        ENUM('pdf','imagen','cuestionario','otro') NOT NULL DEFAULT 'pdf',
    url         VARCHAR(500) NOT NULL COMMENT 'Ruta del archivo en el servidor',
    tamano_kb   INT NULL COMMENT 'Tamaño del archivo en kilobytes',
    PRIMARY KEY (id),
    INDEX idx_material_leccion (id_leccion),
    CONSTRAINT fk_material_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 7: inscripciones
-- Descripción: Tabla de matrícula que relaciona cada estudiante
-- con los cursos en los que está inscrito. Registra el porcentaje
-- de progreso general del estudiante en cada curso.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inscripciones (
    id                  INT NOT NULL AUTO_INCREMENT,
    id_estudiante       INT NOT NULL,
    id_curso            INT NOT NULL,
    progreso_pct        TINYINT NOT NULL DEFAULT 0 COMMENT 'Porcentaje de avance del 0 al 100',
    fecha_inscripcion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inscripcion (id_estudiante, id_curso) COMMENT 'Un estudiante no puede inscribirse dos veces al mismo curso',
    CONSTRAINT fk_inscripcion_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inscripcion_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 8: progreso_lecciones
-- Descripción: Registra a nivel granular qué lecciones ha visto
-- y completado cada estudiante. Al marcar una lección como
-- completada, se otorgan puntos Fe al estudiante. Esta tabla
-- alimenta el sistema de gamificación y los logros.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progreso_lecciones (
    id                  INT NOT NULL AUTO_INCREMENT,
    id_estudiante       INT NOT NULL,
    id_leccion          INT NOT NULL,
    completada          TINYINT(1) NOT NULL DEFAULT 0,
    puntos_ganados      INT NOT NULL DEFAULT 50 COMMENT 'Puntos Fe otorgados al completar (+50 por defecto)',
    fecha_completado    DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_progreso (id_estudiante, id_leccion),
    CONSTRAINT fk_progreso_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_progreso_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 9: logros
-- Descripción: Catálogo maestro de medallas y logros que pueden
-- desbloquear los estudiantes. Cada logro tiene un nombre,
-- descripción, emoji y una cantidad de puntos requeridos para
-- obtenerlo. Ejemplos: "Primeros Pasos", "Puntualidad".
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logros (
    id                  INT NOT NULL AUTO_INCREMENT,
    titulo              VARCHAR(100) NOT NULL,
    descripcion         TEXT NULL COMMENT 'Condición para obtener el logro',
    icono               VARCHAR(10) NULL COMMENT 'Emoji del logro',
    puntos_requeridos   INT NOT NULL DEFAULT 0 COMMENT 'Puntos Fe necesarios para desbloquearlo',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 10: logros_estudiante
-- Descripción: Registro de los logros desbloqueados por cada
-- estudiante. Se crea un registro aquí cada vez que un estudiante
-- cumple la condición de un logro (puntos, clases, etc.).
-- Visible en el módulo "Mis Logros" del estudiante.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logros_estudiante (
    id              INT NOT NULL AUTO_INCREMENT,
    id_estudiante   INT NOT NULL,
    id_logro        INT NOT NULL,
    fecha_obtenido  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_logro_estudiante (id_estudiante, id_logro),
    CONSTRAINT fk_logro_est_usuario
        FOREIGN KEY (id_estudiante) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_logro_est_logro
        FOREIGN KEY (id_logro) REFERENCES logros(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 11: comentarios_leccion
-- Descripción: Foro de preguntas y comentarios dentro de cada
-- lección del aula virtual. Permite a estudiantes y docentes
-- interactuar, resolver dudas y compartir reflexiones sobre
-- el contenido de la clase.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comentarios_leccion (
    id          INT NOT NULL AUTO_INCREMENT,
    id_leccion  INT NOT NULL,
    id_usuario  INT NOT NULL,
    texto       TEXT NOT NULL,
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_comentario_leccion (id_leccion),
    CONSTRAINT fk_comentario_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 12: anuncios_docente
-- Descripción: Mensajes y avisosque el docente publica para que
-- sus estudiantes los vean dentro del aula virtual. Aparecen
-- en el panel del aula como "Anuncios del Docente". Pueden estar
-- dirigidos a un curso específico.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anuncios_docente (
    id          INT NOT NULL AUTO_INCREMENT,
    id_docente  INT NOT NULL,
    id_curso    INT NOT NULL,
    mensaje     TEXT NOT NULL,
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_anuncio_curso   (id_curso),
    INDEX idx_anuncio_docente (id_docente),
    CONSTRAINT fk_anuncio_docente
        FOREIGN KEY (id_docente) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_anuncio_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ================================================================
-- MÓDULO 3: TIENDA VIRTUAL
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA 13: productos
-- Descripción: Catálogo completo de artículos disponibles en
-- la tienda virtual. Incluye campos para gestión de inventario
-- (stock_actual, stock_minimo), precios de costo y venta para
-- reportes de rentabilidad, y datos de presentación al cliente
-- como etiqueta (Bestseller, Nuevo, Oferta), especificaciones
-- y puntuación promedio de reseñas.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id              INT NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT NULL,
    precio          DECIMAL(10,2) NOT NULL COMMENT 'Precio de venta al público',
    precio_costo    DECIMAL(10,2) NULL COMMENT 'Costo de adquisición para cálculo de margen',
    categoria       VARCHAR(80) NULL COMMENT 'Ej: Libros y Biblias, Manualidades, Instrumentos',
    imagen_url      VARCHAR(500) NULL,
    etiqueta        VARCHAR(30) NULL COMMENT 'Bestseller | Nuevo | Oferta | Popular',
    especificaciones TEXT NULL COMMENT 'Características del producto (JSON o texto separado por comas)',
    puntuacion      DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT 'Promedio de reseñas (0.0 a 5.0)',
    stock_actual    INT NOT NULL DEFAULT 0,
    stock_minimo    INT NOT NULL DEFAULT 5 COMMENT 'Umbral para alertas de reabastecimiento',
    activo          TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = visible en el catálogo',
    PRIMARY KEY (id),
    INDEX idx_categoria (categoria),
    INDEX idx_activo    (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 14: resenas_producto
-- Descripción: Testimonios y calificaciones que los clientes
-- dejan sobre cada producto. Visibles en la página de detalle
-- del producto (TiendaDetalleComponent). Cada reseña incluye
-- texto y puntuación de 1 a 5 estrellas.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resenas_producto (
    id          INT NOT NULL AUTO_INCREMENT,
    id_producto INT NOT NULL,
    id_usuario  INT NOT NULL,
    texto       TEXT NOT NULL,
    estrellas   TINYINT NOT NULL COMMENT 'Puntuación del 1 al 5',
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_resena_producto (id_producto),
    CONSTRAINT fk_resena_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resena_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_estrellas CHECK (estrellas BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 15: carrito_sesion
-- Descripción: Almacena los productos que un usuario ha añadido
-- al carrito de compras pero aún no ha confirmado. Permite
-- que el carrito persista entre navegaciones. Si id_usuario es
-- NULL, corresponde a un visitante no registrado.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrito_sesion (
    id              INT NOT NULL AUTO_INCREMENT,
    id_usuario      INT NULL COMMENT 'NULL si el visitante no está logueado',
    id_producto     INT NOT NULL,
    cantidad        INT NOT NULL DEFAULT 1,
    fecha_agregado  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_carrito_usuario (id_usuario),
    CONSTRAINT fk_carrito_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carrito_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 16: pedidos
-- Descripción: Cabecera de cada orden de compra generada por
-- un cliente en la tienda virtual o manualmente por el admin.
-- Contiene toda la información de envío capturada en el checkout
-- (nombre, email, dirección, ciudad), el método de pago,
-- el estado actual del pedido y los totales.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id              INT NOT NULL AUTO_INCREMENT,
    codigo          VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código legible: #PED-1025, #P-1032',
    id_cliente      INT NOT NULL,
    id_vendedor     INT NULL COMMENT 'Vendedor asignado si aplica',
    nombre_envio    VARCHAR(150) NULL COMMENT 'Nombre del destinatario (del checkout)',
    email_envio     VARCHAR(120) NULL,
    direccion_envio VARCHAR(255) NULL,
    ciudad_envio    VARCHAR(80) NULL,
    subtotal        DECIMAL(10,2) NOT NULL COMMENT 'Total sin costo de envío',
    costo_envio     DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Gratis si subtotal > $150,000',
    total           DECIMAL(10,2) NOT NULL COMMENT 'subtotal + costo_envio',
    metodo_pago     ENUM('tarjeta','transferencia','efectivo','otro') NOT NULL DEFAULT 'tarjeta',
    estado          ENUM('pendiente','pagado','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
    notas           TEXT NULL,
    fecha_pedido    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega   DATETIME NULL,
    PRIMARY KEY (id),
    INDEX idx_estado_pedido  (estado),
    INDEX idx_cliente_pedido (id_cliente),
    INDEX idx_vendedor_pedido(id_vendedor),
    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_vendedor
        FOREIGN KEY (id_vendedor) REFERENCES usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 17: detalle_pedidos
-- Descripción: Líneas de producto individuales dentro de cada
-- pedido. Guarda el precio unitario en el momento de la compra
-- (no el actual) para mantener la integridad histórica de los
-- reportes de ventas aunque el precio del producto cambie
-- en el futuro.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id                  INT NOT NULL AUTO_INCREMENT,
    id_pedido           INT NOT NULL,
    id_producto         INT NOT NULL,
    cantidad            INT NOT NULL,
    precio_unitario     DECIMAL(10,2) NOT NULL COMMENT 'Precio al momento de la compra (histórico)',
    subtotal            DECIMAL(10,2) NOT NULL COMMENT 'cantidad × precio_unitario',
    PRIMARY KEY (id),
    INDEX idx_detalle_pedido (id_pedido),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ================================================================
-- MÓDULO 4: ALMACÉN Y LOGÍSTICA
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA 18: proveedores
-- Descripción: Directorio de empresas y contactos que suministran
-- productos al almacén. Gestionado desde el módulo de Proveedores
-- del panel de Almacén con operaciones CRUD (crear, editar,
-- eliminar y cambiar estado activo/inactivo).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
    id              INT NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(150) NOT NULL,
    contacto        VARCHAR(100) NULL COMMENT 'Nombre de la persona de contacto',
    telefono        VARCHAR(20) NULL,
    email           VARCHAR(120) NULL,
    categoria       VARCHAR(80) NULL COMMENT 'Tipo de productos que suministra',
    estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_proveedor_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 19: ordenes_compra
-- Descripción: Órdenes formales de compra enviadas a los proveedores
-- para reponer el inventario. Visible en el panel "Compras" del
-- módulo de Almacén. Cada orden tiene un código único tipo
-- OC-2026-001, un proveedor asignado y un estado de seguimiento
-- (pendiente, en tránsito, recibido, cancelado).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id                  INT NOT NULL AUTO_INCREMENT,
    codigo              VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código legible: OC-2026-001',
    id_proveedor        INT NOT NULL,
    id_responsable      INT NOT NULL COMMENT 'Usuario de almacén que generó la orden',
    total               DECIMAL(10,2) NOT NULL,
    estado              ENUM('pendiente','en_transito','recibido','cancelado') NOT NULL DEFAULT 'pendiente',
    fecha_orden         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_estimada      DATE NULL COMMENT 'Fecha estimada de llegada',
    notas               TEXT NULL,
    PRIMARY KEY (id),
    INDEX idx_orden_estado     (estado),
    INDEX idx_orden_proveedor  (id_proveedor),
    CONSTRAINT fk_orden_proveedor
        FOREIGN KEY (id_proveedor) REFERENCES proveedores(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orden_responsable
        FOREIGN KEY (id_responsable) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 20: detalle_ordenes_compra
-- Descripción: Ítems individuales dentro de cada orden de compra.
-- Registra qué productos se pidieron al proveedor y en qué cantidad,
-- así como el precio de costo unitario pactado. Permite calcular
-- el gasto total por producto y por proveedor en los reportes.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ordenes_compra (
    id                      INT NOT NULL AUTO_INCREMENT,
    id_orden                INT NOT NULL,
    id_producto             INT NOT NULL,
    cantidad_pedida         INT NOT NULL,
    precio_costo_unitario   DECIMAL(10,2) NOT NULL COMMENT 'Precio de compra al proveedor',
    subtotal                DECIMAL(10,2) NOT NULL COMMENT 'cantidad_pedida × precio_costo_unitario',
    PRIMARY KEY (id),
    INDEX idx_detalle_orden (id_orden),
    CONSTRAINT fk_det_orden_compra
        FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_det_orden_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ----------------------------------------------------------------
-- TABLA 21: movimientos_inventario
-- Descripción: Historial completo y auditable de todas las entradas
-- y salidas del almacén. Cuando se recibe una orden de compra,
-- se crea un movimiento tipo 'entrada'. Cuando se despacha un
-- pedido de la tienda, se crea un movimiento tipo 'salida'.
-- Los ajustes manuales también quedan registrados aquí.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id              INT NOT NULL AUTO_INCREMENT,
    id_producto     INT NOT NULL,
    id_orden_compra INT NULL COMMENT 'Vinculado si el movimiento es por una orden de compra',
    id_pedido       INT NULL COMMENT 'Vinculado si el movimiento es por un pedido de la tienda',
    id_responsable  INT NOT NULL COMMENT 'Usuario que registró el movimiento',
    tipo            ENUM('entrada','salida','ajuste') NOT NULL,
    cantidad        INT NOT NULL COMMENT 'Positivo para entradas, negativo para salidas',
    motivo          VARCHAR(200) NULL COMMENT 'Descripción del motivo del movimiento',
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_mov_producto (id_producto),
    INDEX idx_mov_fecha    (fecha),
    INDEX idx_mov_tipo     (tipo),
    CONSTRAINT fk_mov_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_mov_orden_compra
        FOREIGN KEY (id_orden_compra) REFERENCES ordenes_compra(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_mov_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_mov_responsable
        FOREIGN KEY (id_responsable) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ================================================================
-- MÓDULO 5: VENTAS Y COMISIONES
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA 22: comisiones_vendedor
-- Descripción: Registro de las comisiones económicas generadas
-- por cada vendedor al confirmar un pedido. Permite al vendedor
-- ver sus comisiones acumuladas, pendientes y pagadas en el
-- reporte de ventas. El administrador puede aprobar y marcar
-- como pagadas las comisiones desde el módulo de Gestión de Ventas.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comisiones_vendedor (
    id          INT NOT NULL AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    id_pedido   INT NOT NULL,
    porcentaje  DECIMAL(5,2) NOT NULL COMMENT 'Porcentaje de comisión aplicado al pedido',
    monto       DECIMAL(10,2) NOT NULL COMMENT 'Valor en pesos de la comisión',
    estado      ENUM('pendiente','aprobada','pagada') NOT NULL DEFAULT 'pendiente',
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comision_pedido (id_vendedor, id_pedido) COMMENT 'Una comisión por vendedor por pedido',
    INDEX idx_comision_estado   (estado),
    INDEX idx_comision_vendedor (id_vendedor),
    CONSTRAINT fk_comision_vendedor
        FOREIGN KEY (id_vendedor) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_comision_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ================================================================
-- REACTIVAR VERIFICACIÓN DE LLAVES FORÁNEAS
-- ================================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ================================================================
-- DATOS INICIALES DE PRUEBA (SEED DATA)
-- ================================================================

-- Usuario Administrador por defecto
INSERT INTO usuarios (nombre_usuario, nombre, apellido, email, password_hash, rol, foto_url, estado)
VALUES ('admin_escuela', 'Super', 'Admin', 'admin@escuela.com',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
        'admin', '🛡️', 'activo');

-- Logros iniciales del sistema
INSERT INTO logros (titulo, descripcion, icono, puntos_requeridos) VALUES
('Primeros Pasos',  'Completaste tu primera lección.',        '⭐', 50),
('Puntualidad',     'Asististe a 5 clases consecutivas.',     '⏰', 250),
('Buen Amigo',      'Comentaste en el foro por primera vez.', '🤝', 100),
('Explorador',      'Te inscribiste en 3 cursos diferentes.', '🗺️', 150),
('Devoto',          'Acumulaste 1,000 Puntos Fe.',            '💎', 1000);

-- Categorías de productos iniciales (como productos de ejemplo)
INSERT INTO productos (nombre, descripcion, precio, precio_costo, categoria, imagen_url, etiqueta, puntuacion, stock_actual, stock_minimo) VALUES
('Biblia para Niños "Aventura"',      'Historias bíblicas con ilustraciones vibrantes.', 65000, 30000, 'Libros y Biblias', '📖', 'Bestseller', 4.8, 50,  10),
('Kit Arca de Noé (Madera)',           'Para armar y pintar en familia.',                 45000, 20000, 'Manualidades',    '🚢', 'Nuevo',      4.5, 30,   5),
('Pandereta "Alabanza"',               'Tamaño ideal para manos pequeñas.',               25000, 10000, 'Instrumentos',    '🥁', NULL,         0.0, 15,   5),
('Camiseta "Pequeño Gigante"',         'Algodón 100% hipoalergénico.',                    32000, 14000, 'Ropa y Accesorios','👕','Oferta',     0.0,  8,   5),
('Set de 12 Lápices de Colores',       'Colores brillantes y punta resistente.',          12000,  5000, 'Manualidades',    '✏️', NULL,         0.0, 80,  20),
('Libreta de Oración "Mi Amigo Jesús"','Para anotar agradecimientos y peticiones.',       18000,  7000, 'Libros y Biblias', '📓','Popular',    0.0, 45,  10);

-- Proveedores iniciales
INSERT INTO proveedores (nombre, contacto, telefono, email, categoria, estado) VALUES
('Editoriales Unidas',    'Carlos Ruiz',     '300 123 4567', 'ventas@unidas.com',         'Libros',        'activo'),
('Distribuidora Musical', 'Ana Mora',         '315 987 6543', 'soporte@music.co',          'Instrumentos',  'activo'),
('Artesanías del Valle',  'Pedro Gómez',      '320 456 7890', 'artes@valle.co',             'Decoración',    'inactivo'),
('Papelería Central',     'Lucía Fernández',  '311 222 3333', 'info@papelcentral.com',     'Oficina',       'activo');
-- ================================================================
-- FIN DEL SCRIPT
-- Total de tablas creadas: 22
-- Base de datos: escuela_dominical_db
-- ================================================================
