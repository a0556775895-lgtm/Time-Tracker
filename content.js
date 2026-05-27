if (!window.__timeTrackerLoaded) {
window.__timeTrackerLoaded = true;

let timerWidget = null;
let intervalId = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

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

function applyWarningStyle(warning) {
    if (!timerWidget) return;
    if (warning === 'exceeded') {
        timerWidget.style.background = '#ff6b6b';
        timerWidget.style.color = 'white';
        timerWidget.style.borderColor = '#ff5252';
    } else if (warning === 'warning') {
        timerWidget.style.background = '#fff3cd';
        timerWidget.style.color = '#856404';
        timerWidget.style.borderColor = '#ffc107';
    } else {
        timerWidget.style.background = 'white';
        timerWidget.style.color = '#333';
        timerWidget.style.borderColor = '#333';
    }
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
                    chrome.storage.local.get(['widgetWarning'], (local) => {
                        applyWarningStyle(local.widgetWarning || 'normal');
                        timerWidget.textContent = totalStr;
                    });
                    return;
                }
                chrome.storage.local.get(['siteTimes', 'trackingStart', 'widgetWarning'], (local) => {
                    applyWarningStyle(local.widgetWarning || 'normal');
                    const hostname = location.hostname;
                    let siteMs = (local.siteTimes || {})[hostname] || 0;
                    if (local.trackingStart) siteMs += Date.now() - local.trackingStart;
                    timerWidget.innerHTML =
                        `<div>${totalStr}</div><div style="font-size:11px;opacity:0.8;margin-top:2px">${hostname ? hostname + ': ' + formatTime(siteMs) : ''}</div>`;
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
        background: rgba(255, 255, 255, 0.7); border: 2px solid #333;
        padding: 10px 15px; border-radius: 5px;
        font-family: monospace; font-size: 14px;
        z-index: 999999; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        color: #333; min-width: 150px; text-align: center;
        backdrop-filter: blur(5px); cursor: move;
    `;
    timerWidget.textContent = '⏱ ...';
    
    // Add drag functionality
    timerWidget.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    try { document.body.appendChild(timerWidget); } catch (e) { return; }
    intervalId = setInterval(tick, 1000);
    tick();
}

function startDrag(e) {
    isDragging = true;
    const rect = timerWidget.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    timerWidget.style.transition = 'none';
    e.preventDefault();
}

function drag(e) {
    if (!isDragging) return;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Keep widget within viewport
    const maxX = window.innerWidth - timerWidget.offsetWidth;
    const maxY = window.innerHeight - timerWidget.offsetHeight;
    
    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));
    
    timerWidget.style.left = clampedX + 'px';
    timerWidget.style.top = clampedY + 'px';
    timerWidget.style.right = 'auto';
    timerWidget.style.bottom = 'auto';
}

function stopDrag() {
    if (isDragging) {
        isDragging = false;
        timerWidget.style.transition = '';
    }
}

function removeWidget() {
    clearInterval(intervalId);
    intervalId = null;
    if (timerWidget) {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        timerWidget.remove();
        timerWidget = null;
    }
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
