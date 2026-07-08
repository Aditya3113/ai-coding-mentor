function getProblemContext() {
    const url = window.location.href;
    const rawTitle = document.title;
    const cleanTitle = rawTitle.split('-')[0].trim(); 
    
    let userCode = "Code editor not found or empty.";
    const codeElements = document.querySelectorAll('.view-line');
    
    if (codeElements.length > 0) {
        userCode = Array.from(codeElements).map(line => line.textContent).join('\n');
    }

    return { platform: "LeetCode", title: cleanTitle, url: url, code: userCode };
}

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