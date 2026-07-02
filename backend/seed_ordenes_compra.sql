USE escuela_dominical_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 5 realistic purchase orders spanning the last 45 days
INSERT INTO ordenes_compra (id, codigo, id_proveedor, id_responsable, total, estado, fecha_orden, fecha_estimada, notas)
VALUES
(1, 'OC-2026-001', 1, 1, 220000.00, 'recibido', DATE_SUB(NOW(), INTERVAL 40 DAY), NULL, 'Pedido regular de biblias'),
(2, 'OC-2026-002', 2, 1, 185000.00, 'recibido', DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, 'Instrumentos musicales'),
(3, 'OC-2026-003', 1, 1, 312000.00, 'en_transito', DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'Reposicion biblias'),
(4, 'OC-2026-004', 4, 1, 95000.00,  'pendiente', DATE_SUB(NOW(), INTERVAL 5 DAY),  NULL, 'Papeleria general'),
(5, 'OC-2026-005', 2, 1, 148000.00, 'pendiente', DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL, 'Mas instrumentos');

INSERT INTO detalle_ordenes_compra (id, id_orden, id_producto, cantidad_pedida, precio_costo_unitario, subtotal)
VALUES
(1,  1, 1, 3, 30000.00, 90000.00),
(2,  1, 6, 5, 14000.00, 70000.00),
(3,  2, 3, 2, 10000.00, 20000.00),
(4,  2, 5, 12, 5000.00, 60000.00),
(5,  3, 1, 6, 28000.00, 168000.00),
(6,  3, 4, 5, 14000.00, 70000.00),
(7,  4, 5, 20, 4750.00, 95000.00),
(8,  5, 3, 4, 10000.00, 40000.00),
(9,  5, 2, 2, 20000.00, 40000.00);

INSERT INTO movimientos_inventario (id, id_producto, id_orden_compra, id_pedido, id_responsable, tipo, cantidad, motivo, fecha)
VALUES
(1, 1, 1, NULL, 1, 'entrada', 3,  'Recepcion OC-2026-001', DATE_SUB(NOW(), INTERVAL 38 DAY)),
(2, 6, 1, NULL, 1, 'entrada', 5,  'Recepcion OC-2026-001', DATE_SUB(NOW(), INTERVAL 38 DAY)),
(3, 3, 2, NULL, 1, 'entrada', 2,  'Recepcion OC-2026-002', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(4, 5, 2, NULL, 1, 'entrada', 12, 'Recepcion OC-2026-002', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(5, 1, 3, NULL, 1, 'entrada', 6,  'En transito OC-2026-003', DATE_SUB(NOW(), INTERVAL 18 DAY)),
(6, 4, 3, NULL, 1, 'entrada', 5,  'En transito OC-2026-003', DATE_SUB(NOW(), INTERVAL 18 DAY));

SET FOREIGN_KEY_CHECKS = 1;