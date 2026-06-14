console.log("AI Coding Mentor: Content script active and waiting for requests!");

function getProblemContext() {
    const url = window.location.href;
    const rawTitle = document.title;
    const cleanTitle = rawTitle.split('-')[0].trim(); 
    
    return {
        platform: "LeetCode",
        title: cleanTitle,
        url: url
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PROBLEM") {
        console.log("Side Panel requested context. Sending data...");
        sendResponse(getProblemContext());
    }
    return true; 
});