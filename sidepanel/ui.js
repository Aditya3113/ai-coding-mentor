// --- UI HELPERS & FORMATTING ---
const COMPANY_DISPLAY_NAMES = {
    "amazon": "Amazon", "google": "Google"
};

function formatName(str) {
    if (!str) return "";
    const lowerStr = str.toLowerCase();
    if (COMPANY_DISPLAY_NAMES[lowerStr]) {
        return COMPANY_DISPLAY_NAMES[lowerStr];
    }
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

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

// --- COMPANY PREP GRID RENDERER ---
function populateCompanyDropdown() {
    companySelect.innerHTML = `<option value="" disabled selected>Select a Company...</option>`;
    const uniqueCompanies = new Set();
    globalDatabaseArray.forEach(p => {
        if (p.companies) p.companies.forEach(c => uniqueCompanies.add(c.toLowerCase()));
    });
    Array.from(uniqueCompanies).sort().forEach(company => {
        const option = document.createElement('option');
        option.value = company; 
        option.textContent = formatName(company); 
        companySelect.appendChild(option);
    });
}

function populateTopicDropdown() {
    const uniqueTopics = new Set();
    globalDatabaseArray.forEach(p => {
        if (p.topics && Array.isArray(p.topics)) p.topics.forEach(t => uniqueTopics.add(t));
    });
    topicSelect.innerHTML = `<option value="All">All Topics</option>`;
    Array.from(uniqueTopics).sort().forEach(topic => {
        const option = document.createElement('option');
        option.value = topic; 
        option.textContent = topic; 
        topicSelect.appendChild(option);
    });
}

async function renderCompanyQuestions() {
    if (!globalIsPremium) return;
    const selectedCompany = companySelect.value;
    const selectedTopic = topicSelect.value;
    const selectedSort = sortSelect.value;

    if (!selectedCompany) {
        questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px; margin-top: 20px;">Select a company to view problems.</p>`;
        return;
    }

    const getFreq = (problem, companyName) => {
        if (!problem.companyFrequencies) return 0;
        const matchedKey = Object.keys(problem.companyFrequencies).find(k => k.toLowerCase() === companyName.toLowerCase());
        return matchedKey ? problem.companyFrequencies[matchedKey] : 0;
    };

    const storage = await new Promise(resolve => chrome.storage.local.get(['solvedProblems'], resolve));
    const solvedList = storage.solvedProblems || [];

    let filtered = globalDatabaseArray.filter(p => p.companies && p.companies.some(c => c.toLowerCase() === selectedCompany.toLowerCase()));
    if (selectedTopic !== "All") filtered = filtered.filter(p => p.topics && p.topics.includes(selectedTopic));

    filtered.sort((a, b) => {
        if (selectedSort === 'freq-desc') return getFreq(b, selectedCompany) - getFreq(a, selectedCompany);
        const diffWeight = { "Easy": 1, "Medium": 2, "Hard": 3 };
        return selectedSort === 'diff-asc' ? (diffWeight[a.difficulty] || 0) - (diffWeight[b.difficulty] || 0) : (diffWeight[b.difficulty] || 0) - (diffWeight[a.difficulty] || 0);
    });

    if (filtered.length === 0) {
        questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px;">No problems found for these filters.</p>`;
        return;
    }

    const headerHtml = `
        <div style="display: grid; grid-template-columns: 60px 1fr 50px 60px; gap: 10px; align-items: center; padding: 0 12px 8px 12px; border-bottom: 1px solid #30363d; margin-bottom: 4px; font-size: 12px; color: #8b949e; font-weight: bold;">
            <div>ID</div><div>Problem Title</div><div style="text-align: right;">Freq</div><div style="text-align: right;">Diff</div>
        </div>
    `;

    const rowsHtml = filtered.map((q, index) => {
        let color = q.difficulty === "Hard" ? "#ff375f" : q.difficulty === "Medium" ? "#ffc01e" : "#00b8a3"; 
        const problemUrl = q.url || `https://leetcode.com/problems/${q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
        const rawFreq = getFreq(q, selectedCompany);
        const displayFreq = rawFreq > 0 ? `${rawFreq.toFixed(1)}%` : '-';
        const isSolved = solvedList.includes(q.title);
        const checkmark = isSolved ? `<svg viewBox="0 0 24 24" fill="none" stroke="#2ea043" stroke-width="2.5" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>` : `<div style="width: 14px;"></div>`;
        const rowBg = index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.03)";

        return `
        <div class="question-click-item" data-url="${problemUrl}" style="cursor: pointer; display: grid; grid-template-columns: 60px 1fr 50px 60px; gap: 10px; align-items: center; width: 100%; padding: 8px 12px; background: ${rowBg}; border-radius: 4px;">
            <div style="color: #eff1f6; font-size: 14px; display:flex; align-items:center; gap: 6px;">${checkmark} <span>${q.id || '-'}</span></div>
            <div style="color: #eff1f6; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${q.title}">${q.title}</div>
            <div style="color: #ff9800; font-size: 12px; font-weight: bold; text-align: right;">${displayFreq}</div>
            <div style="color: ${color}; font-size: 12px; font-weight: bold; text-align: right;">${q.difficulty}</div>
        </div>`;
    }).join('');

    questionList.innerHTML = headerHtml + rowsHtml;
}

async function loadProblemData(title) {
    const db = await getDatabase();
    if (!db) {
        idleState.innerHTML = `<p style="font-size: 13px;">Error loading database.</p>`;
        return;
    }
    const data = db[title];

    if (data) {
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
            if (timerInput) timerInput.value = Math.floor(data.timeLimit / 60);
            clearInterval(timerInterval);
            isTimerRunning = false;
            if (timerToggleBtn) timerToggleBtn.textContent = "Start";
            timerSecondsRemaining = data.timeLimit;
            updateTimerDisplay();
        }
        
        const freeCompany = data.companies && data.companies[0] ? formatName(data.companies[0]) : "Standard";
        const hiddenCount = data.companies ? data.companies.length - 1 : 0;
        
        if (globalIsPremium) {
            companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${formatName(c)}</div>`).join('');
        } else if (hiddenCount > 0) {
            companyTags.innerHTML = `
                <div class="tag-free">${freeCompany}</div>
                <div class="tag-locked" id="unlockCompaniesBtn" title="Sign in to unlock premium companies!">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  +${hiddenCount}
                </div>
            `;
            document.getElementById('unlockCompaniesBtn').addEventListener('click', async (e) => {
                const btn = e.target.closest('.tag-locked');
                btn.innerHTML = `Loading...`;
                let user = globalUser; 
                if (!user && typeof window.signInWithGoogle === "function") {
                    user = await window.signInWithGoogle();
                    if (user) await initAuth(user); 
                }
                if (user) {
                    btn.innerHTML = `Checking access...`;
                    const isPremium = await window.checkUserPremium(user.uid);
                    if (isPremium) {
                        globalIsPremium = true; 
                        companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${formatName(c)}</div>`).join('');
                    } else {
                        btn.style.display = "none";
                        const paymentContainer = document.createElement('div');
                        paymentContainer.style.width = "100%";
                        paymentContainer.style.marginTop = "12px";
                        paymentContainer.innerHTML = `
                            <div style="padding:12px; background:rgba(255, 152, 0, 0.05); border:1px solid #ff9800; border-radius:6px; display:flex; flex-direction:column; gap:8px;">
                                <div style="font-size:12px; color:#8b949e; text-align:center; font-weight:500;">Premium Lifetime Unlock</div>
                                <input type="text" id="promoInput" placeholder="PROMO CODE" style="padding:8px; background:#0d1117; color:#fff; border:1px solid #30363d; border-radius:4px; text-transform:uppercase; text-align:center; outline:none;">
                                <button id="payActionBtn" style="padding:10px; background:#ff9800; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Proceed to Pay</button>
                            </div>
                        `;
                        companyTags.parentElement.appendChild(paymentContainer);
                        
                        const payActionBtn = document.getElementById('payActionBtn');
                        let currentOrderId = null;
                        payActionBtn.addEventListener('click', async (evt) => {
                            evt.stopPropagation(); 
                            if (payActionBtn.innerText === "Verify Payment") {
                                payActionBtn.innerText = "Verifying...";
                                try {
                                    const res = await fetch('http://localhost:3000/verify-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: currentOrderId }) });
                                    const vData = await res.json();
                                    if (vData.success) {
                                        await window.upgradeUserToPremium(user.uid);
                                        globalIsPremium = true; 
                                        fetchContext(); 
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
                                const response = await fetch('http://localhost:3000/create-order', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ promo_code: document.getElementById('promoInput').value.trim(), uid: user.uid })
                                });
                                const apiData = await response.json();
                                if (apiData.error) { alert(apiData.error); payActionBtn.innerText = "Proceed to Pay"; return; }
                                currentOrderId = apiData.order.id;
                                chrome.tabs.create({ url: `http://localhost:3000/pay?order_id=${currentOrderId}&amount=${apiData.finalAmount}` });
                                payActionBtn.innerText = "Verify Payment";
                                document.getElementById('promoInput').style.display = "none"; 
                            } catch (error) { payActionBtn.innerText = "Proceed to Pay"; }
                        });
                    }
                } else {
                    btn.innerHTML = `+${hiddenCount}`;
                }
            });
        } else {
            companyTags.innerHTML = `<div class="tag-free">${freeCompany}</div>`;
        }
    } else {
        headerTitle.textContent = title;
        dashboardState.style.display = 'none';
        lockdownState.style.display = 'none';
        idleState.style.display = 'block';
        idleState.innerHTML = `<p style="font-size: 13px;">Tracking activated for <b>${title}</b>.<br><br>Data for this problem is not in the cloud database yet.</p>`;
    }
}