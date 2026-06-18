document.addEventListener('DOMContentLoaded', () => {

    // Top-level accordion toggle
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('active');
        });
    });

    // Nested accordion toggle (delegated)
    document.addEventListener('click', (e) => {
        const nestedHeader = e.target.closest('.nested-accordion-header');
        if (nestedHeader) {
            nestedHeader.parentElement.classList.toggle('active');
        }
    });

    // Navigation Tabs & Containers
    const tabActive = document.getElementById('tabActive');
    const tabCompany = document.getElementById('tabCompany');
    const activeProblemContainer = document.getElementById('activeProblemContainer');
    const companyPrepState = document.getElementById('companyPrepState');

    // Active Problem UI Elements
    const idleState       = document.getElementById('idleState');
    const dashboardState  = document.getElementById('dashboardState');
    const headerTitle     = document.getElementById('headerTitle');
    const difficultyBadge = document.getElementById('difficultyBadge');
    
    // Timer UI Elements
    const pressureTimer   = document.getElementById('pressureTimer');
    const timerInput      = document.getElementById('timerInput');
    const timerToggleBtn  = document.getElementById('timerToggleBtn');
    const timerResetBtn   = document.getElementById('timerResetBtn');

    // Dashboard Data Elements
    const companyTags        = document.getElementById('companyTags');
    const targetTime         = document.getElementById('targetTime');
    const targetSpace        = document.getElementById('targetSpace');
    const hintsContainer     = document.getElementById('hintsContainer');
    const hintCount          = document.getElementById('hintCount');
    const edgeCasesContainer = document.getElementById('edgeCasesContainer');

    // Company Wise Dashboard Elements
    const companySelect = document.getElementById('companySelect');
    const topicSelect = document.getElementById('topicSelect');
    const sortSelect = document.getElementById('sortSelect');
    const questionList = document.getElementById('questionList');

    let timerInterval = null;
    let timerSecondsRemaining = 0;
    let isTimerRunning = false;
    let globalDatabaseArray = [];

    // --- TIMER LOGIC ---
    function updateTimerDisplay() {
        let minutes = parseInt(timerSecondsRemaining / 60, 10);
        let seconds = parseInt(timerSecondsRemaining % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        pressureTimer.textContent = minutes + ":" + seconds;

        if (timerSecondsRemaining < 300) { 
            pressureTimer.style.color = '#cb2431'; 
        } else {
            pressureTimer.style.color = '#eff1f6';
        }
    }

    function handleTimerTick() {
        if (timerSecondsRemaining <= 0) {
            clearInterval(timerInterval);
            pressureTimer.textContent = "00:00";
            isTimerRunning = false;
            if (timerToggleBtn) timerToggleBtn.textContent = "Start";
            return;
        }
        timerSecondsRemaining--;
        updateTimerDisplay();
    }

    if (timerToggleBtn) {
        timerToggleBtn.addEventListener('click', () => {
            if (isTimerRunning) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                timerToggleBtn.textContent = "Start";
            } else {
                if (timerSecondsRemaining <= 0 && timerInput) {
                    const inputMinutes = parseInt(timerInput.value, 10) || 0;
                    timerSecondsRemaining = inputMinutes * 60;
                }
                if (timerSecondsRemaining > 0) {
                    clearInterval(timerInterval);
                    timerInterval = setInterval(handleTimerTick, 1000);
                    isTimerRunning = true;
                    timerToggleBtn.textContent = "Pause";
                    updateTimerDisplay();
                }
            }
        });
    }

    if (timerResetBtn) {
        timerResetBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerToggleBtn.textContent = "Start";
            const inputMinutes = timerInput ? (parseInt(timerInput.value, 10) || 0) : 0;
            timerSecondsRemaining = inputMinutes * 60;
            updateTimerDisplay();
        });
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

    // --- DATABASE LOGIC ---
    const DB_URL = "https://gist.githubusercontent.com/Aditya3113/e9b2068537f70685ba4f260001128bc9/raw/b85731c6a20fbf94b835d750a8f8fb2d3b02eaa5/prep-mentor-db.json";

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

    // --- NEW: Reset to Idle State ---
    function resetToIdleState() {
        dashboardState.style.display = 'none';
        idleState.style.display = 'block';
        idleState.innerHTML = `<p>Waiting for LeetCode problem...</p>`;
        headerTitle.textContent = "Prep Dashboard";
        difficultyBadge.style.display = 'none';
        
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (timerToggleBtn) timerToggleBtn.textContent = "Start";
        pressureTimer.textContent = "00:00";
        pressureTimer.style.color = '#eff1f6';
    }

    async function loadProblemData(title) {
        const db = await getDatabase();
        
        if (!db) {
            idleState.innerHTML = `<p style="font-size: 13px;">Error loading database. Please check your internet connection.</p>`;
            return;
        }

        const data = db[title];

        if (data) {
            // Auto-switch to the Active Problem tab whenever a problem is loaded
            if (activeProblemContainer.style.display === 'none') {
                tabActive.click();
            }

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

            if (data.timeLimit) {
                const defaultMinutes = Math.floor(data.timeLimit / 60);
                if (timerInput) timerInput.value = defaultMinutes;
                
                clearInterval(timerInterval);
                isTimerRunning = false;
                if (timerToggleBtn) timerToggleBtn.textContent = "Start";
                
                timerSecondsRemaining = data.timeLimit;
                updateTimerDisplay();
            }
            
            targetTime.textContent  = data.targetTime;
            targetSpace.textContent = data.targetSpace;

            const freeCompany  = data.companies && data.companies[0] ? data.companies[0] : "Standard";
            const hiddenCount  = data.companies ? (data.companies.length - 1) : 0;
            
            if (hiddenCount > 0) {
                companyTags.innerHTML = `
                    <div class="tag-free">${freeCompany}</div>
                    <div class="tag-locked" id="unlockCompaniesBtn" title="Sign in to unlock premium companies!">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      +${hiddenCount}
                    </div>
                `;
            } else {
                companyTags.innerHTML = `<div class="tag-free">${freeCompany}</div>`;
            }

            const unlockBtn = document.getElementById('unlockCompaniesBtn');
            if (unlockBtn) {
                unlockBtn.addEventListener('click', async () => {
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

                                    const payBtn = unlockBtn.cloneNode(true);
                                    unlockBtn.parentNode.replaceChild(payBtn, unlockBtn);

                                    let currentOrderId = null;

                                    payBtn.addEventListener('click', async () => {
                                        if (payBtn.innerText === "Verify Payment") {
                                            payBtn.innerText = "Verifying...";
                                            try {
                                                const res = await fetch('http://localhost:3000/verify-order', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ order_id: currentOrderId })
                                                });
                                                const vData = await res.json();
                                                
                                                if (vData.success) {
                                                    await window.upgradeUserToPremium(user.uid);
                                                    const allCompaniesHTML = data.companies.map(c => `<div class="tag-free">${c}</div>`).join('');
                                                    companyTags.innerHTML = allCompaniesHTML;
                                                } else {
                                                    payBtn.innerText = "Verify Payment";
                                                    alert("Payment not completed yet. Status: " + vData.status);
                                                }
                                            } catch (e) {
                                                payBtn.innerText = "Verify Payment";
                                                alert("Error verifying payment with server.");
                                            }
                                            return;
                                        }

                                        payBtn.innerText = "Connecting...";
                                        try {
                                            const response = await fetch('http://localhost:3000/create-order', { method: 'POST' });
                                            const orderData = await response.json();
                                            currentOrderId = orderData.id;
                                            
                                            chrome.tabs.create({ url: `http://localhost:3000/pay?order_id=${currentOrderId}` });
                                            
                                            payBtn.innerText = "Verify Payment";
                                            payBtn.style.background = "#2ea043"; 
                                            payBtn.style.color = "#ffffff";
                                        } catch (error) {
                                            payBtn.innerText = "Pay ₹50 to Unlock";
                                            alert("Could not connect to payment server. Make sure it is running!");
                                        }
                                    });
                                }
                            }
                        } else {
                            unlockBtn.innerHTML = `+${hiddenCount}`;
                        }
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

    // --- CONTEXT FETCHING & TAB LISTENERS ---
    function fetchContext() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            
            // If the user switches to a non-LeetCode tab, wipe the dashboard!
            if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) {
                resetToIdleState();
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { action: "GET_PROBLEM" }, (response) => {
                if (chrome.runtime.lastError) {
                    resetToIdleState();
                    return;
                }
                if (response && response.title) {
                    loadProblemData(response.title);
                }
            });
        });
    }

    // 1. Fetch on initial load
    fetchContext();

    // 2. Listen for URL changes inside a single LeetCode tab (SPA)
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "SPA_URL_CHANGED") {
            // Slight delay to allow LeetCode DOM to update its title
            setTimeout(fetchContext, 1000); 
        }
    });

    // 3. NEW: Listen for user switching between different Chrome tabs
    chrome.tabs.onActivated.addListener(() => {
        fetchContext();
    });

    // 4. NEW: Listen for a tab fully finishing its loading sequence
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            fetchContext();
        }
    });

    // --- TAB NAVIGATION UI LOGIC ---
    tabActive.addEventListener('click', () => {
        tabActive.style.color = '#fff';
        tabActive.style.borderBottom = '2px solid #ff9800';
        tabCompany.style.color = '#8b949e';
        tabCompany.style.borderBottom = 'none';
        
        activeProblemContainer.style.display = 'block';
        companyPrepState.style.display = 'none';
    });

    tabCompany.addEventListener('click', async () => {
        tabCompany.style.color = '#fff';
        tabCompany.style.borderBottom = '2px solid #ff9800';
        tabActive.style.color = '#8b949e';
        tabActive.style.borderBottom = 'none';
        
        activeProblemContainer.style.display = 'none';
        companyPrepState.style.display = 'block';

        if (globalDatabaseArray.length === 0) {
            const db = await getDatabase();
            if (db) {
                globalDatabaseArray = Object.keys(db).map(key => ({
                    title: key,
                    ...db[key]
                }));
            }
        }
    });

    // --- COMPANY DASHBOARD RENDERING ---
    function renderCompanyQuestions() {
        const selectedCompany = companySelect.value;
        const selectedTopic = topicSelect.value;
        const selectedSort = sortSelect.value;

        if (!selectedCompany) {
            questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px; margin-top: 20px;">Select a company to view problems.</p>`;
            return;
        }

        let filtered = globalDatabaseArray.filter(p => p.companies && p.companies.includes(selectedCompany));
        
        if (selectedTopic !== "All") {
            filtered = filtered.filter(p => p.topics && p.topics.includes(selectedTopic));
        }

        filtered.sort((a, b) => {
            if (selectedSort === 'freq-desc') {
                return (b.frequency || 0) - (a.frequency || 0);
            } else {
                const diffWeight = { "Easy": 1, "Medium": 2, "Hard": 3 };
                const weightA = diffWeight[a.difficulty] || 0;
                const weightB = diffWeight[b.difficulty] || 0;
                return selectedSort === 'diff-asc' ? weightA - weightB : weightB - weightA;
            }
        });

        if (filtered.length === 0) {
            questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px;">No problems found for these filters.</p>`;
            return;
        }

        questionList.innerHTML = filtered.map(q => {
            let color = "#00b8a3"; 
            if (q.difficulty === "Medium") color = "#ffc01e"; 
            if (q.difficulty === "Hard") color = "#ff375f"; 

            const problemUrl = q.url || `https://leetcode.com/problems/${q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;

            return `
            <div class="list-item-card question-click-item" data-url="${problemUrl}" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #8b949e; font-size: 12px; min-width: 25px;">${q.id || '-'}.</span>
                    <span style="color: #eff1f6; font-size: 14px; font-weight: 500;">${q.title}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #8b949e; font-size: 12px;">Freq: ${q.frequency || 'N/A'}</span>
                    <span style="color: ${color}; font-size: 12px; font-weight: bold; width: 50px; text-align: right;">${q.difficulty}</span>
                </div>
            </div>
            `;
        }).join('');
    }

    questionList.addEventListener('click', (e) => {
        const clickedItem = e.target.closest('.question-click-item');
        if (clickedItem && clickedItem.dataset.url) {
            chrome.tabs.create({ active: true, url: clickedItem.dataset.url });
        }
    });

    companySelect.addEventListener('change', renderCompanyQuestions);
    topicSelect.addEventListener('change', renderCompanyQuestions);
    sortSelect.addEventListener('change', renderCompanyQuestions);
});