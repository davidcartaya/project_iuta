<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type");
// Configuración de la conexión a la base de datos
$servername = "localhost";
$username = "root"; // Usuario por defecto de XAMPP
$password = "";     // Contraseña por defecto de XAMPP
$dbname = "agencia_viajes_db"; // El nombre de la base de datos que creaste

header('Content-Type: application/json');

// Conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode(['error' => 'Error de conexión a la BD: ' . $conn->connect_error]);
    exit();
}

// Obtener los datos JSON enviados desde JavaScript
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data) || !isset($data['total_pedido']) || !isset($data['items'])) {
    echo json_encode(['error' => 'Datos inválidos recibidos.']);
    exit();
}

$total_pedido = $data['total_pedido'];
$items = $data['items'];

// ----------------------------------------------------------
// 1. INICIAR TRANSACCIÓN para asegurar que ambas tablas se actualicen
// ----------------------------------------------------------
$conn->begin_transaction();
$success = true;

try {
    // ----------------------------------------------------------
    // 2. INSERTAR EN LA TABLA PEDIDOS
    // ----------------------------------------------------------
    $stmt_pedido = $conn->prepare("INSERT INTO pedidos (total_pedido) VALUES (?)");
    $stmt_pedido->bind_param("d", $total_pedido); // 'd' por decimal/double

    if (!$stmt_pedido->execute()) {
        throw new Exception("Error al crear el pedido: " . $stmt_pedido->error);
    }

    $pedido_id = $conn->insert_id;
    $stmt_pedido->close();

    // ----------------------------------------------------------
    // 3. INSERTAR EN LA TABLA DETALLE_PEDIDO
    // ----------------------------------------------------------
    $stmt_detalle = $conn->prepare("INSERT INTO detalle_pedido (pedido_id, paquete_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
    
    foreach ($items as $item) {
        $paquete_id = $item['id'];
        $cantidad = $item['quantity'];
        $precio_unitario = $item['price'];

        // 'i' por int, 'i' por int, 'i' por int, 'd' por decimal/double
        $stmt_detalle->bind_param("iiid", $pedido_id, $paquete_id, $cantidad, $precio_unitario);
        
        if (!$stmt_detalle->execute()) {
            throw new Exception("Error al insertar detalle del pedido para paquete ID: " . $paquete_id . " - " . $stmt_detalle->error);
        }
    }
    
    $stmt_detalle->close();

    // ----------------------------------------------------------
    // 4. CONFIRMAR TRANSACCIÓN
    // ----------------------------------------------------------
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Pedido creado con éxito.', 'pedido_id' => $pedido_id]);

} catch (Exception $e) {
    // 5. REVERTIR TRANSACCIÓN en caso de error
    $conn->rollback();
    http_response_code(500); // Enviar código de error HTTP
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>