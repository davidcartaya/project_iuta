<?php
// Configuración de la cabecera para devolver JSON
header("Content-Type: application/json; charset=UTF-8");

// Incluir la conexión a la base de datos (maneja CORS y errores de conexión)
include 'db.php';

// El middleware de CORS en db.php ya manejó la petición OPTIONS.
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
$data = json_decode(file_get_contents("php://input"));

// Validar que se hayan proporcionado todos los campos necesarios
if (empty($data->nombre) || empty($data->email) || empty($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "error" => "Faltan datos requeridos (nombre, email o contraseña)."]);
    exit();
}

$nombre = trim($data->nombre);
$email = trim($data->email);
$password = $data->password;

// Validar formato básico del email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "El formato del email no es válido."]);
    exit();
}

// Generar el hash de la contraseña de forma segura
$password_hash = password_hash($password, PASSWORD_DEFAULT);
$rol = 'cliente'; // Asignamos el rol por defecto

// --------------------------------------------------------------------------
// 2. VERIFICAR SI EL EMAIL YA EXISTE
// --------------------------------------------------------------------------

$sql_check = "SELECT id FROM usuarios WHERE email = ?";
if ($stmt_check = $conn->prepare($sql_check)) {
    $stmt_check->bind_param("s", $email);
    $stmt_check->execute();
    $stmt_check->store_result();
    
    if ($stmt_check->num_rows > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["success" => false, "error" => "Este email ya está registrado."]);
        $stmt_check->close();
        $conn->close();
        exit();
    }
    $stmt_check->close();
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error al preparar la verificación de email: " . $conn->error]);
    $conn->close();
    exit();
}


// --------------------------------------------------------------------------
// 3. INSERTAR NUEVO USUARIO
// --------------------------------------------------------------------------

$sql_insert = "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)";

if ($stmt_insert = $conn->prepare($sql_insert)) {
    // El rol por defecto es 'cliente', si necesitas 'administrador', debes cambiarlo aquí o en una interfaz de administración.
    $stmt_insert->bind_param("ssss", $nombre, $email, $password_hash, $rol);
    
    if ($stmt_insert->execute()) {
        http_response_code(201); // Created
        echo json_encode(["success" => true, "message" => "Usuario registrado con éxito.", "user_id" => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Error al insertar el usuario: " . $conn->error]);
    }
    $stmt_insert->close();
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error al preparar la sentencia de registro: " . $conn->error]);
}

$conn->close();
?>
