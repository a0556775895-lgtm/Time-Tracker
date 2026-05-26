if (!window.__timeTrackerLoaded) {
window.__timeTrackerLoaded = true;

let timerWidget = null;
let intervalId = null;

function isContextValid() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; }
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

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function tick() {
    if (!isContextValid()) { clearInterval(intervalId); removeWidget(); return; }
    if (!timerWidget || !document.body.contains(timerWidget)) return;
    try {
        chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
            if (chrome.runtime.lastError || !response) return;
            const totalMs = response.totalTime || 0;
            const totalStr = formatTime(totalMs);

            chrome.storage.sync.get(['showSiteTime'], (syncResult) => {
                if (!syncResult.showSiteTime && syncResult.showSiteTime !== undefined) {
                    timerWidget.textContent = totalStr;
                    return;
                }
                // Show site time with live tracking
                chrome.storage.local.get(['siteTimes', 'trackingStart'], (local) => {
                    const hostname = location.hostname;
                    const siteName = document.title || hostname;
                    let siteMs = (local.siteTimes || {})[hostname] || 0;
                    
                    // Add current session time if tracking is active
                    if (local.trackingStart) {
                        siteMs += Date.now() - local.trackingStart;
                    }
                    
                    timerWidget.innerHTML =
                        `<div>${totalStr}</div><div style="font-size:11px;color:#888;margin-top:2px">${siteName ? siteName + ': ' + formatTime(siteMs) : ''}</div>`;
                });
            });
        });
    } catch (e) {
        clearInterval(intervalId);
        intervalId = null;
        removeWidget();
    }
}

function createWidget() {
    if (timerWidget && document.body.contains(timerWidget)) return;
    timerWidget = document.createElement('div');
    timerWidget.id = 'time-tracker-widget';
    timerWidget.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: white; border: 2px solid #333;
        padding: 10px 15px; border-radius: 5px;
        font-family: monospace; font-size: 14px;
        z-index: 999999; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        color: #333; min-width: 150px; text-align: center;
    `;
    timerWidget.textContent = '⏱ ...';
    try { document.body.appendChild(timerWidget); } catch (e) { return; }
    intervalId = setInterval(tick, 1000);
    tick();
}

function removeWidget() {
    clearInterval(intervalId);
    intervalId = null;
    if (timerWidget) { timerWidget.remove(); timerWidget = null; }
}

function init() {
    if (!document.body) { setTimeout(init, 100); return; }
    chrome.storage.sync.get(['showOverlay'], (r) => {
        if (!chrome.runtime.lastError && r.showOverlay === false) return;
        createWidget();
    });
}

chrome.storage.onChanged.addListener((changes, ns) => {
    if (!isContextValid()) return;
    if (ns !== 'sync' || !('showOverlay' in changes)) return;
    changes.showOverlay.newValue === false ? removeWidget() : init();
});

window.addEventListener('beforeunload', removeWidget, { once: true });

try { init(); } catch (e) {}

} // end guard
