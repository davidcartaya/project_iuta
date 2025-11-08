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
    debugger
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

// Cerrar modal al hacer clic en X
closeBtn.addEventListener('click', () => modal.style.display = 'none');

// Cerrar modal al hacer clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Inicializar: Cargar los paquetes al iniciar la aplicación
document.addEventListener('DOMContentLoaded', fetchPaquetes);