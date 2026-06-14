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
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            
            if (!activeTab || !activeTab.id || !activeTab.url.includes("leetcode.com/problems/")) {
                return;
            }

            chrome.tabs.sendMessage(
                activeTab.id, 
                { action: "GET_PROBLEM" }, 
                (response) => {
                    if (chrome.runtime.lastError) return;
                    
                    if (response) {
                        chatContainer.innerHTML = ''; 
                        
                        console.log("Extracted Code:\n", response.code);

                        appendMessage(`👀 I see you are working on: ${response.title}.`, false);
                        
                        if (response.code.includes("class Solution") || response.code.length > 20) {
                            appendMessage("I've read your current code. What part of the logic are you stuck on?", false);
                        } else {
                            appendMessage("I see an empty editor. What's your initial thought process?", false);
                        }
                        
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