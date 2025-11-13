const API_BASE_URL = 'http://localhost/cartaya/';
const INDEX_PAGE = 'index.html';

const createPackageForm = document.getElementById('create-package-form');
const adminMessage = document.getElementById('admin-message');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Función auxiliar para mostrar mensajes
function showAdminMessage(message, type = 'success') {
    adminMessage.textContent = message;
    adminMessage.className = `message-box ${type}`;
    adminMessage.style.display = 'block';
}

// ----------------------------------------------------
// ## 1. VERIFICACIÓN DE ROL AL CARGAR
// ----------------------------------------------------

function checkAdminAccess() {
    const userRol = localStorage.getItem('user_rol');
    
    if (userRol !== 'administrador') {
        alert('Acceso denegado. Solo administradores pueden ver esta página.');
        window.location.href = INDEX_PAGE;
        return false;
    }
    return true;
}

// ----------------------------------------------------
// ## 2. MANEJO DE CIERRE DE SESIÓN
// ----------------------------------------------------

async function handleAdminLogout() {
    // Lógica para cerrar la sesión localmente (y opcionalmente en el servidor)
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_rol');
    localStorage.removeItem('user_nombre');

    // Redirigir al index (que ahora mostrará el botón de login)
    window.location.href = INDEX_PAGE;
}

// ----------------------------------------------------
// ## 3. ENVÍO DEL FORMULARIO
// ----------------------------------------------------

async function handleCreatePackage(e) {
    debugger
    e.preventDefault();
    if (!checkAdminAccess()) return; // Re-verificar seguridad
    
    showAdminMessage('Guardando paquete...', 'default');

    const newPackageData = {
        nombre: document.getElementById('package-nombre').value,
        ruta: document.getElementById('package-ruta').value,
        fecha_viaje: document.getElementById('package-fecha').value,
        precio: parseFloat(document.getElementById('package-precio').value),
        descripcion: document.getElementById('package-descripcion').value,
        imagen_url: document.getElementById('package-imagen-url').value,
        // Incluir token para validar la sesión en el servidor
        session_token: localStorage.getItem('session_token')
    };
    
    // Simple validación de precio
    if (isNaN(newPackageData.precio) || newPackageData.precio <= 0) {
        showAdminMessage('El precio debe ser un número positivo.', 'error');
        return;
    }
    debugger
    try {
        const response = await fetch(API_BASE_URL + 'create_package.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPackageData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showAdminMessage('🎉 Paquete creado con éxito! Se mostrará en el Index.', 'success');
            createPackageForm.reset(); // Limpiar formulario
        } else {
            showAdminMessage(result.error || 'Error al crear el paquete.', 'error');
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        showAdminMessage('Error de conexión con el servidor.', 'error');
    }
}

// ----------------------------------------------------
// ## 4. INICIALIZACIÓN
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ejecutar la verificación de acceso al cargar
    if (checkAdminAccess()) {
        // 2. Asignar Event Listeners solo si el acceso es concedido
        if (createPackageForm) createPackageForm.addEventListener('submit', handleCreatePackage);
        if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
});