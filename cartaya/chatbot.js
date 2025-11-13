const API_CHATBOT_URL = 'chatbot_backend.php'; 

// Elementos del DOM
const chatWindow = document.getElementById('chat-window');
const chatBubble = document.getElementById('chat-bubble');
const messagesContainer = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const closeChatBtn = document.getElementById('close-chat-btn');
const suggestedActionsContainer = document.getElementById('suggested-actions-container');

let isChatOpen = false;
let isWaitingForResponse = false;

// Función para añadir un mensaje al contenedor
function addMessage(text, sender) {
    // Usamos CSS (float/clear) para la alineación, así que solo agregamos la caja del mensaje
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box', sender === 'bot' ? 'bot-message' : 'user-message');
    
    // Permite negritas con **texto**
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageBox.innerHTML = formattedText;

    messagesContainer.appendChild(messageBox); 
    
    // Asegura que el scroll esté al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Función para mostrar el indicador de 'escribiendo' del bot
function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.classList.add('bot-message', 'message-box'); // Reutiliza la clase de mensaje del bot
    typingIndicator.innerHTML = `
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Función para eliminar el indicador de 'escribiendo'
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Función para mostrar botones de acciones sugeridas
function showSuggestedActions(actions) {
    suggestedActionsContainer.innerHTML = '';
    if (!actions || actions.length === 0) return;

    actions.forEach(action => {
        const button = document.createElement('span');
        button.textContent = action;
        button.className = 'suggested-action';
        button.addEventListener('click', () => {
            handleUserQuery(action);
        });
        suggestedActionsContainer.appendChild(button);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Función principal para manejar la consulta del usuario (AJAX)
async function handleUserQuery(query = userInput.value) {
    query = query.trim();
    if (!query || isWaitingForResponse) return;

    addMessage(query, 'user');
    userInput.value = '';
    suggestedActionsContainer.innerHTML = '';
    isWaitingForResponse = true;
    sendBtn.disabled = true;

    showTypingIndicator();

    try {
        // Llamada AJAX (Requisito 5 y 6)
        const response = await fetch(API_CHATBOT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        removeTypingIndicator(); 

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error HTTP (no 200/201):', response.status, errorText);
            addMessage(`⚠️ Error del servidor (${response.status}). Por favor, revise el archivo PHP.`, 'bot');
            return;
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.text) {
            addMessage(result.data.text, 'bot');
            showSuggestedActions(result.data.suggested_actions);
        } else {
            addMessage(`Disculpa, hubo un problema al generar la respuesta o el backend no envió datos válidos.`, 'bot');
        }

    } catch (error) {
        removeTypingIndicator();
        console.error("Error en la comunicación AJAX:", error);
        addMessage(`❌ Error de conexión. Verifique que el servidor XAMPP/PHP esté activo.`, 'bot');
    } finally {
        isWaitingForResponse = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// --- Manejo de Eventos ---

// Abrir/Cerrar la ventana de chat
chatBubble.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    chatWindow.classList.toggle('open', isChatOpen);
    
    if (isChatOpen) {
        // Iniciar la conversación con el saludo (Requisito 1)
        if (messagesContainer.children.length === 0) {
            handleUserQuery('hola'); 
        }
        userInput.focus();
    }
});

// Botón de cierre dentro de la ventana
closeChatBtn.addEventListener('click', () => {
    isChatOpen = false;
    chatWindow.classList.remove('open');
});

// Botón de enviar mensaje
sendBtn.addEventListener('click', () => handleUserQuery());

// Tecla Enter en el input
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserQuery();
    }
});

// Ocultar la ventana de chat por defecto al cargar
document.addEventListener('DOMContentLoaded', () => {
    chatWindow.classList.remove('open'); 
});