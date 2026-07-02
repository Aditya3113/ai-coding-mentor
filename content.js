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

// --- THEME INJECTOR ---
const THEMES = {
    "monokai": `
        :root {
            --lc-color-global-bg: #272822 !important;
            --lc-color-global-text: #f8f8f2 !important;
            --lc-color-layer-1: #1e1f1c !important;
            --lc-color-layer-2: #272822 !important;
            --lc-color-fill-3: #3e3d32 !important;
        }
    `,
    "github": `
        :root {
            --lc-color-global-bg: #0d1117 !important;
            --lc-color-global-text: #c9d1d9 !important;
            --lc-color-layer-1: #010409 !important;
            --lc-color-layer-2: #161b22 !important;
            --lc-color-fill-3: #21262d !important;
        }
    `,
    "dracula": `
        :root {
            --lc-color-global-bg: #282a36 !important;
            --lc-color-global-text: #f8f8f2 !important;
            --lc-color-layer-1: #191a21 !important;
            --lc-color-layer-2: #282a36 !important;
            --lc-color-fill-3: #44475a !important;
        }
    `
};

function applyTheme(themeName) {
    let styleTag = document.getElementById('ai-mentor-theme');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'ai-mentor-theme';
        document.head.appendChild(styleTag);
    }
    
    if (themeName === "default" || !THEMES[themeName]) {
        styleTag.innerHTML = '';
    } else {
        styleTag.innerHTML = THEMES[themeName];
    }
}

// --- UPDATED MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PROBLEM") {
        sendResponse(getProblemContext());
    } else if (request.action === "APPLY_THEME") {
        applyTheme(request.theme);
        sendResponse({ success: true });
    } else if (request.action === "FORMAT_CODE") {
        // Placeholder for our upcoming formatter logic
        console.log("Formatting request received...");
        setTimeout(() => {
            sendResponse({ success: true });
        }, 1000);
        return true; 
    }
    return true; 
});