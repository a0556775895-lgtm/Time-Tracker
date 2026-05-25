function updateTimer() {
    // Use background message to get accurate time including current session
    chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
        if (chrome.runtime.lastError || !response) return;

        chrome.storage.local.get(['dailyLimit'], (result) => {
            const totalTime = response.totalTime || 0;
            const dailyLimit = result.dailyLimit || 2 * 60 * 60 * 1000;

            const totalSeconds = Math.floor(totalTime / 1000);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;

            const percentage = Math.min(Math.round((totalTime / dailyLimit) * 100), 100);

            document.getElementById('time').textContent =
                `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            document.getElementById('percentage').textContent = percentage;

            const progressFill = document.getElementById('progress');
            progressFill.style.width = percentage + '%';
            progressFill.style.background = percentage >= 100 ? '#ff6b6b' : percentage >= 80 ? '#ffd93d' : '#4caf50';
        });
    });
}

updateTimer();
setInterval(updateTimer, 1000);
