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

            const totalTimeEl = document.getElementById('totalTime');
            const dailyLimitEl = document.getElementById('dailyLimit');
            const warningEl = document.getElementById('warning');

            if (totalTimeEl) totalTimeEl.textContent = formatTime(totalTime);
            if (dailyLimitEl) dailyLimitEl.textContent = formatTime(dailyLimit);
            if (warningEl) {
                const showWarning = syncResult.enableWarning !== false && totalTime > dailyLimit * 0.8;
                warningEl.style.display = showWarning ? 'block' : 'none';
            }
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || !tabs[0] || !tabs[0].url) return;
            try {
                const domain = new URL(tabs[0].url).hostname;
                const currentSiteEl = document.getElementById('currentSite');
                if (currentSiteEl) currentSiteEl.textContent = domain || '---';

                chrome.storage.local.get(['siteTimes'], (result) => {
                    const siteTimeEl = document.getElementById('siteTime');
                    if (siteTimeEl) siteTimeEl.textContent = formatTime((result.siteTimes || {})[domain] || 0);
                });
            } catch (e) {}
        });
    });
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes} דקות`;
    return `${hours} שעות ${minutes} דקות`;
}

function resetToday() {
    if (!confirm('לאפס את נתוני היום?')) return;
    chrome.storage.local.set({ totalTime: 0, trackingStart: null, lastReset: Date.now(), siteTimes: {} });
    updateDisplay();
}
