console.log("AI Coding Mentor: Content script active!");

function extractProblemContext() {
    const url = window.location.href;
    const rawTitle = document.title;
    const cleanTitle = rawTitle.split('-')[0].trim(); 
    
    chrome.runtime.sendMessage({
        action: "PROBLEM_DETECTED",
        payload: {
            platform: "LeetCode",
            title: cleanTitle,
            url: url
        }
    });

    console.log("Context broadcasted:", cleanTitle);
}

setTimeout(extractProblemContext, 3000);