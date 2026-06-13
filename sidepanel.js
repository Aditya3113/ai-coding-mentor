document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const statusIndicator = document.getElementById('statusIndicator');

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
                appendMessage("I hear you. I'm waiting to connect to the LLM backend.", false);
            }, 500);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "PROBLEM_DETECTED") {
            const data = message.payload;
            
            chatContainer.innerHTML = ''; 
            
            appendMessage(`👀 I see you are working on: ${data.title}. What's your initial thought process?`, false);
            
            if (statusIndicator) {
                statusIndicator.textContent = "Connected: LeetCode";
                statusIndicator.style.color = "#28a745";
            }
        }
    });
});