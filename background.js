chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "PROBLEM_SOLVED") {
        chrome.storage.local.get(['solvedProblems'], (result) => {
            let solved = result.solvedProblems || [];
            
            if (!solved.includes(message.title)) {
                solved.push(message.title);
                chrome.storage.local.set({ solvedProblems: solved });
                console.log("AI Coding Mentor: Successfully synced solution for:", message.title);
            }
        });
    }
    return true; 
});