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

    const idleState       = document.getElementById('idleState');
    const dashboardState  = document.getElementById('dashboardState');
    const headerTitle     = document.getElementById('headerTitle');
    const difficultyBadge = document.getElementById('difficultyBadge');
    const pressureTimer   = document.getElementById('pressureTimer');

    const companyTags       = document.getElementById('companyTags');
    const targetTime        = document.getElementById('targetTime');
    const targetSpace       = document.getElementById('targetSpace');
    const hintsContainer    = document.getElementById('hintsContainer');
    const hintCount         = document.getElementById('hintCount');
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

    function loadProblemData(title) {
        const data = problemDatabase[title];

        if (data) {
            idleState.style.display = 'none';
            dashboardState.style.display = 'flex';
            headerTitle.textContent = title;

            // Difficulty badge
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

            // Companies
            const freeCompany  = data.companies[0];
            const hiddenCount  = data.companies.length - 1;
            companyTags.innerHTML = `
                <div class="tag-free">${freeCompany}</div>
                <div class="tag-locked" title="Pay ₹50 to unlock!">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  +${hiddenCount}
                </div>
            `;

            // Hints — one nested accordion per hint
            hintsContainer.innerHTML = '';
            data.hints.forEach((hint, i) => {
                hintsContainer.appendChild(
                    buildNestedAccordion(`Hint ${i + 1}`, hint)
                );
            });
            hintCount.textContent = `0/${data.hints.length}`;

            // Track open count for badge
            hintsContainer.querySelectorAll('.nested-accordion-header').forEach(h => {
                h.addEventListener('click', () => {
                    // count after toggle (toggle happens via delegation before this fires,
                    // but classList.toggle fires in delegation so we use setTimeout 0)
                    setTimeout(() => {
                        const opened = hintsContainer.querySelectorAll('.nested-accordion-item.active').length;
                        hintCount.textContent = `${opened}/${data.hints.length}`;
                    }, 0);
                });
            });

            // Edge Cases — one nested accordion per case
            edgeCasesContainer.innerHTML = '';
            data.edgeCases.forEach((ec, i) => {
                edgeCasesContainer.appendChild(
                    buildNestedAccordion(`Case ${i + 1}`, `<code style="font-family:monospace;font-size:12px;">${ec}</code>`)
                );
            });

        } else {
            headerTitle.textContent = title;
            idleState.innerHTML = `<p style="font-size: 13px;">Tracking activated for <b>${title}</b>.<br><br>Data for this problem is not in the mock database.</p>`;
        }
    }

    function fetchContext() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id || !activeTab.url.includes("leetcode.com/problems/")) return;

            chrome.tabs.sendMessage(activeTab.id, { action: "GET_PROBLEM" }, (response) => {
                if (chrome.runtime.lastError) return;
                if (response && response.title) {
                    loadProblemData(response.title);
                }
            });
        });
    }

    fetchContext();
});