document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('active');
        });
    });

    document.addEventListener('click', (e) => {
        const nestedHeader = e.target.closest('.nested-accordion-header');
        if (nestedHeader) {
            nestedHeader.parentElement.classList.toggle('active');
        }
    });

    const idleState       = document.getElementById('idleState');
    const dashboardState  = document.getElementById('dashboardState');
    const headerTitle     = document.getElementById('headerTitle');
    const difficultyBadge = document.getElementById('difficultyBadge');
    const pressureTimer   = document.getElementById('pressureTimer');

    const companyTags        = document.getElementById('companyTags');
    const targetTime         = document.getElementById('targetTime');
    const targetSpace        = document.getElementById('targetSpace');
    const hintsContainer     = document.getElementById('hintsContainer');
    const hintCount          = document.getElementById('hintCount');
    const edgeCasesContainer = document.getElementById('edgeCasesContainer');

    let timerInterval = null;

    function startTimer(durationInSeconds) {
        clearInterval(timerInterval);
        pressureTimer.style.display = 'block';
        let timer = durationInSeconds;

        timerInterval = setInterval(() => {
            let minutes = parseInt(timer / 60, 10);
            let seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            pressureTimer.textContent = minutes + ":" + seconds;

            if (timer < 300) { pressureTimer.style.color = '#cb2431'; }
            if (--timer < 0) {
                clearInterval(timerInterval);
                pressureTimer.textContent = "00:00";
            }
        }, 1000);
    }

    function buildNestedAccordion(label, content) {
        const item = document.createElement('div');
        item.className = 'nested-accordion-item';
        item.innerHTML = `
            <div class="nested-accordion-header">
                <span>${label}</span>
                <svg class="nested-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="nested-accordion-content">${content}</div>
        `;
        return item;
    }

    const DB_URL = "https://gist.githubusercontent.com/Aditya3113/e9b2068537f70685ba4f260001128bc9/raw/54ac2e4760d0b75aec8871e189d6dec4974339c2/prep-mentor-db.json";

    async function getDatabase() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['problemDatabase', 'lastFetch'], async (result) => {
                const now = new Date().getTime();
                const oneDay = 24 * 60 * 60 * 1000; 

                if (result.problemDatabase && result.lastFetch && (now - result.lastFetch < oneDay)) {
                    resolve(result.problemDatabase);
                    return;
                }

                try {
                    const response = await fetch(DB_URL);
                    const freshData = await response.json();
                    chrome.storage.local.set({ 'problemDatabase': freshData, 'lastFetch': now });
                    resolve(freshData);
                } catch (error) {
                    resolve(result.problemDatabase || null); 
                }
            });
        });
    }

    async function loadProblemData(title) {
        const db = await getDatabase();
        
        if (!db) {
            idleState.innerHTML = `<p style="font-size: 13px;">Error loading database. Please check your internet connection.</p>`;
            return;
        }

        const data = db[title];

        if (data) {
            idleState.style.display = 'none';
            dashboardState.style.display = 'flex';
            headerTitle.textContent = title;

            if (data.difficulty) {
                difficultyBadge.textContent = data.difficulty;
                difficultyBadge.className = `difficulty-badge ${data.difficulty}`;
                difficultyBadge.style.display = 'inline-block';
            } else {
                difficultyBadge.style.display = 'none';
            }

            startTimer(data.timeLimit);
            targetTime.textContent  = data.targetTime;
            targetSpace.textContent = data.targetSpace;

            const freeCompany  = data.companies[0];
            const hiddenCount  = data.companies.length - 1;
            companyTags.innerHTML = `
                <div class="tag-free">${freeCompany}</div>
                <div class="tag-locked" id="unlockCompaniesBtn" title="Sign in to unlock premium companies!">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  +${hiddenCount}
                </div>
            `;

            const unlockBtn = document.getElementById('unlockCompaniesBtn');
            if (unlockBtn) {
                unlockBtn.addEventListener('click', async () => {
                    console.log("Unlock button clicked. Attempting login...");
                    unlockBtn.innerHTML = `Loading...`;
                    
                    if (typeof window.signInWithGoogle === "function") {
                        const user = await window.signInWithGoogle();
                        
                        if (user) {
                            unlockBtn.innerHTML = `Checking access...`;
                            
                            if (typeof window.checkUserPremium === "function") {
                                const isPremium = await window.checkUserPremium(user.uid);
                                
                                if (isPremium) {
                                    const allCompaniesHTML = data.companies.map(c => `<div class="tag-free">${c}</div>`).join('');
                                    companyTags.innerHTML = allCompaniesHTML;
                                } else {
                                    unlockBtn.innerHTML = `Pay ₹50 to Unlock`;
                                    unlockBtn.style.background = "#ff9800";
                                    unlockBtn.style.color = "#000";
                                    alert("Hi " + user.displayName.split(' ')[0] + "! Please pay ₹50 to unlock premium companies. (Payment gateway coming soon!)");
                                }
                            } else {
                                console.error("Firestore checkUserPremium function missing.");
                                unlockBtn.innerHTML = `+${hiddenCount}`;
                            }
                        } else {
                            unlockBtn.innerHTML = `+${hiddenCount}`;
                        }
                    } else {
                        console.error("Firebase auth.js is not loaded properly.");
                    }
                });
            }

            hintsContainer.innerHTML = '';
            data.hints.forEach((hint, i) => {
                hintsContainer.appendChild(buildNestedAccordion(`Hint ${i + 1}`, hint));
            });
            hintCount.textContent = `0/${data.hints.length}`;

            hintsContainer.querySelectorAll('.nested-accordion-header').forEach(h => {
                h.addEventListener('click', () => {
                    setTimeout(() => {
                        const opened = hintsContainer.querySelectorAll('.nested-accordion-item.active').length;
                        hintCount.textContent = `${opened}/${data.hints.length}`;
                    }, 0);
                });
            });

            edgeCasesContainer.innerHTML = '';
            data.edgeCases.forEach((ec, i) => {
                edgeCasesContainer.appendChild(buildNestedAccordion(`Case ${i + 1}`, `<code style="font-family:monospace;font-size:12px; color: var(--accent);">${ec}</code>`));
            });

        } else {
            headerTitle.textContent = title;
            dashboardState.style.display = 'none';
            idleState.style.display = 'block';
            idleState.innerHTML = `<p style="font-size: 13px;">Tracking activated for <b>${title}</b>.<br><br>Data for this problem is not in the cloud database yet.</p>`;
        }
    }

    function fetchContext() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            
            if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) {
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { action: "GET_PROBLEM" }, (response) => {
                if (chrome.runtime.lastError) return;
                if (response && response.title) {
                    loadProblemData(response.title);
                }
            });
        });
    }

    fetchContext();

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "SPA_URL_CHANGED") {
            fetchContext();
        }
    });
});