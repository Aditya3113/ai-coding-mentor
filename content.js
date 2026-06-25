console.log("AI Coding Mentor: Content script active and waiting for requests!");

// --- EXISTING CONTEXT FETCHER ---
function getProblemContext() {
    const url = window.location.href;
    const rawTitle = document.title;
    const cleanTitle = rawTitle.split('-')[0].trim(); 
    
    let userCode = "Code editor not found or empty.";
    const codeElements = document.querySelectorAll('.view-line');
    
    if (codeElements.length > 0) {
        userCode = Array.from(codeElements)
            .map(line => line.textContent)
            .join('\n');
    }

    return {
        platform: "LeetCode",
        title: cleanTitle,
        url: url,
        code: userCode
    };
}

// --- NEW AUTO-TRACKER OBSERVER ---
const observer = new MutationObserver((mutations) => {
    // This class selector is the current standard for the LeetCode success banner
    const successElement = document.querySelector('.success__3Ai7'); 
    
    if (successElement) {
        const titleElement = document.querySelector('[data-cy="question-title"]');
        if (titleElement) {
            const title = titleElement.innerText.trim();
            // Send the solved problem title to the background script
            chrome.runtime.sendMessage({ action: "PROBLEM_SOLVED", title: title });
            console.log("AI Coding Mentor: Success detected! Syncing solution...");
        }
    }
});

// Start watching the page
observer.observe(document.body, { childList: true, subtree: true });

// --- MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PROBLEM") {
        console.log("Side Panel requested context. Sending data...");
        sendResponse(getProblemContext());
    }
    return true; 
});