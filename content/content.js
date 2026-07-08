console.log("AI Coding Mentor: Content script modularized and active!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PROBLEM") {
        sendResponse(getProblemContext()); // Calls tracker.js
    } else if (request.action === "APPLY_THEME") {
        applyTheme(request.theme);         // Calls themes.js
        sendResponse({ success: true });
    } else if (request.action === "FORMAT_CODE") {
        handleFormatting();                // Calls formatter.js
        sendResponse({ success: true });
    }
    return true; 
});