<?php
header("Content-Type: application/json; charset=UTF-8");

// Incluir la conexión a la base de datos (maneja CORS y errores de conexión)
include 'db.php';

// Función centralizada para enviar respuesta JSON, cerrar la conexión y detener la ejecución
// Si esta función ya está en db.php, puedes eliminarla de aquí. 
// La incluimos por seguridad si db.php solo maneja la conexión.
if (!function_exists('sendResponse')) {
    function sendResponse($success, $dataOrError, $conn) {
        // Asegura el header JSON de nuevo
        header('Content-Type: application/json');
        echo json_encode(["success" => $success, ($success ? "message" : "error") => $dataOrError]);
        
        // Cerrar la conexión si está abierta
        if ($conn instanceof mysqli) {
            $conn->close();
        }
        exit();
    }
}


// Obtener datos de la petición POST (JSON)
$data = json_decode(file_get_contents("php://input"), true);

// Asignación de variables
$sessionToken = isset($data['session_token']) ? $data['session_token'] : '';
$nombre = isset($data['nombre']) ? $data['nombre'] : '';
$ruta = isset($data['ruta']) ? $data['ruta'] : '';
$fecha_viaje = isset($data['fecha_viaje']) ? $data['fecha_viaje'] : '';
// IMPORTANTE: Los valores numéricos deben manejar el caso 'null' o 'no enviado'
$precio = isset($data['precio']) ? (float)$data['precio'] : 0.0;
$descripcion = isset($data['descripcion']) ? $data['descripcion'] : '';
$imagen_url = isset($data['imagen_url']) ? $data['imagen_url'] : '';

// 1. VALIDACIÓN BÁSICA DE DATOS
if (empty($nombre) || empty($ruta) || empty($fecha_viaje) || empty($descripcion) || empty($imagen_url) || $precio <= 0) {
    sendResponse(false, "Faltan campos obligatorios o el precio es inválido.", $conn);
}

// 2. VERIFICACIÓN DE ROL DEL ADMINISTRADOR (USANDO JOIN)
// Se asume que $conn existe gracias a require_once 'db.php';
global $conn;

$stmt_auth = $conn->prepare("
    SELECT u.rol 
    FROM usuarios u
    JOIN sesiones s ON u.id = s.usuario_id
    WHERE s.session_token = ? AND s.session_token IS NOT NULL
");

if (!$stmt_auth) {
    sendResponse(false, "Error de preparación (Auth): " . $conn->error, $conn);
}

$stmt_auth->bind_param("s", $sessionToken);
if (!$stmt_auth->execute()) {
    sendResponse(false, "Error de ejecución (Auth): " . $stmt_auth->error, $conn);
}

$result_auth = $stmt_auth->get_result();
$user = $result_auth->fetch_assoc();
$stmt_auth->close();

if (!$user || $user['rol'] !== 'administrador') {
    sendResponse(false, "Acceso denegado. Solo administradores pueden crear paquetes.", $conn);
}


// 3. INSERCIÓN DEL PAQUETE EN LA BASE DE DATOS
$sql = "INSERT INTO paquetes (nombre, ruta, fecha_viaje, precio, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    sendResponse(false, "Error de preparación (Paquete): " . $conn->error, $conn);
}

$stmt->bind_param("sssdss", $nombre, $ruta, $fecha_viaje, $precio, $descripcion, $imagen_url);

if ($stmt->execute()) {
    $newId = $conn->insert_id;
    $stmt->close();
    sendResponse(true, "Paquete creado con ID: " . $newId, $conn);
} else {
    $error = $stmt->error;
    $stmt->close();
    sendResponse(false, "Error de BD al crear paquete: " . $error, $conn);
}
?>