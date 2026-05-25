let activeTabId = null;
let activeTabStartTime = 0;
let alertDismissedUntil = 0;
let alertShown = false;
let browserFocused = true;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getNextResetTime(hour) {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime();
}

function getEndOfDay() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
}

function isBlockedNow(site) {
    if (!site.enableConditionalBlock) return true; // always blocked

    const now = new Date();
    const [startH, startM] = site.blockStartTime.split(':').map(Number);
    const [endH, endM] = site.blockEndTime.split(':').map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    return nowMins >= startMins && nowMins < endMins;
}

// ── Messages ──────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTime') {
        chrome.storage.local.get(['totalTime'], (result) => {
            if (chrome.runtime.lastError) { sendResponse({ totalTime: 0 }); return; }
            let totalTime = result.totalTime || 0;
            if (browserFocused && activeTabStartTime > 0) {
                totalTime += Date.now() - activeTabStartTime;
            }
            try { sendResponse({ totalTime }); } catch (e) {}
        });
        return true;
    }

    if (request.action === 'getUsageInfo') {
        chrome.storage.local.get(['totalTime'], (result) => {
            try { sendResponse({ totalTime: result.totalTime || 0 }); } catch (e) {}
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
        // Temporarily unblock a site for its configured duration
        const { domain, duration } = request;
        chrome.storage.local.get(['tempUnblocked'], (result) => {
            const tempUnblocked = result.tempUnblocked || {};
            tempUnblocked[domain] = Date.now() + (duration * 60 * 1000);
            chrome.storage.local.set({ tempUnblocked });
        });
        sendResponse({ success: true });
    }
});

// ── Startup ───────────────────────────────────────────────────────────────────

function initActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
            activeTabId = tabs[0].id;
            activeTabStartTime = Date.now();
        }
    });
}

chrome.runtime.onInstalled.addListener(() => {
    initActiveTab();
    chrome.storage.sync.get(['resetHour'], (result) => {
        if (chrome.runtime.lastError) return;
        const resetHour = result.resetHour || 0;
        chrome.alarms.create('dailyReset', {
            when: getNextResetTime(resetHour),
            periodInMinutes: 24 * 60
        });
    });
});

chrome.runtime.onStartup.addListener(initActiveTab);

// ── Daily Reset Alarm ─────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== 'dailyReset') return;

    chrome.storage.local.get(['totalTime', 'siteTimes'], (result) => {
        const today = new Date().toISOString().split('T')[0];
        const dailyData = {
            date: today,
            totalTime: result.totalTime || 0,
            siteTimes: result.siteTimes || {}
        };

        // Save to history in local (not sync — avoids 100KB limit)
        chrome.storage.local.get(['dailyHistory'], (localResult) => {
            let history = localResult.dailyHistory || [];
            if (history.length === 0 || history[history.length - 1].date !== today) {
                history.push(dailyData);
            }
            if (history.length > 90) history = history.slice(-90);
            chrome.storage.local.set({
                dailyHistory: history,
                totalTime: 0,
                lastReset: Date.now(),
                siteTimes: {},
                tempUnblocked: {}
            });
        });
    });

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: '✅ איפוס יומי',
        message: 'הנתונים אופסו. התחל יום חדש!'
    });
});

// ── Tab / Window Events ───────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener((activeInfo) => {
    saveActiveTabTime();
    activeTabId = activeInfo.tabId;
    activeTabStartTime = browserFocused ? Date.now() : 0;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    // If the active tab navigated to a new URL, restart its timer
    if (tabId === activeTabId && changeInfo.status === 'complete') {
        saveActiveTabTime();
        activeTabStartTime = browserFocused ? Date.now() : 0;
    }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        browserFocused = false;
        saveActiveTabTime(); // save time before pausing
    } else {
        browserFocused = true;
        // Resume tracking — only restart if we have an active tab
        if (activeTabId !== null) {
            activeTabStartTime = Date.now();
        }
    }
});

// ── Core: Save Time ───────────────────────────────────────────────────────────

function saveActiveTabTime() {
    if (activeTabId === null || activeTabStartTime === 0) return;

    const now = Date.now();
    const timeSpent = now - activeTabStartTime;
    activeTabStartTime = 0;

    if (timeSpent <= 0) return;

    chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError || !tab || !tab.url) return;
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) return;

        let url;
        try { url = new URL(tab.url); } catch (e) { return; }
        const domain = url.hostname;

        chrome.storage.sync.get(['blockedSitesAdvanced'], (syncResult) => {
            if (chrome.runtime.lastError) return;
            const blockedSites = syncResult.blockedSitesAdvanced || [];
            const blockedSite = blockedSites.find(s => s.domain === domain);

            if (blockedSite) {
                // Check temporary unblock
                chrome.storage.local.get(['tempUnblocked'], (localResult) => {
                    const tempUnblocked = localResult.tempUnblocked || {};
                    const unblockUntil = tempUnblocked[domain] || 0;
                    if (Date.now() < unblockUntil) {
                        // Temporarily unblocked — count the time
                        saveTimeForDomain(domain, now, timeSpent);
                    } else if (isBlockedNow(blockedSite)) {
                        // Blocked — don't count time, redirect tab
                        redirectToBlockPage(tab.id, domain, blockedSite);
                    } else {
                        // Outside conditional block hours — count normally
                        saveTimeForDomain(domain, now, timeSpent);
                    }
                });
            } else {
                saveTimeForDomain(domain, now, timeSpent);
            }
        });
    });
}

function redirectToBlockPage(tabId, domain, site) {
    const params = new URLSearchParams({
        domain,
        message: site.message || 'בחרת לחסום את האתר הזה',
        unblockDuration: site.enableUnblockTime ? site.unblockDuration : 0
    });
    const blockUrl = chrome.runtime.getURL('blocked.html') + '?' + params.toString();
    chrome.tabs.update(tabId, { url: blockUrl }).catch(() => {});
}

function saveTimeForDomain(domain, now, timeSpent) {
    chrome.storage.local.get(['totalTime', 'siteTimes', 'lastReset', 'dailyLimit'], (result) => {
        if (chrome.runtime.lastError) return;

        const dailyLimit = result.dailyLimit || 2 * 60 * 60 * 1000;

        // Auto-reset if day changed
        const lastReset = result.lastReset || now;
        const lastResetDate = new Date(lastReset);
        lastResetDate.setHours(0, 0, 0, 0);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        if (lastResetDate.getTime() !== todayDate.getTime()) {
            chrome.storage.local.set({
                totalTime: timeSpent,
                siteTimes: { [domain]: timeSpent },
                lastReset: now
            });
            return;
        }

        const totalTime = (result.totalTime || 0) + timeSpent;
        const siteTimes = result.siteTimes || {};
        siteTimes[domain] = (siteTimes[domain] || 0) + timeSpent;

        if (totalTime > dailyLimit && now > alertDismissedUntil && !alertShown) {
            showLimitExceededAlert();
        }

        chrome.storage.local.set({ totalTime, siteTimes });
    });
}

// ── Alert Window ──────────────────────────────────────────────────────────────

function showLimitExceededAlert() {
    if (alertShown) return;
    alertShown = true;

    chrome.storage.sync.get(['enableNotifications'], (result) => {
        if (result.enableNotifications === false) return;

        // Open alert as a popup window directly (offscreen is not needed for this)
        const alertPath = chrome.runtime.getURL('alert-window.html');
        chrome.windows.create({
            url: alertPath,
            type: 'popup',
            width: 550,
            height: 600,
            focused: true
        }, (win) => {
            if (chrome.runtime.lastError) {
                // Fallback to notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon48.png',
                    title: '⏰ הגעת להגבלה היומית',
                    message: 'חרגת מהגבלת השימוש היומית שלך.'
                });
            }
        });
    });

    // Allow showing again after 30 minutes
    setTimeout(() => { alertShown = false; }, 30 * 60 * 1000);
}

// ── Settings Changes ──────────────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.resetHour) {
        const resetHour = changes.resetHour.newValue || 0;
        chrome.alarms.create('dailyReset', {
            when: getNextResetTime(resetHour),
            periodInMinutes: 24 * 60
        });
    }
    if (namespace === 'sync' && changes.limitHours) {
        const hours = changes.limitHours.newValue || 2;
        const minutes = changes.limitMinutes?.newValue || 0;
        chrome.storage.local.set({ dailyLimit: (hours * 60 + minutes) * 60 * 1000 });
    }
});

console.log('[Time Tracker] Background service worker started at', new Date().toISOString());
