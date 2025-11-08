<?php
// -----------------------------------------------------------
// 1. MANEJO DE CORS (Cross-Origin Resource Sharing)
// -----------------------------------------------------------

// Permite peticiones desde cualquier origen (necesario en desarrollo local)
header("Access-Control-Allow-Origin: *");
// Permite los métodos que usaremos: POST para login/register/logout, y GET (para paquetes)
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// Permite los encabezados personalizados que enviamos (Authorization, X-User-ID)
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID, X-Requested-With");

// Manejo del Preflight Request (petición OPTIONS)
// El navegador envía esto automáticamente antes de un POST/GET complejo.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); // Detiene la ejecución para que el navegador continúe con el POST real
}

// -----------------------------------------------------------
// 2. CONFIGURACIÓN DE CONEXIÓN A MySQL (XAMPP por defecto)
// -----------------------------------------------------------

define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root'); // Usuario por defecto de XAMPP
define('DB_PASSWORD', '');     // Contraseña por defecto de XAMPP (vacía)
define('DB_NAME', 'agencia_viajes_db'); // !!! CAMBIA ESTO AL NOMBRE REAL DE TU DB !!!

// Conectar a MySQL
// Usamos el operador @ para suprimir temporalmente la salida de errores nativos de MySQLi
// que podrían contaminar el JSON si la conexión falla.
$conn = @new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verificar conexión
if ($conn->connect_error) {
    // Si hay error de conexión, se responde con un JSON 500 y se detiene la ejecución
    // Aquí es donde garantizamos que la salida sea un JSON válido
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión a la base de datos: Verifica el nombre de DB y que MySQL esté activo. Detalle: " . $conn->connect_error]));
}

// Establecer el charset a utf8mb4 para el correcto manejo de caracteres
$conn->set_charset("utf8mb4");

// -----------------------------------------------------------
// Nota: Cuando incluyas db.php en login.php, ya no necesitarás 
// repetir las llamadas a header() en login.php para CORS.
// -----------------------------------------------------------
?>