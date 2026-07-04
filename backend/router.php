<?php
// Router para el servidor PHP integrado de Render
// Redirige todas las peticiones a index.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$archivo = __DIR__ . $uri;

// Si el archivo existe fisicamente, servirlo
if ($uri !== '/' && file_exists($archivo) && !is_dir($archivo)) {
    return false;
}

// Todo lo demas va a index.php
require_once __DIR__ . '/index.php';
