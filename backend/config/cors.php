<?php
// ================================================================
// config/cors.php — Configuración de CORS (Cross-Origin Resource Sharing)
// ================================================================
// Ya que el Frontend (Angular) corre en un dominio/puerto distinto
// (ej: localhost:4200) al Backend (ej: localhost/php), los navegadores
// bloquean las peticiones HTTP por seguridad.
//
// Este archivo envía encabezados (Headers) especiales indicando al
// navegador que Angular sí tiene permiso para consumir esta API.
// ================================================================

// 1. ¿Quién puede hacer peticiones a nuestra API?
// Para desarrollo, permitimos todo ('*'). En producción deberías cambiar
// el asterisco por el dominio real de tu frontend, Ej: 'https://miescuela.com'
header("Access-Control-Allow-Origin: *");

// 2. ¿Qué métodos HTTP están permitidos?
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// 3. ¿Qué datos se pueden enviar en las cabeceras (Headers) de la petición?
// Content-Type: Para enviar JSON.
// Authorization: Para enviar el token JWT.
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si es una solicitud de validación previa (OPTIONS), salir sin procesar la BD
// (Esto ya se maneja en el index.php, pero es buena práctica declararlo claro aquí).
