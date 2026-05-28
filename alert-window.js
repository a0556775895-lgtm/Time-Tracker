chrome.runtime.sendMessage({ action: 'getUsageInfo' }, (response) => {
    if (response && response.totalTime) {
        document.getElementById('usageTime').textContent = formatTime(response.totalTime);
    }
});

document.getElementById('snoozeBtn').addEventListener('click', () => {
    const options = document.getElementById('snoozeOptions');
    if (options.style.display === 'none') {
        options.style.display = 'flex';
        document.getElementById('snoozeBtn').textContent = 'בחר זמן';
    }
});

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        chrome.runtime.sendMessage({ action: 'snoozeAlert', minutes }, () => window.close());
    });
});

document.getElementById('dismissBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'dismissAlert' }, () => window.close());
});

document.getElementById('disableBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'disableAlertsToday' }, () => window.close());
});

function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h === 0 ? `${m} דקות` : `${h} שעות ${m} דקות`;
}
