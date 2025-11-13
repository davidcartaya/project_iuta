// Selecciona elementos
const paquetesGrid = document.getElementById('paquetes-grid');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('close');

// Campos del modal
const modalTitle = document.getElementById('modal-title');
const modalRoute = document.getElementById('modal-route');
const modalDate = document.getElementById('modal-date');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');

// Elementos del Carrito
const cartIcon = document.querySelector('.cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartCount = document.getElementById('cart-count');
const cartItemsList = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
// 💡 NUEVO ELEMENTO
const createOrderBtn = document.getElementById('create-order-btn'); 

// 💡 NUEVOS SELECTORES PARA EL LOGOUT
const logoutBtn = document.querySelector('.logout-btn');
const LOGIN_PAGE = 'login.html'; // Nombre de tu página de inicio de sesión
const API_BASE_URL = 'http://localhost/cartaya/'; // ¡Asegúrate de que esta URL sea correcta!

const headerLogo = document.getElementById('header-logo');
const loggedInActions = document.getElementById('logged-in-actions');
const loggedOutActions = document.getElementById('logged-out-actions');

// 💡 NUEVOS SELECTORES PARA EL CARRUSEL
const carouselTrack = document.getElementById('carousel-track');
const prevButton = document.getElementById('carousel-prev');
const nextButton = document.getElementById('carousel-next');

let cart = []; // Array para almacenar los ítems del carrito
let allPaquetes = []; // Almacenará los datos de la BD

// ----------------------------------------------------
// ## 1. Lógica de Carga de Datos desde PHP/MySQL
// ----------------------------------------------------

async function fetchPaquetes() {
    try {
        // Asegúrate de que esta URL apunte correctamente a tu servidor XAMPP
        const response = await fetch('http://localhost/cartaya/fetch_paquetes.php');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        allPaquetes = await response.json();
        
        if (allPaquetes.error) {
            console.error("Error del servidor:", allPaquetes.error);
            paquetesGrid.innerHTML = '<p>Error al cargar los paquetes. Verifica la conexión a la BD.</p>';
            return;
        }

        renderPaquetes(allPaquetes); // Renderiza las tarjetas una vez que los datos llegan
        renderCarousel(allPaquetes.slice(0, 5));
        attachEventListeners(); // Asocia los listeners una vez que las tarjetas existen
        
    } catch (error) {
        console.error("No se pudo obtener los paquetes:", error);
        paquetesGrid.innerHTML = '<p>No se pudieron cargar los paquetes. Verifica que XAMPP esté corriendo y el archivo fetch_paquetes.php exista.</p>';
    }
}

// ----------------------------------------------------
// ## 2. Renderizado de Paquetes
// ----------------------------------------------------

function renderPaquetes(paquetes) {
    paquetesGrid.innerHTML = ''; // Limpiar cualquier contenido existente

    paquetes.forEach(paquete => {
        // Formateo simple para la fecha, asumiendo que viene como YYYY-MM-DD
        const displayDate = new Date(paquete.fecha_viaje).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const cardHTML = `
            <article class="card" 
                data-id="${paquete.id}"
                data-name="${paquete.nombre}"
                data-route="${paquete.ruta}"
                data-date="${displayDate}"
                data-price="${paquete.precio}"
                data-desc="${paquete.descripcion}"
                data-img="${paquete.imagen_url}">
                
                <img src="${paquete.imagen_url}" alt="${paquete.nombre}">
                <h3>${paquete.nombre}</h3>
                <p>Ruta: ${paquete.ruta}</p>
                <p>Fecha: ${displayDate}</p>
                <p class="price">$${parseFloat(paquete.precio).toFixed(2)}</p>
                <div class="card-actions">
                    <button class="btn btn-details">Ver detalles</button>
                    <button class="btn btn-cart add-cart" data-id="${paquete.id}">Añadir al carrito</button>
                </div>
            </article>
        `;
        // Insertar la tarjeta en la cuadrícula
        paquetesGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ----------------------------------------------------
// ## 3. Asignación de Eventos y Modal
// ----------------------------------------------------

function attachEventListeners() {
    const cards = document.querySelectorAll('.card');
    
    // Asignar eventos para "Ver detalles"
    cards.forEach(card => {
        const detailButton = card.querySelector('.btn-details');

        if (detailButton) {
            detailButton.addEventListener('click', () => {
                // Rellena el modal con los datos de la tarjeta (atributos data-*)
                modalTitle.textContent = card.dataset.name;
                modalRoute.textContent = card.dataset.route;
                modalDate.textContent = card.dataset.date;
                // Asegura que el precio se muestre correctamente formateado
                modalPrice.textContent = `$${parseFloat(card.dataset.price).toFixed(2)}`;
                modalDesc.textContent = card.dataset.desc;

                // Muestra el modal (CSS lo hace desaparecer con display: none)
                modal.style.display = 'flex';
            });
        }
        
        // Asignar eventos para "Añadir al carrito"
        const addButton = card.querySelector('.add-cart');
        if (addButton) {
            addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = card.dataset.id;
                const name = card.dataset.name;
                const price = parseFloat(card.dataset.price);

                addToCart({ id, name, price });
            });
        }
    });
}

// ----------------------------------------------------
// ## 4. Funcionalidad del Carrito
// ----------------------------------------------------

function addToCart(itemToAdd) {
    const existingItem = cart.find(item => item.id === itemToAdd.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...itemToAdd, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    cartItemsList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} ($${item.price.toFixed(2)}) x${item.quantity}`;
        cartItemsList.appendChild(li);
        total += item.price * item.quantity;
    });

    cartTotalSpan.textContent = total.toFixed(2);
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Si quieres que el carrito se abra al añadir, puedes descomentar la línea de abajo
    // cartSidebar.classList.add('open');
}

// ----------------------------------------------------
// ## 5. Lógica de Creación de Pedido
// ----------------------------------------------------

async function createOrder() {
    if (cart.length === 0) {
        alert('El carrito está vacío. Añade paquetes antes de crear un pedido.');
        return;
    }

    const total = parseFloat(cartTotalSpan.textContent);
    
    // Preparar los datos que se enviarán al servidor
    const orderData = {
        total_pedido: total,
        items: cart // Enviamos los detalles del carrito
    };
    debugger
    try {
        const response = await fetch('http://localhost/cartaya/create_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Pedido creado con éxito! ID de Pedido: ${result.pedido_id}. Total: $${total.toFixed(2)}`);
            // Limpiar el carrito después de un pedido exitoso
            cart = [];
            updateCartUI();
            cartSidebar.classList.remove('open'); // Cerrar sidebar
        } else {
            // Manejar errores del servidor o base de datos
            alert(`Error al crear el pedido: ${result.error || 'Error desconocido'}`);
        }

    } catch (error) {
        console.error('Error de conexión o proceso:', error);
        alert('Error de conexión con el servidor. Verifica XAMPP.');
    }
}

// ----------------------------------------------------
// ## 6. Asignación de Evento al Botón de Pedido
// ----------------------------------------------------

createOrderBtn.addEventListener('click', createOrder);

// Toggle (mostrar/ocultar) el carrito lateral
cartIcon.addEventListener('click', () => {
    cartSidebar.classList.toggle('open');
});

// ----------------------------------------------------
// ## GESTIÓN DE LA AUTENTICACIÓN EN EL HOME
// ----------------------------------------------------

function checkAuthAndRenderUI() {
    debugger
    const userNombre = localStorage.getItem('user_nombre');
    const sessionToken = localStorage.getItem('session_token');
    
    // Si el usuario está logueado
    if (sessionToken && userNombre) {
        // 1. Mostrar nombre en el logo
        const firstName = userNombre.split(' ')[0];
        headerLogo.innerHTML = `👋 ${firstName}`;

        // 2. Mostrar acciones de logueado (Cerrar Sesión y Carrito)
        loggedInActions.style.display = 'flex';
        // 3. Ocultar Iniciar Sesión
        loggedOutActions.style.display = 'none';

        // 4. Habilitar la creación de pedidos
        createOrderBtn.disabled = false;
        
    } else {
        // Si NO está logueado
        // 1. Mostrar logo por defecto
        headerLogo.innerHTML = '🌍 Agencia Viajes';

        // 2. Ocultar acciones de logueado
        loggedInActions.style.display = 'none';
        // 3. Mostrar botón de Iniciar Sesión
        loggedOutActions.style.display = 'block';

        // 4. Deshabilitar la creación de pedidos
        createOrderBtn.disabled = true;
    }
}


// ----------------------------------------------------
// ## 7. LÓGICA DE CIERRE DE SESIÓN (NUEVO)
// ----------------------------------------------------

async function handleLogout() {
    debugger
    // 1. Obtener el token para notificar al servidor
    const sessionToken = localStorage.getItem('session_token');

    if (sessionToken) {
        try {
            // Llama a PHP para registrar la última actividad y limpiar el token en la BD
            const response = await fetch(API_BASE_URL + 'logout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: sessionToken })
            });

            // No es crítico si falla la respuesta del servidor, pero es bueno saberlo.
            if (!response.ok) {
                console.warn("Advertencia: El servidor no pudo registrar la última actividad correctamente.");
            }
            // Puedes leer la respuesta si quieres un mensaje de éxito del servidor
            // const result = await response.json(); 

        } catch (error) {
            console.error('Error al conectar con logout.php:', error);
            // El proceso continúa, ya que la prioridad es cerrar la sesión del cliente.
        }
    }

    // 2. Limpiar todos los datos de sesión del navegador
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_rol');
    localStorage.removeItem('user_nombre');

    // 3. Redirigir al usuario
    alert('Sesión cerrada exitosamente.'); // Mensaje opcional
    window.location.href = LOGIN_PAGE;
}

function renderCarousel(paquetes) {
    carouselTrack.innerHTML = ''; // Limpiar
    
    paquetes.forEach(paquete => {
        const displayDate = new Date(paquete.fecha_viaje).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        // Nota: Se utiliza la clase 'carousel-item' en lugar de 'card' para estilos
        const itemHTML = `
            <article class="carousel-item" 
                data-id="${paquete.id}"
                data-name="${paquete.nombre}"
                data-route="${paquete.ruta}"
                data-date="${displayDate}"
                data-price="${paquete.precio}"
                data-desc="${paquete.descripcion}"
                data-img="${paquete.imagen_url}">
                
                <img src="${paquete.imagen_url}" alt="${paquete.nombre}">
                <h3>${paquete.nombre}</h3>
                <p>${paquete.ruta}</p>
                <p class="price">$${parseFloat(paquete.precio).toFixed(2)}</p>
                <div class="card-actions">
                    <button class="btn btn-details">Ver detalles</button>
                    <button class="btn btn-cart add-cart" data-id="${paquete.id}">Añadir</button>
                </div>
            </article>
        `;
        carouselTrack.insertAdjacentHTML('beforeend', itemHTML);
    });

    // Se debe volver a llamar a attachEventListeners para que los nuevos botones funcionen
    // En este caso, haremos una función específica para solo el carrusel.
    attachCarouselEvents(); 
}

// ----------------------------------------------------
// ## 9. Lógica de Navegación y Eventos del Carrusel (NUEVO)
// ----------------------------------------------------

function attachCarouselEvents() {
    // Reutilizar la lógica de detalles y carrito para los ítems del carrusel
    const carouselItems = document.querySelectorAll('.carousel-item');
    carouselItems.forEach(item => {
        const detailButton = item.querySelector('.btn-details');
        const addButton = item.querySelector('.add-cart');

        // Detalles (Reutiliza la lógica del modal)
        if (detailButton) {
            detailButton.addEventListener('click', () => {
                // Rellena el modal con los datos del ítem del carrusel
                modalTitle.textContent = item.dataset.name;
                modalRoute.textContent = item.dataset.route;
                modalDate.textContent = item.dataset.date;
                modalPrice.textContent = `$${parseFloat(item.dataset.price).toFixed(2)}`;
                modalDesc.textContent = item.dataset.desc;
                modal.style.display = 'flex';
            });
        }
        
        // Carrito (Reutiliza la lógica del carrito)
        if (addButton) {
            addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = item.dataset.id;
                const name = item.dataset.name;
                const price = parseFloat(item.dataset.price);
                addToCart({ id, name, price });
            });
        }
    });
}

// Lógica de desplazamiento manual
const scrollAmount = 300; // Ajusta este valor al ancho de tus tarjetas (aprox)

prevButton.addEventListener('click', () => {
    carouselTrack.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
    });
});

nextButton.addEventListener('click', () => {
    carouselTrack.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
});

// Cerrar modal al hacer clic en X
closeBtn.addEventListener('click', () => modal.style.display = 'none');

// Cerrar modal al hacer clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

if (logoutBtn) {
    debugger
    logoutBtn.addEventListener('click', handleLogout);
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRenderUI(); 
    fetchPaquetes();
});