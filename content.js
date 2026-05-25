// Prevent double injection
if (window.__timeTrackerLoaded) {
    // already running, skip
} else {
    window.__timeTrackerLoaded = true;

let timerWidget = null;
let updateIntervalId = null;
let pendingRequest = false;
let cachedTime = 0;

function isExtensionContextValid() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; }
}

function initializeTimerWidget() {
    console.log('[TT] initializeTimerWidget called, body:', !!document.body);
    if (timerWidget && document.body.contains(timerWidget)) { console.log('[TT] widget already exists'); return; }
    if (!document.body) { setTimeout(initializeTimerWidget, 100); return; }

    chrome.storage.sync.get(['showOverlay'], (result) => {
        console.log('[TT] showOverlay:', result.showOverlay, 'lastError:', chrome.runtime.lastError?.message);
        if (chrome.runtime.lastError) { createWidget(); return; }
        if (result.showOverlay !== false) createWidget();
        else console.log('[TT] showOverlay is false, not creating widget');
    });
}

function createWidget() {
    console.log('[TT] createWidget called');
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
    timerWidget.textContent = '⏱ ...';

    function updateTimer() {
        if (!isExtensionContextValid()) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
            return;
        }
        if (!timerWidget || !document.body.contains(timerWidget)) return;

        // Calculate locally: savedTotal + time since activeTabStartTime
        const now = Date.now();
        const elapsed = (activeTabStartTime > 0) ? (now - activeTabStartTime) : 0;
        renderTime(savedTotal + elapsed);
    }

    // Fetch base values from background once, then tick locally
    function fetchAndSync() {
        if (!isExtensionContextValid()) return;
        chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
            if (chrome.runtime.lastError || !response) return;
            // Sync: store the total and reset local start
            savedTotal = response.totalTime || 0;
            activeTabStartTime = Date.now();
        });
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

    let savedTotal = 0;
    let activeTabStartTime = 0;

    fetchAndSync();
    updateTimer();
    updateIntervalId = setInterval(updateTimer, 1000);
    // Re-sync with background every 10 seconds to stay accurate
    setInterval(fetchAndSync, 10000);
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

// document_idle guarantees body exists, but keep fallback just in case
console.log('[TT] content.js loaded, readyState:', document.readyState, 'body:', !!document.body);
if (document.body) {
    initializeTimerWidget();
} else {
    document.addEventListener('DOMContentLoaded', initializeTimerWidget);
}

} // end of window.__timeTrackerLoaded guard
