// Get usage info from background
chrome.runtime.sendMessage({ action: 'getUsageInfo' }, (response) => {
    if (response && response.totalTime) {
        const timeStr = formatTime(response.totalTime);
        document.getElementById('usageTime').textContent = timeStr;
    }
});

// Toggle snooze options
document.getElementById('snoozeBtn').addEventListener('click', () => {
    const options = document.getElementById('snoozeOptions');
    if (options.style.display === 'none') {
        options.style.display = 'flex';
        document.getElementById('snoozeBtn').textContent = 'בחר זמן';
    }
});

// Handle snooze time selection
document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        
        // Deselect others
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        // Send snooze request
        chrome.runtime.sendMessage({
            action: 'snoozeAlert',
            minutes: minutes
        }, () => {
            // Close window
            window.close();
        });
    });
});

// Handle dismiss button
document.getElementById('dismissBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
        action: 'dismissAlert'
    }, () => {
        window.close();
    });
});

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
        return `${minutes} דקות`;
    }
    return `${hours} שעות ${minutes} דקות`;
}
