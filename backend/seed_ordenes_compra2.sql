USE escuela_dominical_db;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO ordenes_compra (codigo, id_proveedor, id_responsable, total, estado, fecha_orden, fecha_estimada, notas)
VALUES
('OC-2026-006', 1, 1, 220000.00, 'recibido', DATE_SUB(NOW(), INTERVAL 40 DAY), NULL, 'Pedido regular de biblias'),
('OC-2026-007', 2, 1, 185000.00, 'recibido', DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, 'Instrumentos musicales'),
('OC-2026-008', 1, 1, 312000.00, 'en_transito', DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'Reposicion biblias'),
('OC-2026-009', 4, 1, 95000.00,  'pendiente', DATE_SUB(NOW(), INTERVAL 5 DAY),  NULL, 'Papeleria general'),
('OC-2026-010', 2, 1, 148000.00, 'pendiente', DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL, 'Mas instrumentos');

SET @last = LAST_INSERT_ID();
SET @o1 = @last;
SET @o2 = @last+1;
SET @o3 = @last+2;
SET @o4 = @last+3;
SET @o5 = @last+4;

INSERT INTO detalle_ordenes_compra (id_orden, id_producto, cantidad_pedida, precio_costo_unitario, subtotal)
VALUES
(@o1, 1, 3, 30000.00, 90000.00),
(@o1, 6, 5, 14000.00, 70000.00),
(@o2, 3, 2, 10000.00, 20000.00),
(@o2, 5, 12, 5000.00, 60000.00),
(@o3, 1, 6, 28000.00, 168000.00),
(@o3, 4, 5, 14000.00, 70000.00),
(@o4, 5, 20, 4750.00, 95000.00),
(@o5, 3, 4, 10000.00, 40000.00),
(@o5, 2, 2, 20000.00, 40000.00);

INSERT INTO movimientos_inventario (id_producto, id_orden_compra, id_pedido, id_responsable, tipo, cantidad, motivo, fecha)
VALUES
(1, @o1, NULL, 1, 'entrada', 3,  'Recepcion OC-2026-006', DATE_SUB(NOW(), INTERVAL 38 DAY)),
(6, @o1, NULL, 1, 'entrada', 5,  'Recepcion OC-2026-006', DATE_SUB(NOW(), INTERVAL 38 DAY)),
(3, @o2, NULL, 1, 'entrada', 2,  'Recepcion OC-2026-007', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(5, @o2, NULL, 1, 'entrada', 12, 'Recepcion OC-2026-007', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(1, @o3, NULL, 1, 'entrada', 6,  'En transito OC-2026-008', DATE_SUB(NOW(), INTERVAL 18 DAY)),
(4, @o3, NULL, 1, 'entrada', 5,  'En transito OC-2026-008', DATE_SUB(NOW(), INTERVAL 18 DAY));

SET FOREIGN_KEY_CHECKS = 1;