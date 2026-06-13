document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    function appendMessage(text, isUser = true) {
        if (!text.trim()) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'system-message');
        messageDiv.textContent = text;

        chatContainer.appendChild(messageDiv);
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    sendBtn.addEventListener('click', () => {
        const text = userInput.value;
        if (text.trim() !== '') {
            appendMessage(text, true);
            userInput.value = '';
            
            setTimeout(() => {
                appendMessage("I hear you. I'm not connected to the backend yet, but I'll be ready to review your code soon!", false);
            }, 500);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
});