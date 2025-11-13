<?php

header("Content-Type: application/json; charset=UTF-8");

// Incluir la conexión a la base de datos (maneja CORS y errores de conexión)
include 'db.php';
// Aseguramos la respuesta como JSON
header('Content-Type: application/json');
// Permitir solicitudes desde cualquier origen para pruebas (debes restringirlo en producción)
header('Access-Control-Allow-Origin: *'); 

// Función de respuesta JSON (asumiendo que viene de db.php, sino la definimos)
if (!function_exists('sendResponse')) {
    function sendResponse($success, $data, $conn = null, $httpCode = 200) {
        if ($conn) { $conn->close(); }
        http_response_code($httpCode);
        echo json_encode(["success" => $success, "data" => $data]);
        exit();
    }
}
// --- FIN DE SECCIÓN ASUMIDA DE DB.PHP ---

// Aseguramos que la variable $conn esté disponible globalmente (si viene de db.php)
if (!isset($conn)) {
     // Si $conn no está definida, es porque no se incluyó db.php.
     // Se debe usar la conexión definida en la sección asumida o fallar.
     // Por seguridad, si no está definida, asumimos una conexión local para las funciones.
     global $conn;
     if (!defined('DB_SERVER')) {
         // Fallo si no se ha definido la conexión
         sendResponse(false, ["text" => "Error: Configuración de la base de datos faltante."], null, 500);
     }
}


// Leer la consulta del usuario enviada por AJAX (POST)
$data = json_decode(file_get_contents("php://input"), true);
$userQuery = $data['query'] ?? '';

// Comprobación inicial de consulta vacía
if (empty($userQuery)) {
     sendResponse(false, ["text" => "No se recibió ninguna consulta."], $conn, 400);
}


// Función para obtener los paquetes disponibles de la DB
function getAvailablePackages($conn) {
    // Si la conexión falló o no existe, devolvemos array vacío
    if (!$conn || $conn->connect_error) {
        return [];
    }
    
    // Consulta SQL LIMITADA para no sobrecargar
    $sql = "SELECT nombre, ruta, fecha_viaje, precio, descripcion FROM paquetes LIMIT 5";
    $result = $conn->query($sql);
    
    $paquetes = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $paquetes[] = $row;
        }
    }
    return $paquetes;
}

// Función para generar la respuesta del asistente basada en la consulta
function generateBotResponse($query, $conn) {
    $query = strtolower(trim($query));
    
    // --- Lógica de Respuestas Rápidas (Requisito 3) ---

    if (strpos($query, 'hola') !== false || strpos($query, 'ayuda') !== false) {
        // Requisito 1: Saludo y ofrecimiento de ayuda
        return [
            "text" => "¡Hola! Soy Geo, tu asistente virtual de viajes. Estoy aquí para ayudarte a planificar tu próxima aventura. ¿Qué te gustaría saber hoy? Puedes preguntar por '**paquetes disponibles**' o por información de '**reservas**'.",
            "suggested_actions" => ["Paquetes disponibles", "¿Cómo reservo?", "Tengo otra pregunta"]
        ];
    }

    if (strpos($query, 'paquetes') !== false || strpos($query, 'destinos') !== false) {
        // Requisito 2: Mostrar opciones de viaje de la DB
        $paquetes = getAvailablePackages($conn);
        if (empty($paquetes)) {
            return ["text" => "Lo siento, actualmente no tenemos paquetes disponibles. Inténtalo más tarde.", "suggested_actions" => []];
        }

        $response_text = "¡Claro! Estos son algunos de nuestros paquetes destacados:\n\n";
        
        foreach ($paquetes as $pkg) {
            // Formatear precio para mejor lectura
            $precio_format = number_format((float)$pkg['precio'], 2, '.', ','); // Corregido formato a punto decimal y coma separador de miles
            $fecha_display = date('d/m/Y', strtotime($pkg['fecha_viaje']));
            
            $response_text .= "✈️ **{$pkg['nombre']}** ({$pkg['ruta']})\n";
            $response_text .= "- Fecha: {$fecha_display}\n";
            $response_text .= "- Precio: {$precio_format} USD\n";
            $response_text .= "- Descripción: " . substr($pkg['descripcion'], 0, 80) . "...\n\n";
        }
        $response_text .= "¿Te interesa alguno de ellos o prefieres que busquemos algo más específico?";
        
        return [
            "text" => $response_text,
            "suggested_actions" => ["¿Qué incluye un paquete?", "¿Hay descuentos?"]
        ];
    }

    if (strpos($query, 'incluye') !== false || strpos($query, 'detalles') !== false) {
        // Requisito 3: Responder preguntas comunes (paquete)
        return [
            "text" => "Nuestros paquetes suelen incluir: Vuelos de ida y vuelta, alojamiento por 7 noches, desayuno diario y un tour guiado a elegir. ¡Los detalles exactos están en la página de cada paquete!",
            "suggested_actions" => ["¿Cómo reservo?", "¿Hay descuentos?"]
        ];
    }

    if (strpos($query, 'descuentos') !== false || strpos($query, 'ofertas') !== false) {
        // Requisito 3: Responder preguntas comunes (descuentos)
        return [
            "text" => "¡Sí! Ofrecemos un **10% de descuento** si reservas con más de 90 días de anticipación y tenemos ofertas de última hora en nuestra página principal. ¡Estaremos atentos!",
            "suggested_actions" => ["Paquetes disponibles", "¿Cómo reservo?"]
        ];
    }
    
    if (strpos($query, 'reservo') !== false || strpos($query, 'reserva') !== false) {
        // Requisito 3: Responder preguntas comunes (reserva)
        return [
            "text" => "¡Reservar es fácil! Simplemente selecciona el paquete que te interesa en la lista, haz clic en 'Añadir al carrito' y crea tu pedido. Un agente te contactará para finalizar el pago y confirmar.",
            "suggested_actions" => ["Paquetes disponibles", "Contáctame con un agente"]
        ];
    }

    // --- Respuesta por defecto (Requisito 4) ---
    return [
        "text" => "Gracias por tu pregunta. Si necesitas más información, por favor intenta preguntar por '**paquetes disponibles**', '**descuentos**' o '**reservas**'.",
        "suggested_actions" => ["Paquetes disponibles", "¿Cómo reservo?"]
    ];
}

$response = generateBotResponse($userQuery, $conn);

// Enviar la respuesta como JSON
sendResponse(true, $response, $conn);
?>