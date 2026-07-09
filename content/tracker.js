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

function injectGitHubModal(title, code) {
    if (document.getElementById('ai-mentor-github-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ai-mentor-github-modal';
    
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.75); z-index: 999999; display: flex;
        align-items: center; justify-content: center; font-family: -apple-system, sans-serif;
    `;

    const defaultFilename = `${title.replace(/\s+/g, '-')}.cpp`;

    overlay.innerHTML = `
        <div style="background: #1a1a1a; padding: 24px; border-radius: 8px; border: 1px solid #3e3e42; width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: #2cbb5d; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Solution Accepted!
                </h3>
            </div>
            
            <label style="color: #8a8a8a; font-size: 12px; margin-bottom: 4px; display: block;">File Name</label>
            <input type="text" id="gh-filename" value="${defaultFilename}" style="width: 100%; background: #262626; border: 1px solid #3e3e42; color: #eff1f6; padding: 10px; border-radius: 4px; margin-bottom: 16px; font-family: monospace; outline: none; box-sizing: border-box;" />
            
            <label style="color: #8a8a8a; font-size: 12px; margin-bottom: 4px; display: block;">Notes (Time/Space Complexity, Approaches)</label>
            <textarea id="gh-notes" placeholder="e.g. O(n) time complexity using a hash map..." style="width: 100%; background: #262626; border: 1px solid #3e3e42; color: #eff1f6; padding: 10px; border-radius: 4px; height: 80px; resize: none; margin-bottom: 20px; font-family: inherit; outline: none; box-sizing: border-box;"></textarea>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button id="gh-cancel" style="padding: 8px 16px; background: transparent; color: #8a8a8a; border: 1px solid #3e3e42; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancel</button>
                <button id="gh-push" style="padding: 8px 16px; background: #2ea043; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    Push to GitHub
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('gh-cancel').addEventListener('click', () => overlay.remove());
    
    document.getElementById('gh-push').addEventListener('click', () => {
        const filename = document.getElementById('gh-filename').value.trim();
        const notes = document.getElementById('gh-notes').value.trim();
        const btn = document.getElementById('gh-push');
        
        btn.innerText = "Pushing...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";

        chrome.runtime.sendMessage({
            action: "PUSH_TO_GITHUB",
            payload: { title, code, filename, notes }
        }, (response) => {
            if (response && response.success) {
                btn.innerText = "Success!";
                btn.style.background = "#238636";
                setTimeout(() => overlay.remove(), 1500);
            } else {
                btn.innerText = "Push Failed";
                btn.style.background = "#da3633";
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
                alert(response ? response.error : "Unknown error occurred.");
            }
        });
    });
}

const observer = new MutationObserver(() => {
    const resultSpan = document.querySelector('[data-e2e-locator="submission-result"]');
    
    if (resultSpan && resultSpan.innerText.includes('Accepted')) {
        if (!document.getElementById('ai-mentor-github-modal')) {
            const context = getProblemContext();
            injectGitHubModal(context.title, context.code);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });