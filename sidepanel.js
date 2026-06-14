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

    function fetchProblemContext() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id) return;

            chrome.tabs.sendMessage(
                activeTab.id, 
                { action: "GET_PROBLEM" }, 
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("Not on a supported coding page.");
                        return;
                    }
                    
                    if (response) {
                        chatContainer.innerHTML = ''; 
                        appendMessage(`👀 I see you are working on: ${response.title}. What's your initial thought process?`, false);
                        
                        if (statusIndicator) {
                            statusIndicator.textContent = "Connected: LeetCode";
                            statusIndicator.style.color = "#28a745"; 
                        }
                    }
                }
            );
        });
    }

    fetchProblemContext();
});