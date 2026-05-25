let activeTabId = null;
let alertDismissedUntil = 0;
let alertShown = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextResetTime(hour) {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime();
}

function getEndOfDay() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function isBlockedNow(site) {
    if (!site.enableConditionalBlock) return true;
    const now = new Date();
    const [sh, sm] = site.blockStartTime.split(':').map(Number);
    const [eh, em] = site.blockEndTime.split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= sh * 60 + sm && cur < eh * 60 + em;
}

// ── Tracking: start / pause / resume ─────────────────────────────────────────

function startTracking() {
    chrome.storage.local.get(['trackingStart'], (r) => {
        if (r.trackingStart) return; // already tracking
        chrome.storage.local.set({ trackingStart: Date.now() });
    });
}

function pauseTracking() {
    chrome.storage.local.get(['trackingStart', 'totalTime'], (r) => {
        if (!r.trackingStart) return; // already paused
        const elapsed = Date.now() - r.trackingStart;
        const totalTime = (r.totalTime || 0) + elapsed;
        chrome.storage.local.set({ totalTime, trackingStart: null });
        checkLimitExceeded(totalTime);
    });
}

function checkLimitExceeded(totalTime) {
    chrome.storage.local.get(['dailyLimit'], (r) => {
        const limit = r.dailyLimit || 2 * 60 * 60 * 1000;
        if (totalTime > limit && Date.now() > alertDismissedUntil && !alertShown) {
            showLimitExceededAlert();
        }
    });
}

// ── Messages ──────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTime') {
        chrome.storage.local.get(['totalTime', 'trackingStart'], (r) => {
            if (chrome.runtime.lastError) { sendResponse({ totalTime: 0 }); return; }
            let total = r.totalTime || 0;
            if (r.trackingStart) total += Date.now() - r.trackingStart;
            try { sendResponse({ totalTime: total }); } catch (e) {}
        });
        return true;
    }

    if (request.action === 'getUsageInfo') {
        chrome.storage.local.get(['totalTime'], (r) => {
            try { sendResponse({ totalTime: r.totalTime || 0 }); } catch (e) {}
        });
        return true;
    }

    if (request.action === 'snoozeAlert') {
        alertDismissedUntil = Date.now() + ((request.minutes || 5) * 60 * 1000);
        alertShown = false;
        sendResponse({ success: true });
    }

    if (request.action === 'dismissAlert') {
        alertDismissedUntil = getEndOfDay();
        alertShown = false;
        sendResponse({ success: true });
    }

    if (request.action === 'unblockSite') {
        const { domain, duration } = request;
        chrome.storage.local.get(['tempUnblocked'], (r) => {
            const t = r.tempUnblocked || {};
            t[domain] = Date.now() + duration * 60 * 1000;
            chrome.storage.local.set({ tempUnblocked: t });
        });
        sendResponse({ success: true });
    }
});

// ── Startup ───────────────────────────────────────────────────────────────────

function initTracking() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return;
        activeTabId = tabs[0].id;
        const url = tabs[0].url || '';
        if (!url.startsWith('chrome://') && !url.startsWith('about:') && !url.startsWith('chrome-extension://')) {
            startTracking();
        }
    });
}

chrome.runtime.onInstalled.addListener(() => {
    initTracking();
    chrome.storage.sync.get(['resetHour'], (r) => {
        if (chrome.runtime.lastError) return;
        chrome.alarms.create('dailyReset', {
            when: getNextResetTime(r.resetHour || 0),
            periodInMinutes: 24 * 60
        });
    });
});

chrome.runtime.onStartup.addListener(initTracking);

// ── Daily Reset ───────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== 'dailyReset') return;

    chrome.storage.local.get(['totalTime', 'siteTimes'], (r) => {
        const today = new Date().toISOString().split('T')[0];
        chrome.storage.local.get(['dailyHistory'], (hr) => {
            let history = hr.dailyHistory || [];
            if (!history.length || history[history.length - 1].date !== today) {
                history.push({ date: today, totalTime: r.totalTime || 0, siteTimes: r.siteTimes || {} });
            }
            if (history.length > 90) history = history.slice(-90);
            chrome.storage.local.set({
                dailyHistory: history,
                totalTime: 0,
                trackingStart: null,
                lastReset: Date.now(),
                siteTimes: {},
                tempUnblocked: {}
            });
            // Restart tracking after reset
            initTracking();
        });
    });

    chrome.notifications.create('dailyReset', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('images/icon.svg'),
        title: '✅ איפוס יומי',
        message: 'הנתונים אופסו. התחל יום חדש!'
    });
});

// ── Tab Events ────────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener((activeInfo) => {
    // Save time for old tab's domain before switching
    saveDomainTime(() => {
        activeTabId = activeInfo.tabId;
        chrome.tabs.get(activeTabId, (tab) => {
            if (chrome.runtime.lastError || !tab) return;
            const url = tab.url || '';
            if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
                pauseTracking();
            } else {
                // Reset trackingStart for new tab
                chrome.storage.local.set({ trackingStart: Date.now() });
            }
        });
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Inject content script fallback
    if (changeInfo.status === 'complete' && tab.url &&
        !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') &&
        !tab.url.startsWith('chrome-extension://')) {
        chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => {});
    }
});

// ── Window Focus / Minimize ───────────────────────────────────────────────────

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        pauseTracking();
    } else {
        chrome.windows.get(windowId, {}, (win) => {
            if (chrome.runtime.lastError || !win || win.state === 'minimized') return;
            startTracking();
        });
    }
});

chrome.windows.onBoundsChanged.addListener((win) => {
    if (win.state === 'minimized') {
        pauseTracking();
    } else if (win.state === 'normal' || win.state === 'maximized') {
        chrome.windows.getLastFocused({}, (fw) => {
            if (chrome.runtime.lastError || !fw || fw.state === 'minimized') return;
            if (fw.id === win.id) startTracking();
        });
    }
});

// ── Block Sites ───────────────────────────────────────────────────────────────

chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;
    const url = details.url;
    if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) return;
    let hostname;
    try { hostname = new URL(url).hostname; } catch (e) { return; }

    chrome.storage.sync.get(['blockedSitesAdvanced'], (r) => {
        if (chrome.runtime.lastError) return;
        const site = (r.blockedSitesAdvanced || []).find(s => s.domain === hostname);
        if (!site) return;
        chrome.storage.local.get(['tempUnblocked'], (lr) => {
            if (Date.now() < ((lr.tempUnblocked || {})[hostname] || 0)) return;
            if (isBlockedNow(site)) redirectToBlockPage(details.tabId, hostname, site);
        });
    });
});

function redirectToBlockPage(tabId, domain, site) {
    const params = new URLSearchParams({
        domain,
        message: site.message || 'בחרת לחסום את האתר הזה',
        unblockDuration: site.enableUnblockTime ? site.unblockDuration : 0
    });
    chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') + '?' + params }).catch(() => {});
}

// ── Save domain time (called before tab switch) ───────────────────────────────

function saveDomainTime(callback) {
    chrome.storage.local.get(['trackingStart', 'totalTime', 'siteTimes'], (r) => {
        if (!r.trackingStart || !activeTabId) { if (callback) callback(); return; }

        const elapsed = Date.now() - r.trackingStart;
        chrome.tabs.get(activeTabId, (tab) => {
            if (chrome.runtime.lastError || !tab || !tab.url) { if (callback) callback(); return; }
            let hostname;
            try { hostname = new URL(tab.url).hostname; } catch (e) { if (callback) callback(); return; }

            const siteTimes = r.siteTimes || {};
            siteTimes[hostname] = (siteTimes[hostname] || 0) + elapsed;
            const totalTime = (r.totalTime || 0) + elapsed;

            chrome.storage.local.set({ totalTime, siteTimes, trackingStart: null }, () => {
                checkLimitExceeded(totalTime);
                if (callback) callback();
            });
        });
    });
}

// ── Alert ─────────────────────────────────────────────────────────────────────

function showLimitExceededAlert() {
    if (alertShown) return;
    alertShown = true;

    chrome.storage.sync.get(['enableNotifications'], (r) => {
        if (r.enableNotifications === false) return;
        chrome.windows.create({
            url: chrome.runtime.getURL('alert-window.html'),
            type: 'popup', width: 550, height: 600, focused: true
        }, () => {
            if (chrome.runtime.lastError) {
                chrome.notifications.create('limitExceeded', {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('images/icon.svg'),
                    title: '⏰ הגעת להגבלה היומית',
                    message: 'חרגת מהגבלת השימוש היומית שלך.'
                });
            }
        });
    });

    setTimeout(() => { alertShown = false; }, 30 * 60 * 1000);
}

// ── Settings Changes ──────────────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.resetHour) {
        chrome.alarms.create('dailyReset', {
            when: getNextResetTime(changes.resetHour.newValue || 0),
            periodInMinutes: 24 * 60
        });
    }
    if (namespace === 'sync' && changes.limitHours) {
        const h = changes.limitHours.newValue || 2;
        const m = changes.limitMinutes?.newValue || 0;
        chrome.storage.local.set({ dailyLimit: (h * 60 + m) * 60 * 1000 });
    }
});

console.log('[Time Tracker] Background started at', new Date().toISOString());
