<?php
// Script para generar usuarios de prueba para todos los roles
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/app/Models/UsuarioModel.php';

use App\Models\UsuarioModel;

$model = new UsuarioModel();

$usuarios = [
    [
        'nombre_usuario' => 'docente_demo',
        'nombre' => 'Juan',
        'apellido' => 'Docente',
        'email' => 'docente@escuela.com',
        'password' => 'password',
        'rol' => 'docente'
    ],
    [
        'nombre_usuario' => 'estudiante_demo',
        'nombre' => 'Mateo',
        'apellido' => 'Estudiante',
        'email' => 'estudiante@escuela.com',
        'password' => 'password',
        'rol' => 'estudiante'
    ],
    [
        'nombre_usuario' => 'vendedor_demo',
        'nombre' => 'Lucas',
        'apellido' => 'Vendedor',
        'email' => 'vendedor@escuela.com',
        'password' => 'password',
        'rol' => 'vendedor'
    ],
    [
        'nombre_usuario' => 'almacen_demo',
        'nombre' => 'Marcos',
        'apellido' => 'Almacen',
        'email' => 'almacen@escuela.com',
        'password' => 'password',
        'rol' => 'almacen'
    ],
    [
        'nombre_usuario' => 'cliente_demo',
        'nombre' => 'Simon',
        'apellido' => 'Cliente',
        'email' => 'cliente@escuela.com',
        'password' => 'password',
        'rol' => 'cliente'
    ]
];

echo "Iniciando creación de usuarios de prueba...\n";

foreach ($usuarios as $u) {
    try {
        // Verificar si ya existe por email
        if ($model->getByEmail($u['email'])) {
            echo "El usuario {$u['email']} ya existe. Saltando...\n";
            continue;
        }
        
        $id = $model->create($u);
        echo "Usuario creado: {$u['email']} (Rol: {$u['rol']}) - ID: $id\n";
    } catch (Exception $e) {
        echo "Error al crear {$u['email']}: " . $e->getMessage() . "\n";
    }
}

echo "Proceso finalizado.\n";
