document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    setupTabs();
    setupEventListeners();
    setInterval(updateDisplay, 1000);
});

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabName = btn.getAttribute('data-tab');
            document.getElementById(tabName).classList.add('active');
            if (tabName === 'sites') loadTopSites();
            else if (tabName === 'reports') loadReports();
        });
    });
}

function setupEventListeners() {
    document.getElementById('resetBtn').addEventListener('click', resetToday);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('downloadBtn').addEventListener('click', downloadReport);
}

function updateDisplay() {
    // Get accurate total time from background (includes current session)
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

        // Update current site info
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

function loadTopSites() {
    chrome.storage.local.get(['siteTimes'], (result) => {
        const sites = Object.entries(result.siteTimes || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        document.getElementById('topSites').innerHTML = sites.length > 0
            ? sites.map(([domain, time]) =>
                `<div class="site-item"><span class="site-domain">${domain}</span><span class="site-time">${formatTime(time)}</span></div>`
              ).join('')
            : '<p style="text-align:center;color:#999;">אין נתונים עדיין</p>';
    });
}

function loadReports() {
    chrome.storage.local.get(['dailyHistory'], (result) => {
        const history = result.dailyHistory || [];

        const weeklyData = calculateWeekly(history);
        document.getElementById('weeklyReport').innerHTML = weeklyData.length > 0
            ? weeklyData.map(day =>
                `<div class="site-item"><span class="site-domain">${day.date}</span><span class="site-time">${formatTime(day.totalTime)}</span></div>`
              ).join('')
            : '<p style="text-align:center;color:#999;">אין נתונים</p>';

        const monthlyData = calculateMonthly(history);
        document.getElementById('monthlyReport').innerHTML = monthlyData.length > 0
            ? monthlyData.map(week =>
                `<div class="site-item"><span class="site-domain">${week.label}</span><span class="site-time">${formatTime(week.totalTime)}</span></div>`
              ).join('')
            : '<p style="text-align:center;color:#999;">אין נתונים</p>';
    });
}

function calculateWeekly(history) {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayData = history.find(h => h.date === dateStr);
        return { date: dateStr, totalTime: dayData ? dayData.totalTime : 0 };
    });
}

function calculateMonthly(history) {
    const today = new Date();
    return Array.from({ length: 4 }, (_, week) => {
        let totalTime = 0;
        for (let day = 6; day >= 0; day--) {
            const date = new Date(today);
            date.setDate(date.getDate() - (week * 7 + day));
            const dateStr = date.toISOString().split('T')[0];
            const dayData = history.find(h => h.date === dateStr);
            if (dayData) totalTime += dayData.totalTime;
        }
        return { label: `שבוע ${week + 1}`, totalTime };
    });
}

function downloadReport() {
    chrome.storage.local.get(['siteTimes', 'dailyHistory'], (result) => {
        const history = result.dailyHistory || [];
        const siteTimes = result.siteTimes || {};
        const today = new Date().toISOString().split('T')[0];

        let csv = 'תאריך,דומיין,זמן (דקות)\n';
        for (const [domain, time] of Object.entries(siteTimes)) {
            csv += `${today},${domain},${Math.floor(time / 60000)}\n`;
        }
        for (const day of history) {
            for (const [domain, time] of Object.entries(day.siteTimes || {})) {
                csv += `${day.date},${domain},${Math.floor(time / 60000)}\n`;
            }
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `time-tracker-report-${today}.csv`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    chrome.storage.local.set({ totalTime: 0, lastReset: Date.now(), siteTimes: {} });
    updateDisplay();
}

function openSettings() {
    chrome.runtime.openOptionsPage();
}
