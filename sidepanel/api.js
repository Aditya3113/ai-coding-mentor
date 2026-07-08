// --- SECURE CLOUD DATABASE FETCH ---
async function getDatabase() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['problemDatabase', 'lastFetch'], async (result) => {
            const now = new Date().getTime();
            const oneDay = 0; 
            
            if (result.problemDatabase && result.lastFetch && (now - result.lastFetch < oneDay)) {
                resolve(result.problemDatabase);
                return;
            }
            try {
                let idToken = "";
                if (globalUser && typeof globalUser.getIdToken === 'function') {
                    idToken = await globalUser.getIdToken(true); 
                } else if (typeof window.getUserToken === 'function') {
                    idToken = await window.getUserToken();
                }

                if (!idToken) {
                    console.error("No auth token available for database fetch.");
                    resolve(result.problemDatabase || null);
                    return;
                }

                const response = await fetch('http://localhost:3000/api/premium-database', { 
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store' 
                });

                if (!response.ok) {
                    console.error("Failed to fetch secure database:", response.status);
                    resolve(result.problemDatabase || null);
                    return;
                }

                const freshData = await response.json();
                chrome.storage.local.set({ 'problemDatabase': freshData, 'lastFetch': now });
                resolve(freshData);
            } catch (error) {
                console.error("Failed to fetch database:", error);
                resolve(result.problemDatabase || null); 
            }
        });
    });
}

async function syncHistoricalLeetCodeData() {
    try {
        const response = await fetch('https://leetcode.com/api/problems/algorithms/');
        if (!response.ok) return; 
        
        const data = await response.json();
        const solvedTitles = data.stat_status_pairs
            .filter(p => p.status === 'ac')
            .map(p => p.stat.question__title);

        if (solvedTitles.length > 0) {
            chrome.storage.local.get(['solvedProblems'], (result) => {
                const existing = result.solvedProblems || [];
                const merged = Array.from(new Set([...existing, ...solvedTitles]));
                
                chrome.storage.local.set({ solvedProblems: merged }, () => {
                    console.log(`AI Coding Mentor: Synced ${merged.length} historical problems.`);
                    if (companyPrepState.style.display === 'block' && globalIsPremium) {
                        renderCompanyQuestions();
                    }
                });
            });
        }
    } catch (err) {
        console.log("Could not sync historical data. Ensure you are logged into LeetCode.");
    }
}