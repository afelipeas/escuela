<?php
// ================================================================
// app/Helpers/Paginator.php — Gestor de Paginación para MySQL
// ================================================================
// Evita tirar la base de datos enviando los 100,000 registros de
// una tabla de una sola vez. Limita la respuesta añadiendo 
// "LIMIT x OFFSET y" a las consultas SQL automáticamente.
// ================================================================

namespace App\Helpers;

use PDO;

class Paginator
{
    /**
     * Pagina una consulta SQL pura
     * 
     * @param PDO $pdo Instancia de la base de datos
     * @param string $sqlConsulta Base del SELECT (sin LIMIT ni OFFSET)
     * @param array $parametros Parámetros para preparar la consulta
     * @param array $query GET_Params (donde vienen 'page' y 'limit')
     */
    public static function paginate(PDO $pdo, string $sqlConsulta, array $parametros = [], array $query = []): array
    {
        $pagina = isset($query['page']) ? (int)$query['page'] : 1;
        $limite = isset($query['limit']) ? (int)$query['limit'] : 10;

        if ($pagina < 1) $pagina = 1;
        if ($limite < 1 || $limite > 100) $limite = 10; // Tope máximo por seguridad

        $offset = ($pagina - 1) * $limite;

        // 1. Obtener count total (Reemplazamos "SELECT * " por "SELECT COUNT(*) ")
        // Nota: Solo funciona para consultas simples. Para JOINs complejos puede requerir ajuste
        $sqlCount = preg_replace('/SELECT (.*?) FROM/i', 'SELECT COUNT(*) as total FROM', $sqlConsulta);
        $stmtCount = $pdo->prepare($sqlCount);
        $stmtCount->execute($parametros);
        $totalItems = (int)$stmtCount->fetchColumn();

        $totalPaginas = ceil($totalItems / $limite);

        // 2. Obtener la data con LIMIT y OFFSET
        $sqlListado = $sqlConsulta . " LIMIT {$limite} OFFSET {$offset}";
        $stmtListado = $pdo->prepare($sqlListado);
        $stmtListado->execute($parametros);
        $datos = $stmtListado->fetchAll();

        return [
            'data' => $datos,
            'meta' => [
                'total_items'   => $totalItems,
                'total_paginas' => $totalPaginas,
                'pagina_actual' => $pagina,
                'items_por_pagina' => $limite,
                'tiene_mas'     => $pagina < $totalPaginas
            ]
        ];
    }
}
