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
    const successElement = document.querySelector('.success__3Ai7'); 
    if (successElement) {
        const titleElement = document.querySelector('[data-cy="question-title"]');
        if (titleElement) {
            const title = titleElement.innerText.trim();
            chrome.runtime.sendMessage({ action: "PROBLEM_SOLVED", title: title });
            console.log("AI Coding Mentor: Success detected! Syncing solution...");
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// --- THEME INJECTOR (Aggressive Monaco Overrides) ---
const THEMES = {
    "monokai": `
        :root {
            --bg-default: #272822 !important;
            --layer-1: #1e1f1c !important;
            --layer-2: #272822 !important;
        }
        .monaco-editor, 
        .monaco-editor-background, 
        .monaco-editor .margin,
        .monaco-editor .margin-view-overlays,
        .monaco-editor .monaco-scrollable-element,
        .monaco-editor .overflow-guard,
        .monaco-editor .view-lines,
        .monaco-editor .view-overlays,
        .monaco-editor .current-line {
            background-color: #272822 !important;
            background: #272822 !important;
        }
    `,
    "github": `
        :root {
            --bg-default: #0d1117 !important;
            --layer-1: #010409 !important;
            --layer-2: #161b22 !important;
        }
        .monaco-editor, 
        .monaco-editor-background, 
        .monaco-editor .margin,
        .monaco-editor .margin-view-overlays,
        .monaco-editor .monaco-scrollable-element,
        .monaco-editor .overflow-guard,
        .monaco-editor .view-lines,
        .monaco-editor .view-overlays,
        .monaco-editor .current-line {
            background-color: #0d1117 !important;
            background: #0d1117 !important;
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
    console.log(`Applied Theme: ${themeName}`);
}

// --- SMART FORMATTER ---
function handleFormatting() {
    console.log("Searching for LeetCode format button...");
    
    const buttons = Array.from(document.querySelectorAll('button'));
    const formatBtn = buttons.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const tooltip = (b.getAttribute('data-tooltip-content') || '').toLowerCase();
        const tooltipId = (b.getAttribute('data-tooltip-id') || '').toLowerCase();
        return aria.includes('format') || tooltip.includes('format') || tooltipId.includes('format');
    });

    if (formatBtn) {
        formatBtn.click();
        console.log("Format button clicked successfully!");
    } else {
        console.log("Format button not found in UI. Simulating keyboard shortcut...");
        const editorDiv = document.querySelector('.monaco-editor') || document.activeElement;
        if (editorDiv) {
            editorDiv.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'f',
                code: 'KeyF',
                keyCode: 70,
                shiftKey: true,
                altKey: true,
                bubbles: true
            }));
        }
    }
}

// --- MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PROBLEM") {
        sendResponse(getProblemContext());
    } else if (request.action === "APPLY_THEME") {
        applyTheme(request.theme);
        sendResponse({ success: true });
    } else if (request.action === "FORMAT_CODE") {
        handleFormatting();
        sendResponse({ success: true });
    }
    return true; 
});