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
        dropdownEmail.textContent = globalUser.email || "Premium User";
        globalIsPremium = await window.checkUserPremium(globalUser.uid);
        fetchContext(); 
    } else {
        authProfileBtn.style.background = "#30363d";
        authProfileBtn.style.color = "#8b949e";
        authProfileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
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
            try {
                const newUser = await window.signInWithGoogle();
                await initAuth(newUser || null); 
            } catch(err) { await initAuth(null); }
        }
    });
}

document.addEventListener('click', (e) => {
    if (profileDropdown && profileDropdown.style.display === "block") {
        if (!e.target.closest('#profileContainer')) profileDropdown.style.display = "none";
    }
    const header = e.target.closest('.accordion-header');
    if (header) header.parentElement.classList.toggle('active');
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); 
        if (confirm("Are you sure you want to sign out?")) {
            signOutBtn.innerText = "Signing out...";
            await window.signOut(); 
            globalUser = null;
            globalIsPremium = false;
            profileDropdown.style.display = "none";
            signOutBtn.innerText = "Sign Out";
            fetchContext(); 
        }
    });
}

if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        const root = document.documentElement;
        if (theme === 'monokai') {
            root.style.setProperty('--bg', '#272822'); root.style.setProperty('--panel-bg', '#272822'); root.style.setProperty('--inset-bg', '#1e1f1c'); root.style.setProperty('--border', '#3e3d32');
        } else if (theme === 'github') {
            root.style.setProperty('--bg', '#0d1117'); root.style.setProperty('--panel-bg', '#0d1117'); root.style.setProperty('--inset-bg', '#010409'); root.style.setProperty('--border', '#30363d');
        } else {
            root.style.setProperty('--bg', '#1a1a1a'); root.style.setProperty('--panel-bg', '#1a1a1a'); root.style.setProperty('--inset-bg', '#262626'); root.style.setProperty('--border', '#3e3e42');
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes("leetcode.com/problems/")) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "APPLY_THEME", theme: theme });
            }
        });
    });
}

if (btnFormatCode) {
    btnFormatCode.addEventListener('click', () => {
        btnFormatCode.innerHTML = "Formatting...";
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes("leetcode.com/problems/")) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "FORMAT_CODE" }, () => {
                    setTimeout(() => { btnFormatCode.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> Format Code`; }, 800);
                });
            }
        });
    });
}

if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerToggleBtn.textContent = "Start";
        } else {
            if (timerSecondsRemaining <= 0 && timerInput) timerSecondsRemaining = (parseInt(timerInput.value, 10) || 0) * 60;
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
        timerSecondsRemaining = (parseInt(timerInput.value, 10) || 0) * 60;
        updateTimerDisplay();
    });
}

tabActive.addEventListener('click', () => {
    tabActive.style.color = '#fff'; tabActive.style.borderBottom = '2px solid #ff9800';
    tabCompany.style.color = '#8b949e'; tabCompany.style.borderBottom = 'none';
    activeProblemContainer.style.display = 'block'; companyPrepState.style.display = 'none';
});

tabCompany.addEventListener('click', async () => {
    tabCompany.style.color = '#fff'; tabCompany.style.borderBottom = '2px solid #ff9800';
    tabActive.style.color = '#8b949e'; tabActive.style.borderBottom = 'none';
    activeProblemContainer.style.display = 'none'; companyPrepState.style.display = 'block';

    if (!globalIsPremium) {
        companySelect.disabled = true; topicSelect.disabled = true; sortSelect.disabled = true;
        questionList.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: #8b949e;"><h3 style="color: #eff1f6;">Premium Feature</h3><p>Unlock Company Prep to access targeted problem lists.</p><button id="prepUpgradeBtn" style="padding: 8px 16px; background: #ff9800; color: #000; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Unlock Premium</button></div>`;
        
        document.getElementById('prepUpgradeBtn').addEventListener('click', async (e) => {
            const btn = e.target; btn.innerHTML = `Loading...`;
            let user = globalUser; 
            if (!user && typeof window.signInWithGoogle === "function") { user = await window.signInWithGoogle(); if (user) await initAuth(user); }
            if (user) {
                btn.innerHTML = `Checking access...`;
                const isPremium = await window.checkUserPremium(user.uid);
                if (isPremium) { globalIsPremium = true; tabCompany.click(); } 
                else {
                    btn.style.display = "none";
                    const paymentContainer = document.createElement('div');
                    paymentContainer.innerHTML = `<div style="padding:12px; background:rgba(255, 152, 0, 0.05); border:1px solid #ff9800; border-radius:6px; display:flex; flex-direction:column; gap:8px;"><input type="text" id="prepPromoInput" placeholder="PROMO CODE"><button id="prepPayActionBtn" style="padding:10px; background:#ff9800; color:#000; font-weight:bold;">Proceed to Pay</button></div>`;
                    btn.parentElement.appendChild(paymentContainer);
                    
                    const payActionBtn = document.getElementById('prepPayActionBtn');
                    let currentOrderId = null;
                    payActionBtn.addEventListener('click', async (payEvent) => {
                        payEvent.stopPropagation(); 
                        if (payActionBtn.innerText === "Verify Payment") {
                            payActionBtn.innerText = "Verifying...";
                            try {
                                const res = await fetch('http://localhost:3000/verify-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: currentOrderId }) });
                                if ((await res.json()).success) { await window.upgradeUserToPremium(user.uid); globalIsPremium = true; tabCompany.click(); } 
                                else { payActionBtn.innerText = "Verify Payment"; alert("Payment not completed yet."); }
                            } catch (err) { alert("Verification error."); }
                            return;
                        }
                        payActionBtn.innerText = "Connecting...";
                        try {
                            const apiData = await (await fetch('http://localhost:3000/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promo_code: document.getElementById('prepPromoInput').value.trim(), uid: user.uid }) })).json();
                            if (apiData.error) { alert(apiData.error); payActionBtn.innerText = "Proceed to Pay"; return; }
                            currentOrderId = apiData.order.id;
                            chrome.tabs.create({ url: `http://localhost:3000/pay?order_id=${currentOrderId}&amount=${apiData.finalAmount}` });
                            payActionBtn.innerText = "Verify Payment"; document.getElementById('prepPromoInput').style.display = "none"; 
                        } catch (error) { payActionBtn.innerText = "Proceed to Pay"; }
                    });
                }
            } else { btn.innerHTML = `Unlock Premium`; }
        });
        return;
    }

    companySelect.disabled = false; topicSelect.disabled = false; sortSelect.disabled = false;
    if (globalDatabaseArray.length === 0) {
        const db = await getDatabase();
        if (db) {
            globalDatabaseArray = Object.keys(db).map(key => ({ title: key, ...db[key] }));
            populateCompanyDropdown(); populateTopicDropdown(); 
            questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px; margin-top: 20px;">Select a company to view problems.</p>`;
        }
    } else if (!companySelect.value) {
        questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px; margin-top: 20px;">Select a company to view problems.</p>`;
    }
});

questionList.addEventListener('click', (e) => {
    const clickedItem = e.target.closest('.question-click-item');
    if (clickedItem && clickedItem.dataset.url) chrome.tabs.create({ active: true, url: clickedItem.dataset.url });
});

companySelect.addEventListener('change', renderCompanyQuestions);
topicSelect.addEventListener('change', renderCompanyQuestions);
sortSelect.addEventListener('change', renderCompanyQuestions);

function processTab(activeTab) {
    if (activeTab && activeTab.url && activeTab.url.includes("leetcode.com/contest/")) { triggerLockdownState(); return; }
    if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) { resetToIdleState(); return; }

    const match = activeTab.url.match(/leetcode\.com\/problems\/([^/]+)/);
    const slug = match ? match[1] : null;

    chrome.tabs.sendMessage(activeTab.id, { action: "GET_PROBLEM" }, async (response) => {
        if (chrome.runtime.lastError || !response || !response.title) {
            if (slug) {
                const db = await getDatabase();
                if (db) {
                    const matchedTitle = Object.keys(db).find(key => (db[key].url || `https://leetcode.com/problems/${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`).includes(slug));
                    if (matchedTitle) { loadProblemData(matchedTitle); return; }
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
        if (!tabs[0]) chrome.tabs.query({ active: true, lastFocusedWindow: true }, (fallbackTabs) => { if (fallbackTabs[0]) processTab(fallbackTabs[0]); });
        else processTab(tabs[0]);
    });
}

chrome.runtime.onMessage.addListener((message) => { if (message.action === "SPA_URL_CHANGED") setTimeout(fetchContext, 1000); });
chrome.tabs.onActivated.addListener(fetchContext);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { if (changeInfo.status === 'complete' && tab.active) fetchContext(); });

// --- SETTINGS MODAL LISTENERS ---
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        // Fetch existing settings to populate the fields
        chrome.storage.local.get(['githubToken', 'githubRepo'], (result) => {
            if (result.githubToken) ghTokenInput.value = result.githubToken;
            if (result.githubRepo) ghRepoInput.value = result.githubRepo;
        });
        settingsModal.style.display = 'flex';
    });
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        settingsSaveStatus.style.display = 'none';
    });
}

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
        const token = ghTokenInput.value.trim();
        const repo = ghRepoInput.value.trim() || 'LeetCode-Solutions'; 

        saveSettingsBtn.innerText = "Saving...";
        
        chrome.storage.local.set({ githubToken: token, githubRepo: repo }, () => {
            settingsSaveStatus.style.display = 'block';
            saveSettingsBtn.innerText = "Save Configuration";
            
            setTimeout(() => {
                settingsSaveStatus.style.display = 'none';
                settingsModal.style.display = 'none';
            }, 1200);
        });
    });
}

initAuth();
syncHistoricalLeetCodeData();