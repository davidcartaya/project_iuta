// ----------------------------------------------------
// SELECTORES Y CONFIGURACIÓN
// ----------------------------------------------------
const API_BASE_URL = 'http://localhost/cartaya/'; // ¡AJUSTA ESTA URL!
const INDEX_PAGE = 'index.html'; // Página de destino al loguearse

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');

// ----------------------------------------------------
// UTILS DE AUTENTICACIÓN
// ----------------------------------------------------

// Nota: Sustituir alert() por un modal custom en un entorno de producción.
function showAuthMessage(message, type = 'error') {
    authMessage.textContent = message;
    authMessage.className = `message-box ${type}`;
    authMessage.style.display = 'block';
    setTimeout(() => {
        authMessage.style.display = 'none';
    }, 4000);
}

function saveAuthData(data) {
    debugger
    localStorage.setItem('session_token', data.session_token);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_rol', data.rol);
    localStorage.setItem('user_nombre', data.nombre);
}

// ----------------------------------------------------
// HANDLERS
// ----------------------------------------------------

async function handleLogin(e) {
    debugger
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(API_BASE_URL + 'login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            saveAuthData(result);
            showAuthMessage(`Bienvenido, ${result.nombre}! Redireccionando...`, 'success');
            
            // Redirección al index principal
            setTimeout(() => {
                window.location.href = INDEX_PAGE; 
            }, 500);

        } else {
            showAuthMessage(result.error || 'Fallo en la conexión o credenciales inválidas.');
        }

    } catch (error) {
        console.error('Error de red durante el login:', error);
        showAuthMessage('Error de conexión con el servidor (Verifica XAMPP).');
    }
}

async function handleRegister(e) {
    debugger
    e.preventDefault();
    const nombre = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(API_BASE_URL + 'register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showAuthMessage('Registro exitoso! Por favor, inicia sesión.', 'success');
            // Vuelve a mostrar el formulario de login
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'flex';
        } else {
            showAuthMessage(result.error || 'Fallo en el registro.');
        }

    } catch (error) {
        console.error('Error de red durante el registro:', error);
        showAuthMessage('Error de conexión con el servidor (Verifica XAMPP).');
    }
}


// ----------------------------------------------------
// ASIGNACIÓN DE EVENTOS
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Alternar formularios de Login/Registro
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });
});