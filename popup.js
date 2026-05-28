document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    updatePauseUI();
    setInterval(updateDisplay, 1000);
    setInterval(updatePauseUI, 5000);

    document.getElementById('resetBtn').addEventListener('click', resetToday);
    document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('reportsBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('reports.html') });
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        const opts = document.getElementById('pauseOptions');
        opts.style.display = opts.style.display === 'none' ? 'flex' : 'none';
    });

    document.querySelectorAll('.pause-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            chrome.runtime.sendMessage({ action: 'pauseTracking', minutes }, () => {
                document.getElementById('pauseOptions').style.display = 'none';
                updatePauseUI();
            });
        });
    });

    document.getElementById('resumeBtn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'resumeTracking' }, updatePauseUI);
    });
});

function updatePauseUI() {
    chrome.runtime.sendMessage({ action: 'getPauseStatus' }, (r) => {
        if (chrome.runtime.lastError || !r) return;
        const pauseBar = document.getElementById('pauseBar');
        const pauseBtn = document.getElementById('pauseBtn');
        const remaining = r.pausedUntil - Date.now();
        if (remaining > 0) {
            pauseBar.style.display = 'flex';
            pauseBtn.classList.add('active');
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            document.getElementById('pauseCountdown').textContent = `${m}:${String(s).padStart(2,'0')}`;
        } else {
            pauseBar.style.display = 'none';
            pauseBtn.classList.remove('active');
        }
    });
}

function updateDisplay() {
    chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
        if (chrome.runtime.lastError || !response) return;
        const totalTime = response.totalTime || 0;

        chrome.storage.local.get(['streak'], (loc) => {
            const streak = loc.streak || 0;
            const streakBar = document.getElementById('streakBar');
            if (streak > 0) {
                streakBar.style.display = 'block';
                streakBar.textContent = `🔥 רצף: ${streak} ${streak === 1 ? 'יום' : 'ימים'} בתוך המגבלה`;
            } else {
                streakBar.style.display = 'none';
            }
        });

        chrome.storage.sync.get(['limitHours', 'limitMinutes', 'enableWarning'], (syncResult) => {
            if (chrome.runtime.lastError) return;
            const dailyLimit = (((syncResult.limitHours ?? 2) * 60) + (syncResult.limitMinutes ?? 0)) * 60 * 1000;
            const pct = Math.min(totalTime / dailyLimit, 1);
            const pctDisplay = Math.round(pct * 100);

            const circumference = 314;
            const ringFill = document.getElementById('ringFill');
            if (ringFill) {
                ringFill.style.strokeDashoffset = circumference - pct * circumference;
                ringFill.style.stroke = pct >= 1 ? '#f87171' : pct >= 0.8 ? '#fbbf24' : '#a78bfa';
            }

            const totalTimeEl = document.getElementById('totalTime');
            const usagePctEl = document.getElementById('usagePct');
            const dailyLimitEl = document.getElementById('dailyLimit');
            const warningEl = document.getElementById('warning');

            if (totalTimeEl) totalTimeEl.textContent = formatTime(totalTime);
            if (usagePctEl) usagePctEl.textContent = pctDisplay + '%';
            if (dailyLimitEl) dailyLimitEl.textContent = 'מתוך ' + formatTime(dailyLimit);
            if (warningEl) {
                const showWarning = syncResult.enableWarning !== false && pct >= 0.8 && pct < 1;
                warningEl.style.display = showWarning ? 'block' : 'none';
            }
        });
    });
}

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h === 0) return `${m} דקות`;
    return `${h}:${String(m).padStart(2,'0')} שעות`;
}

function resetToday() {
    if (!confirm('לאפס את נתוני היום?')) return;
    chrome.storage.local.set({ totalTime: 0, trackingStart: null, lastReset: Date.now(), siteTimes: {}, widgetWarning: 'normal' });
    updateDisplay();
}
