console.log("AI Coding Mentor: Content script active and waiting for requests!");

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PROBLEM") {
        console.log("Side Panel requested context. Sending data...");
        sendResponse(getProblemContext());
    }
    return true; 
});