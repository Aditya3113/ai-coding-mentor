document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL AUTH STATE & DROPDOWN LOGIC ---
    let globalUser = null;
    let globalIsPremium = false;
    const authProfileBtn = document.getElementById('authProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const signOutBtn = document.getElementById('signOutBtn');

    async function initAuth(providedUser = undefined) {
        if (providedUser !== undefined) {
            globalUser = providedUser;
        } else if (typeof window.getCurrentUser === 'function') {
            globalUser = await window.getCurrentUser();
        }

        if (globalUser) {
            authProfileBtn.style.background = "#2ea043"; 
            authProfileBtn.style.color = "#fff";
            authProfileBtn.innerHTML = globalUser.email ? globalUser.email.charAt(0).toUpperCase() : "U";
            authProfileBtn.title = "Account Menu";
            
            dropdownEmail.textContent = globalUser.email || "Premium User";
            
            globalIsPremium = await window.checkUserPremium(globalUser.uid);
            fetchContext(); 
        } else {
            authProfileBtn.style.background = "#30363d";
            authProfileBtn.style.color = "#8b949e";
            authProfileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            authProfileBtn.title = "Sign In";
            if (profileDropdown) profileDropdown.style.display = "none";
            globalIsPremium = false;
        }
    }

    if (authProfileBtn) {
        authProfileBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); 
            if (globalUser) {
                profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
            } else {
                authProfileBtn.innerHTML = "...";
                if (typeof window.signInWithGoogle === 'function') {
                    try {
                        const newUser = await window.signInWithGoogle();
                        if (newUser) {
                            await initAuth(newUser); 
                        } else {
                            await initAuth(null); 
                        }
                    } catch(err) {
                        await initAuth(null);
                    }
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.style.display === "block") {
            if (!e.target.closest('#profileContainer')) {
                profileDropdown.style.display = "none";
            }
        }
    });

    if (signOutBtn) {
        signOutBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); 
            const confirmOut = confirm("Are you sure you want to sign out?");
            if (confirmOut && typeof window.signOut === 'function') {
                signOutBtn.innerText = "Signing out...";
                await window.signOut(); 
                
                globalUser = null;
                globalIsPremium = false;
                
                profileDropdown.style.display = "none";
                signOutBtn.innerText = "Sign Out";
                
                authProfileBtn.style.background = "#30363d";
                authProfileBtn.style.color = "#8b949e";
                authProfileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                authProfileBtn.title = "Sign In";
                
                fetchContext(); 
            }
        });
    }

    initAuth(); 

    // --- ACCORDION LOGIC (EVENT DELEGATION FOR DYNAMIC TABS) ---
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.accordion-header');
        if (header) {
            header.parentElement.classList.toggle('active');
        }
    });

    // --- UI ELEMENTS ---
    const tabActive = document.getElementById('tabActive');
    const tabCompany = document.getElementById('tabCompany');
    const navTabsContainer = document.querySelector('.nav-tabs');
    const activeProblemContainer = document.getElementById('activeProblemContainer');
    const companyPrepState = document.getElementById('companyPrepState');

    const idleState       = document.getElementById('idleState');
    const lockdownState   = document.getElementById('lockdownState');
    const dashboardState  = document.getElementById('dashboardState');
    const headerTitle     = document.getElementById('headerTitle');
    const difficultyBadge = document.getElementById('difficultyBadge');
    
    const pressureTimer   = document.getElementById('pressureTimer');
    const timerInput      = document.getElementById('timerInput');
    const timerToggleBtn  = document.getElementById('timerToggleBtn');
    const timerResetBtn   = document.getElementById('timerResetBtn');

    const companyTags        = document.getElementById('companyTags');
    const targetTime         = document.getElementById('targetTime');
    const targetSpace        = document.getElementById('targetSpace');
    const dynamicHintsContainer = document.getElementById('dynamicHintsContainer');
    const dynamicEdgeCasesContainer = document.getElementById('dynamicEdgeCasesContainer');

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
        pressureTimer.style.color = (timerSecondsRemaining < 300) ? '#cb2431' : '#eff1f6';
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

    // --- DYNAMIC TOP-LEVEL ACCORDION GENERATOR ---
    function createTopLevelAccordion(title, content, iconSvg) {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.innerHTML = `
            <div class="accordion-header">
                <div class="header-left">
                    ${iconSvg}
                    <span>${title}</span>
                </div>
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="accordion-content">${content}</div>
        `;
        return item;
    }

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

    function resetToIdleState() {
        dashboardState.style.display = 'none';
        lockdownState.style.display = 'none';
        idleState.style.display = 'block';
        if (navTabsContainer) navTabsContainer.style.display = 'flex';
        headerTitle.textContent = "Prep Dashboard";
        difficultyBadge.style.display = 'none';
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (timerToggleBtn) timerToggleBtn.textContent = "Start";
        pressureTimer.textContent = "00:00";
        pressureTimer.style.color = '#eff1f6';
    }

    function triggerLockdownState() {
        dashboardState.style.display = 'none';
        idleState.style.display = 'none';
        companyPrepState.style.display = 'none';
        lockdownState.style.display = 'block'; 
        if (navTabsContainer) navTabsContainer.style.display = 'none';
        headerTitle.textContent = "Restricted Area";
        difficultyBadge.style.display = 'none';
        clearInterval(timerInterval);
        isTimerRunning = false;
        pressureTimer.textContent = "--:--";
        pressureTimer.style.color = '#8b949e';
    }

    async function loadProblemData(title) {
        const db = await getDatabase();
        if (!db) {
            idleState.innerHTML = `<p style="font-size: 13px;">Error loading database.</p>`;
            return;
        }
        const data = db[title];

        if (data) {
            if (activeProblemContainer.style.display === 'none') tabActive.click();
            idleState.style.display = 'none';
            lockdownState.style.display = 'none';
            if (navTabsContainer) navTabsContainer.style.display = 'flex';
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
            
            if (globalIsPremium) {
                companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${c}</div>`).join('');
            } else if (hiddenCount > 0) {
                companyTags.innerHTML = `
                    <div class="tag-free">${freeCompany}</div>
                    <div class="tag-locked" id="unlockCompaniesBtn" title="Sign in to unlock premium companies!">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      +${hiddenCount}
                    </div>
                `;

                const unlockBtn = document.getElementById('unlockCompaniesBtn');
                unlockBtn.addEventListener('click', async () => {
                    unlockBtn.innerHTML = `Loading...`;
                    let user = globalUser; 
                    if (!user && typeof window.signInWithGoogle === "function") {
                        user = await window.signInWithGoogle();
                        if (user) await initAuth(user); 
                    }
                    if (user) {
                        unlockBtn.innerHTML = `Checking access...`;
                        const isPremium = await window.checkUserPremium(user.uid);
                        if (isPremium) {
                            globalIsPremium = true; 
                            companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${c}</div>`).join('');
                        } else {
                            unlockBtn.style.display = "none";
                            const paymentContainer = document.createElement('div');
                            paymentContainer.style.width = "100%";
                            paymentContainer.style.marginTop = "12px";
                            paymentContainer.style.display = "flex";
                            paymentContainer.style.flexDirection = "column";
                            paymentContainer.style.gap = "8px";
                            paymentContainer.style.padding = "12px";
                            paymentContainer.style.background = "rgba(255, 152, 0, 0.05)";
                            paymentContainer.style.border = "1px solid #ff9800";
                            paymentContainer.style.borderRadius = "6px";
                            paymentContainer.innerHTML = `
                                <div style="font-size:12px; color:#8b949e; text-align:center; font-weight:500;">Premium Lifetime Unlock</div>
                                <input type="text" id="promoInput" placeholder="PROMO CODE (Optional)" style="padding:8px; background:#0d1117; color:#fff; border:1px solid #30363d; border-radius:4px; text-transform:uppercase; text-align:center; font-family:monospace; outline:none;">
                                <button id="payActionBtn" style="padding:10px; background:#ff9800; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer; transition: background 0.2s;">Proceed to Pay</button>
                            `;
                            companyTags.parentElement.appendChild(paymentContainer);
                            const payActionBtn = document.getElementById('payActionBtn');
                            const promoInput = document.getElementById('promoInput');
                            let currentOrderId = null;

                            payActionBtn.addEventListener('click', async (e) => {
                                e.stopPropagation(); 
                                if (payActionBtn.innerText === "Verify Payment") {
                                    payActionBtn.innerText = "Verifying...";
                                    try {
                                        const res = await fetch('http://localhost:3000/verify-order', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ order_id: currentOrderId })
                                        });
                                        const vData = await res.json();
                                        if (vData.success) {
                                            await window.upgradeUserToPremium(user.uid);
                                            globalIsPremium = true; 
                                            companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${c}</div>`).join('');
                                            paymentContainer.remove(); 
                                        } else {
                                            payActionBtn.innerText = "Verify Payment";
                                            alert("Payment not completed yet.");
                                        }
                                    } catch (err) { alert("Verification error."); }
                                    return;
                                }

                                payActionBtn.innerText = "Connecting...";
                                try {
                                    const bodyData = { promo_code: promoInput.value.trim() };
                                    const response = await fetch('http://localhost:3000/create-order', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(bodyData)
                                    });
                                    const apiData = await response.json();
                                    if (apiData.error) {
                                        alert(apiData.error); 
                                        payActionBtn.innerText = "Proceed to Pay";
                                        return;
                                    }
                                    currentOrderId = apiData.order.id;
                                    chrome.tabs.create({ url: `http://localhost:3000/pay?order_id=${currentOrderId}&amount=${apiData.finalAmount}` });
                                    payActionBtn.innerText = "Verify Payment";
                                    payActionBtn.style.background = "#2ea043"; 
                                    payActionBtn.style.color = "#ffffff";
                                    promoInput.style.display = "none"; 
                                } catch (error) {
                                    payActionBtn.innerText = "Proceed to Pay";
                                }
                            });
                        }
                    } else {
                        unlockBtn.innerHTML = `+${hiddenCount}`;
                    }
                });
            } else {
                companyTags.innerHTML = `<div class="tag-free">${freeCompany}</div>`;
            }

            // POPULATE TOP LEVEL HINTS
            dynamicHintsContainer.innerHTML = '';
            const hintIcon = `<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.07 1.5 3.5.76.76 1.21 1.5 1.41 2.5"></path></svg>`;
            if (data.hints && data.hints.length > 0) {
                data.hints.forEach((hint, i) => {
                    dynamicHintsContainer.appendChild(createTopLevelAccordion(`Hint ${i + 1}`, hint, hintIcon));
                });
            }

            // POPULATE TOP LEVEL EDGE CASES
            dynamicEdgeCasesContainer.innerHTML = '';
            const edgeIcon = `<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            if (data.edgeCases && data.edgeCases.length > 0) {
                data.edgeCases.forEach((ec, i) => {
                    const formattedEc = `<code style="font-family:monospace;font-size:12px; color: var(--accent);">${ec}</code>`;
                    dynamicEdgeCasesContainer.appendChild(createTopLevelAccordion(`Edge Case ${i + 1}`, formattedEc, edgeIcon));
                });
            }

        } else {
            headerTitle.textContent = title;
            dashboardState.style.display = 'none';
            lockdownState.style.display = 'none';
            idleState.style.display = 'block';
            idleState.innerHTML = `<p style="font-size: 13px;">Tracking activated for <b>${title}</b>.<br><br>Data for this problem is not in the cloud database yet.</p>`;
        }
    }

    function processTab(activeTab) {
        if (activeTab && activeTab.url && activeTab.url.includes("leetcode.com/contest/")) {
            triggerLockdownState();
            return;
        }

        if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) {
            resetToIdleState();
            return;
        }

        const match = activeTab.url.match(/leetcode\.com\/problems\/([^/]+)/);
        const slug = match ? match[1] : null;

        chrome.tabs.sendMessage(activeTab.id, { action: "GET_PROBLEM" }, async (response) => {
            if (chrome.runtime.lastError || !response || !response.title) {
                if (slug) {
                    const db = await getDatabase();
                    if (db) {
                        const matchedTitle = Object.keys(db).find(key => {
                            const expectedUrl = db[key].url || `https://leetcode.com/problems/${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
                            return expectedUrl.includes(slug);
                        });
                        if (matchedTitle) {
                            loadProblemData(matchedTitle);
                            return;
                        }
                    }
                }
                resetToIdleState();
                return;
            }
            loadProblemData(response.title);
        });
    }

    function fetchContext() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let activeTab = tabs[0];
            if (!activeTab) {
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, (fallbackTabs) => {
                    if (fallbackTabs[0]) processTab(fallbackTabs[0]);
                });
            } else {
                processTab(activeTab);
            }
        });
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "SPA_URL_CHANGED") setTimeout(fetchContext, 1000); 
    });
    chrome.tabs.onActivated.addListener(fetchContext);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) fetchContext();
    });

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
                globalDatabaseArray = Object.keys(db).map(key => ({ title: key, ...db[key] }));
            }
        }
    });

    function renderCompanyQuestions() {
        const selectedCompany = companySelect.value;
        const selectedTopic = topicSelect.value;
        const selectedSort = sortSelect.value;

        if (!selectedCompany) {
            questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px; margin-top: 20px;">Select a company to view problems.</p>`;
            return;
        }

        let filtered = globalDatabaseArray.filter(p => p.companies && p.companies.includes(selectedCompany));
        if (selectedTopic !== "All") filtered = filtered.filter(p => p.topics && p.topics.includes(selectedTopic));

        filtered.sort((a, b) => {
            if (selectedSort === 'freq-desc') return (b.frequency || 0) - (a.frequency || 0);
            const diffWeight = { "Easy": 1, "Medium": 2, "Hard": 3 };
            const weightA = diffWeight[a.difficulty] || 0;
            const weightB = diffWeight[b.difficulty] || 0;
            return selectedSort === 'diff-asc' ? weightA - weightB : weightB - weightA;
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
        if (clickedItem && clickedItem.dataset.url) chrome.tabs.create({ active: true, url: clickedItem.dataset.url });
    });

    companySelect.addEventListener('change', renderCompanyQuestions);
    topicSelect.addEventListener('change', renderCompanyQuestions);
    sortSelect.addEventListener('change', renderCompanyQuestions);
});