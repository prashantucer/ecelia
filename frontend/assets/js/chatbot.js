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
let messageCount = 0;

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

// Copy message function
function copyMessage(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyToast();
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Show copy toast notification
function showCopyToast() {
    const toast = document.getElementById('copyToast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}

// Update message count
function updateMessageCount() {
    const badge = document.getElementById('messageCount');
    if (badge) {
        const count = document.querySelectorAll('.message').length;
        badge.textContent = `${count} message${count !== 1 ? 's' : ''}`;
    }
}

// Update character counter
function updateCharCounter() {
    const counter = document.getElementById('charCounter');
    const input = document.getElementById('messageInput');
    if (counter && input) {
        const length = input.value.length;
        const maxLength = 500;
        counter.textContent = `${length}/${maxLength}`;
        
        counter.classList.remove('warning', 'error');
        if (length > maxLength * 0.8) {
            counter.classList.add('warning');
        }
        if (length >= maxLength) {
            counter.classList.add('error');
        }
    }
}

// Message handling
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    // Get plain text for copying
    const plainText = isUser ? content : content.replace(/<[^>]*>/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    
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
    
    // Add message actions (copy button)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'message-action-btn';
    copyBtn.innerHTML = '📋';
    copyBtn.title = 'Copy message';
    copyBtn.onclick = () => copyMessage(plainText);
    actionsDiv.appendChild(copyBtn);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(actionsDiv);
    messageDiv.appendChild(timeDiv);
    
    chatMessages.insertBefore(messageDiv, typingIndicator);
    scrollToBottom();
    
    messageCount++;
    updateMessageCount();
    
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

// Clear chat function
function clearChat() {
    if (confirm('Are you sure you want to clear all messages?')) {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            if (!msg.querySelector('.quick-actions')) {
                msg.remove();
            }
        });
        messageCount = 0;
        updateMessageCount();
        scrollToBottom();
    }
}

// Initialize
window.addEventListener('load', async () => {
    messageInput.focus();
    scrollToBottom();
    updateCharCounter();
    updateMessageCount();
    
    // Check connection status
    await checkConnection();
    
    // Check connection every 30 seconds
    setInterval(checkConnection, 30000);
});

// Add event listeners
messageInput.addEventListener('keydown', handleKeyPress);
messageInput.addEventListener('input', (e) => {
    adjustTextarea(e.target);
    updateCharCounter();
});
sendBtn.addEventListener('click', sendMessage);

// Export functions for global use
window.sendMessage = sendMessage;
window.sendQuickQuery = sendQuickQuery;
window.handleKeyPress = handleKeyPress;
window.adjustTextarea = adjustTextarea;
window.clearChat = clearChat;
window.copyMessage = copyMessage;