<?php
// Incluye el archivo de conexión. Esto inicializa $conn y maneja CORS/errores de conexión.
include 'db.php'; 

// -----------------------------------------------------------
// 1. Configuración de respuesta
// -----------------------------------------------------------

// Asegura que la respuesta sea JSON, incluso después de incluir db.php
header('Content-Type: application/json');

// -----------------------------------------------------------
// 2. Obtención de datos
// -----------------------------------------------------------

// Leer el JSON enviado por JavaScript (que contiene el session_token)
$data = json_decode(file_get_contents("php://input"));
$session_token = $data->session_token ?? null;

if (!$session_token) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Token de sesión no proporcionado.']);
    exit;
}

// -----------------------------------------------------------
// 3. Lógica de Cierre de Sesión y Registro de Actividad
// -----------------------------------------------------------

try {
    // A. Registrar la última actividad (last_activity = NOW())
    // --------------------------------------------------------
    $sql_activity = "UPDATE sesiones SET last_activity = NOW() WHERE session_token = ?";
    $stmt_activity = $conn->prepare($sql_activity);
    
    // Verifica si la preparación de la consulta falló
    if ($stmt_activity === false) {
        throw new Exception("Error al preparar la consulta de actividad: " . $conn->error);
    }
    
    $stmt_activity->bind_param("s", $session_token);
    $stmt_activity->execute();
    
    // B. Eliminar el token de sesión para invalidarlo completamente
    // -------------------------------------------------------------
    $sql_delete = "DELETE FROM sesiones WHERE session_token = ?";
    $stmt_delete = $conn->prepare($sql_delete);

    // Verifica si la preparación de la consulta falló
    if ($stmt_delete === false) {
        throw new Exception("Error al preparar la consulta de eliminación: " . $conn->error);
    }

    $stmt_delete->bind_param("s", $session_token);
    $stmt_delete->execute();
    
    // -------------------------------------------------------------
    // Respuesta de éxito (200 OK)
    // -------------------------------------------------------------
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada y actividad registrada.']);

} catch (Exception $e) {
    // Manejo de errores de SQL o PHP
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
} finally {
    // Cerrar las sentencias preparadas y la conexión (si es necesario)
    if (isset($stmt_activity)) $stmt_activity->close();
    if (isset($stmt_delete)) $stmt_delete->close();
    // La conexión $conn se puede cerrar aquí o dejarla abierta, mysqli la cierra al final del script.
    // $conn->close();
}

?>