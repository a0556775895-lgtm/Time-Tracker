let timerWidget = null;
let updateIntervalId = null;
let pendingRequest = false;
let cachedTime = 0;

function isExtensionContextValid() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; }
}

function initializeTimerWidget() {
    if (timerWidget && document.body.contains(timerWidget)) return;
    if (!document.body) { setTimeout(initializeTimerWidget, 100); return; }

    // Respect the showOverlay setting
    chrome.storage.sync.get(['showOverlay'], (result) => {
        if (chrome.runtime.lastError || result.showOverlay === false) return;
        createWidget();
    });
}

function createWidget() {
    timerWidget = document.createElement('div');
    timerWidget.id = 'time-tracker-widget';
    timerWidget.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 2px solid #333;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        color: #333;
        min-width: 150px;
        text-align: center;
        line-height: 1.4;
    `;

    try { document.body.appendChild(timerWidget); } catch (e) { return; }

    function updateTimer() {
        if (!isExtensionContextValid()) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
            return;
        }
        if (!timerWidget || !document.body.contains(timerWidget)) return;
        if (pendingRequest) {
            if (cachedTime > 0) renderTime(cachedTime);
            return;
        }

        pendingRequest = true;
        let timeoutId = setTimeout(() => { pendingRequest = false; }, 500);

        try {
            chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
                clearTimeout(timeoutId);
                pendingRequest = false;
                if (chrome.runtime.lastError || !response) return;
                cachedTime = response.totalTime || 0;
                renderTime(cachedTime);
            });
        } catch (e) {
            clearTimeout(timeoutId);
            pendingRequest = false;
        }
    }

    function renderTime(ms) {
        if (!timerWidget) return;
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        timerWidget.textContent =
            `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }

    updateTimer();
    updateIntervalId = setInterval(updateTimer, 1000);
}

function cleanupWidget() {
    if (updateIntervalId !== null) { clearInterval(updateIntervalId); updateIntervalId = null; }
    if (timerWidget && document.body.contains(timerWidget)) { timerWidget.remove(); timerWidget = null; }
}

// React to showOverlay setting changes without page reload
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync' || !('showOverlay' in changes)) return;
    if (changes.showOverlay.newValue === false) {
        cleanupWidget();
    } else {
        initializeTimerWidget();
    }
});

window.addEventListener('beforeunload', cleanupWidget, { once: true });

if (document.body && document.readyState !== 'loading') {
    initializeTimerWidget();
} else {
    document.addEventListener('DOMContentLoaded', initializeTimerWidget);
}
