CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    -- ENUM es más eficiente para roles en MySQL
    rol ENUM('cliente', 'administrador') NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE sesiones (
    usuario_id INT PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Admin Cartaya', 'admin@viajes.com', '$2y$10$wT0v1gD.7c3X0X6l1z2H/e5kP.Nf2wG0gJ.Nf2wG0gJ', 'administrador');

INSERT INTO paquetes (nombre, ruta, fecha_viaje, precio, descripcion, imagen_url) VALUES
('Caribe Esmeralda', 'Cancún, México', '2025-11-15', 850.00, 'Una semana en playas vírgenes con todo incluido.', 'https://placehold.co/400x200/0077ff/ffffff?text=Playa'),
('Aventura Alpina', 'Alpes Suizos', '2025-12-20', 1200.50, 'Esquí y senderismo en los picos más altos de Europa.', 'https://placehold.co/400x200/555/ffffff?text=Montaña'),
('Ruta Imperial', 'Roma, Italia', '2026-01-10', 950.00, 'Visita guiada por el Coliseo y el Vaticano.', 'https://placehold.co/400x200/555/ffffff?text=Ciudad');