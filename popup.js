document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    setInterval(updateDisplay, 1000);

    document.getElementById('resetBtn').addEventListener('click', resetToday);
    document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('reportsBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('reports.html') });
    });
});

function updateDisplay() {
    chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
        if (chrome.runtime.lastError || !response) return;
        const totalTime = response.totalTime || 0;

        chrome.storage.sync.get(['limitHours', 'limitMinutes', 'enableWarning'], (syncResult) => {
            if (chrome.runtime.lastError) return;
            const dailyLimit = ((syncResult.limitHours || 2) * 60 + (syncResult.limitMinutes || 0)) * 60 * 1000;
            const pct = Math.min(totalTime / dailyLimit, 1);
            const pctDisplay = Math.round(pct * 100);

            // Ring
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
