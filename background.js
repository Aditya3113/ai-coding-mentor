chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "PROBLEM_SOLVED") {
        chrome.storage.local.get(['solvedProblems'], (result) => {
            let solved = result.solvedProblems || [];
            
            if (!solved.includes(request.title)) {
                solved.push(request.title);
                chrome.storage.local.set({ solvedProblems: solved });
                console.log("AI Coding Mentor: Successfully synced solution for:", request.title);
            }
        });
    } 
    
    else if (request.action === "PUSH_TO_GITHUB") {
        pushToGitHub(request.payload).then(sendResponse);
        return true;
    }
    
    return true; 
});

// --- GITHUB API ENGINE ---
async function pushToGitHub({ title, code, filename, notes }) {
    const storage = await chrome.storage.local.get(['githubToken', 'githubRepo']);
    const token = storage.githubToken;
    const repoName = storage.githubRepo || "LeetCode-Solutions";

    if (!token) {
        return { success: false, error: "GitHub token is missing. Please configure it in the extension settings." };
    }

    try {
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!userRes.ok) throw new Error("Invalid GitHub Token");
        const userData = await userRes.json();
        const username = userData.login;

        const formattedNotes = notes ? `\n/*\nAuthor Notes:\n${notes}\n*/\n\n` : "\n\n";
        const finalContent = `// Problem: ${title}${formattedNotes}${code}`;
        
        const base64Content = btoa(unescape(encodeURIComponent(finalContent)));
        const url = `https://api.github.com/repos/${username}/${repoName}/contents/${filename}`;

        const getFileRes = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        let sha = null;
        if (getFileRes.ok) {
            const fileData = await getFileRes.json();
            sha = fileData.sha;
        }

        const body = {
            message: `Add solution for ${title}`,
            content: base64Content
        };
        if (sha) body.sha = sha;

        const pushRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (pushRes.ok) {
            return { success: true };
        } else {
            const errorData = await pushRes.json();
            return { success: false, error: errorData.message || "Failed to push to GitHub." };
        }

    } catch (error) {
        return { success: false, error: error.toString() };
    }
}