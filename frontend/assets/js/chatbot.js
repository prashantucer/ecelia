// Initialize API client
// Initialize API client
const API_URL = 'http://localhost:3000';
const eceliaAPI = new EceliaAPI(API_URL);

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// State management
let isWaitingForResponse = false;

// Utility functions
function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function adjustTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

// Message handling
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    if (isUser) {
        bubbleDiv.textContent = content;
    } else {
        // Support basic markdown formatting for bot messages
        bubbleDiv.innerHTML = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeDiv);
    
    chatMessages.insertBefore(messageDiv, typingIndicator);
    scrollToBottom();
    
    return messageDiv;
}

// Typing indicator functions
function showTyping() {
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

// Main send message function
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;

    // Disable input while processing
    isWaitingForResponse = true;
    sendBtn.disabled = true;
    messageInput.disabled = true;

    // Add user message
    addMessage(message, true);
    
    // Clear input
    messageInput.value = '';
    adjustTextarea(messageInput);
    
    // Show typing indicator
    showTyping();
    
    try {
        // Send to API
        const response = await eceliaAPI.sendMessage(message);
        
        // Hide typing and add bot response
        hideTyping();
        addMessage(response);
        
    } catch (error) {
        console.error('Send message error:', error);
        hideTyping();
        addMessage("Oops! Something went wrong. Please try again! 😊");
    } finally {
        // Re-enable input
        isWaitingForResponse = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

// Quick reply function
async function sendQuickQuery(query) {
    if (isWaitingForResponse) return;
    
    // Set the input value and send
    messageInput.value = query;
    await sendMessage();
}

// Event handlers
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Connection status checker
async function checkConnection() {
    const statusIndicator = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-indicator span');
    
    if (!statusIndicator || !statusText) return;
    
    const isHealthy = await eceliaAPI.healthCheck();
    
    if (isHealthy) {
        statusIndicator.style.background = '#4ade80';
        statusText.textContent = 'Online';
    } else {
        statusIndicator.style.background = '#f87171';
        statusText.textContent = 'Offline';
    }
}

// Initialize
window.addEventListener('load', async () => {
    messageInput.focus();
    scrollToBottom();
    
    // Check connection status
    await checkConnection();
    
    // Check connection every 30 seconds
    setInterval(checkConnection, 30000);
});

// Add event listeners
messageInput.addEventListener('keydown', handleKeyPress);
messageInput.addEventListener('input', (e) => adjustTextarea(e.target));
sendBtn.addEventListener('click', sendMessage);

// Export functions for global use
window.sendMessage = sendMessage;
window.sendQuickQuery = sendQuickQuery;
window.handleKeyPress = handleKeyPress;
window.adjustTextarea = adjustTextarea;