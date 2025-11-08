<?php
header('Content-Type: application/json');
// Permitir solicitudes desde cualquier origen para pruebas (debes restringirlo en producción)
header('Access-Control-Allow-Origin: *'); 

// 1. Configuración de la Base de Datos (Ajusta si cambiaste la configuración por defecto de XAMPP)
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'agencia_viajes_db');

// 2. Conexión
$link = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verificar la conexión
if ($link->connect_error) {
    // Devuelve un error JSON si la conexión falla
    echo json_encode(["error" => "Error de conexión a la base de datos: " . $link->connect_error]);
    exit();
}

// 3. Consulta SQL
$sql = "SELECT id, nombre, ruta, fecha_viaje, precio, descripcion, imagen_url FROM paquetes";
$result = $link->query($sql);

$paquetes = [];

// 4. Procesar Resultados
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Asegúrate de que el precio sea un número para JS
        $row['precio'] = (float)$row['precio'];
        
        // Formatear la fecha si es necesario (ej: de YYYY-MM-DD a DD/MM/YYYY)
        $dateObj = DateTime::createFromFormat('Y-m-d', $row['fecha_viaje']);
        $row['fecha_viaje_display'] = $dateObj ? $dateObj->format('d/m/Y') : $row['fecha_viaje'];
        
        $paquetes[] = $row;
    }
}

// 5. Devolver los datos como JSON
echo json_encode($paquetes);

$link->close();
?>