<?php
// Configuración de la cabecera para devolver JSON
header("Content-Type: application/json; charset=UTF-8");

// Incluir la conexión a la base de datos (maneja CORS y errores de conexión)
include 'db.php';

// Por seguridad, confirmamos que solo aceptamos POST para esta lógica.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido."]);
    exit();
}

// --------------------------------------------------------------------------
// 1. OBTENER Y VALIDAR DATOS DE ENTRADA
// --------------------------------------------------------------------------

// Leer el JSON enviado en el cuerpo de la petición
$input_data = file_get_contents("php://input");
$data = json_decode($input_data);

// Validación de robustez: Si $data es null, el JSON es inválido o el cuerpo está vacío.
if ($data === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Formato de petición JSON inválido."]);
    exit();
}

// Validar que se hayan proporcionado email y contraseña
if (empty($data->email) || empty($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "error" => "Faltan credenciales de email o contraseña."]);
    exit();
}

$email = $data->email;
$password = $data->password;
$user_id = null;
$nombre = null;
$rol = null;

// --------------------------------------------------------------------------
// 2. BUSCAR USUARIO Y VERIFICAR CONTRASEÑA
// --------------------------------------------------------------------------

// Usar sentencia preparada para prevenir inyección SQL
$sql = "SELECT id, nombre, password_hash, rol FROM usuarios WHERE email = ?";

if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    
    // Si se encontró el usuario
    if ($stmt->num_rows == 1) {
        $stmt->bind_result($user_id, $nombre, $hashed_password, $rol);
        $stmt->fetch();
        
        // Verificar la contraseña
        if (password_verify($password, $hashed_password)) {
            // Contraseña correcta: Generar token de sesión
            
            // --------------------------------------------------------------------------
            // 3. GENERACIÓN DE TOKEN Y SESIÓN ÚNICA
            // --------------------------------------------------------------------------
            
            $session_token = bin2hex(random_bytes(32)); // Genera un token seguro
            // Usamos 'last_activity' en lugar de 'expires_at' para coincidir con la estructura de tu DB.
            $last_activity = date('Y-m-d H:i:s', time() + 3600); // Expira en 1 hora
            
            // Corregido: Usamos 'last_activity' en lugar de 'expires_at'
            $sql_session = "REPLACE INTO sesiones (usuario_id, session_token, last_activity) VALUES (?, ?, ?)";
            
            if ($stmt_session = $conn->prepare($sql_session)) {
                // 'i' para integer (user_id), 's' para string (token), 's' para string (last_activity)
                // Usamos $last_activity en el bind_param
                $stmt_session->bind_param("iss", $user_id, $session_token, $last_activity); 
                
                if ($stmt_session->execute()) {
                    // Éxito: Devolver datos de sesión
                    http_response_code(200);
                    echo json_encode([
                        "success" => true,
                        "message" => "Inicio de sesión exitoso.",
                        "session_token" => $session_token,
                        "user_id" => $user_id,
                        "nombre" => $nombre,
                        "rol" => $rol
                    ]);
                } else {
                    http_response_code(500);
                    // Devolvemos el error de la base de datos si falla la sentencia
                    echo json_encode(["success" => false, "error" => "No se pudo crear la sesión en la base de datos: " . $stmt_session->error]);
                }
                $stmt_session->close();
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Error al preparar la sentencia de sesión: " . $conn->error]);
            }

        } else {
            // Contraseña incorrecta
            http_response_code(401); // Unauthorized
            echo json_encode(["success" => false, "error" => "Credenciales inválidas (contraseña)."]);
        }
    } else {
        // Usuario no encontrado
        http_response_code(401); // Unauthorized
        echo json_encode(["success" => false, "error" => "Credenciales inválidas (usuario no encontrado)."]);
    }
    
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error al preparar la sentencia de usuario: " . $conn->error]);
}

$conn->close();
?>
