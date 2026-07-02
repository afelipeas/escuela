<?php
// backend/seed_all.php
// Script de poblamiento masivo para la Fase 1: Dinamización

require_once __DIR__ . '/config/Database.php';
use Config\Database;

$db = Database::obtenerConexion();

echo "--- Iniciando Seeding Masivo (Fase 1) ---\n";

// 1. Limpiar tablas (excepto usuarios y logros que ya tienen base)
$db->exec("SET FOREIGN_KEY_CHECKS = 0;");
$db->exec("TRUNCATE TABLE comisiones_vendedor");
$db->exec("TRUNCATE TABLE movimientos_inventario");
$db->exec("TRUNCATE TABLE detalle_ordenes_compra");
$db->exec("TRUNCATE TABLE ordenes_compra");
$db->exec("TRUNCATE TABLE detalle_pedidos");
$db->exec("TRUNCATE TABLE pedidos");
$db->exec("TRUNCATE TABLE carrito_sesion");
$db->exec("TRUNCATE TABLE resenas_producto");
$db->exec("TRUNCATE TABLE anuncios_docente");
$db->exec("TRUNCATE TABLE comentarios_leccion");
$db->exec("TRUNCATE TABLE logros_estudiante");
$db->exec("TRUNCATE TABLE progreso_lecciones");
$db->exec("TRUNCATE TABLE inscripciones");
$db->exec("TRUNCATE TABLE materiales_leccion");
$db->exec("TRUNCATE TABLE lecciones");
$db->exec("TRUNCATE TABLE cursos");
$db->exec("SET FOREIGN_KEY_CHECKS = 1;");

echo "[OK] Tablas limpias.\n";

// 2. Crear Cursos y Lecciones (Docente ID 3)
$cursos = [
    ['titulo' => 'Héroes de la Biblia', 'desc' => 'Conoce a David, Moisés y otros valientes.', 'icono' => '🦸', 'color' => 'naranja'],
    ['titulo' => 'Parábolas de Jesús', 'desc' => 'Aprendiendo con historias maravillosas.', 'icono' => '🌾', 'color' => 'verde'],
    ['titulo' => 'El Arca de Noé', 'desc' => 'Una aventura animal llena de fe.', 'icono' => '🚢', 'color' => 'azul']
];

foreach ($cursos as $c) {
    $stmt = $db->prepare("INSERT INTO cursos (id_docente, titulo, descripcion, icono, color_tema, estado) VALUES (3, :t, :d, :i, :c, 'activo')");
    $stmt->execute([':t' => $c['titulo'], ':d' => $c['desc'], ':i' => $c['icono'], ':c' => $c['color']]);
    $curso_id = $db->lastInsertId();

    // Crear 3 lecciones por curso
    for ($i = 1; $i <= 3; $i++) {
        $stmt = $db->prepare("INSERT INTO lecciones (id_curso, titulo, descripcion, video_url, duracion_min, orden) VALUES (:id, :t, 'Descripción de la lección $i', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 15, $i)");
        $stmt->execute([':id' => $curso_id, ':t' => "Lección $i del curso " . $c['titulo']]);
    }
}
echo "[OK] Cursos y lecciones creados.\n";

// 3. Inscripciones y Progreso (Estudiante ID 4)
$stmt = $db->query("SELECT id FROM cursos");
$curso_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($curso_ids as $cid) {
    $progreso = rand(10, 90);
    $db->exec("INSERT INTO inscripciones (id_estudiante, id_curso, progreso_pct) VALUES (4, $cid, $progreso)");
}
echo "[OK] Inscripciones realizadas.\n";

// 4. Logros para el estudiante
$db->exec("INSERT INTO logros_estudiante (id_estudiante, id_logro) VALUES (4, 1), (4, 2)");
echo "[OK] Logros asignados.\n";

// 5. Historial de Ventas / Pedidos (Cliente ID 7)
// Simularemos ventas de los últimos 30 días
for ($i = 1; $i <= 10; $i++) {
    $fecha = date('Y-m-d H:i:s', strtotime("-$i days"));
    $total = rand(25000, 150000);
    $stmt = $db->prepare("INSERT INTO pedidos (codigo, id_cliente, subtotal, costo_envio, total, estado, fecha_pedido) VALUES (:c, 7, :s, 0, :t, 'pagado', :f)");
    $stmt->execute([
        ':c' => "#PED-" . (1000 + $i),
        ':s' => $total,
        ':t' => $total,
        ':f' => $fecha
    ]);
    $pedido_id = $db->lastInsertId();
    
    // Detalle del pedido (Producto ID 1 - Biblia)
    $db->exec("INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES ($pedido_id, 1, 1, $total, $total)");
}
echo "[OK] Historial de pedidos creado.\n";

// 6. Inventario y Stock
$db->exec("UPDATE productos SET stock_actual = 5, stock_minimo = 10 WHERE id = 4"); // Forzar stock crítico en Camiseta
$db->exec("INSERT INTO movimientos_inventario (id_producto, id_responsable, tipo, cantidad, motivo) VALUES (1, 6, 'entrada', 10, 'Compra a proveedor')");
echo "[OK] Inventario actualizado.\n";

echo "--- Seeding Masivo Finalizado Exitosamente ---\n";
