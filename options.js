document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupBlockedSitesUI();
    setupSiteLimitsUI();
    setupIgnoredSitesUI();
    setupModal();

    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    document.getElementById('addBlockedBtn').addEventListener('click', addNewBlockedSite);
    document.getElementById('addSiteLimitBtn').addEventListener('click', addSiteLimit);
    document.getElementById('addIgnoredBtn').addEventListener('click', addIgnoredSite);
});

let currentEditingDomain = null;

function loadSettings() {
    chrome.storage.sync.get(['limitHours', 'limitMinutes', 'resetHour', 'enableNotifications', 'enableWarning', 'showOverlay', 'showSiteTime'], (result) => {
        const hours = String(result.limitHours ?? 2).padStart(2, '0');
        const minutes = String(result.limitMinutes ?? 0).padStart(2, '0');
        document.getElementById('limitTime').value = `${hours}:${minutes}`;

        const resetHour = String(result.resetHour || 0).padStart(2, '0');
        document.getElementById('resetTime').value = `${resetHour}:00`;

        document.getElementById('enableNotifications').checked = result.enableNotifications !== false;
        document.getElementById('enableWarning').checked = result.enableWarning !== false;
        document.getElementById('showOverlay').checked = result.showOverlay !== false;
        document.getElementById('showSiteTime').checked = result.showSiteTime !== false;
    });
}

function setupSiteLimitsUI() {
    chrome.storage.sync.get(['siteLimits'], (r) => renderSiteLimits(r.siteLimits || {}));
}

function renderSiteLimits(siteLimits) {
    const container = document.getElementById('siteLimitsList');
    const entries = Object.entries(siteLimits);
    container.innerHTML = '';
    if (!entries.length) {
        const p = document.createElement('p');
        p.style.cssText = 'text-align:center;color:#999;';
        p.textContent = 'אין הגבלות לפי אתר';
        container.appendChild(p);
        return;
    }
    entries.forEach(([domain, ms]) => {
        const h = String(Math.floor(ms / 3600000)).padStart(2,'0');
        const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2,'0');
        const item = document.createElement('div');
        item.className = 'blocked-site-item';
        const label = document.createElement('div');
        label.className = 'blocked-site-domain';
        label.textContent = `${domain} — ${h}:${m}`;
        const btn = document.createElement('button');
        btn.className = 'btn-action btn-delete';
        btn.textContent = '🗑️ מחק';
        btn.dataset.domain = domain;
        btn.addEventListener('click', () => deleteSiteLimit(domain));
        item.appendChild(label);
        item.appendChild(btn);
        container.appendChild(item);
    });
}

function addSiteLimit() {
    const domain = document.getElementById('newLimitDomain').value.trim().toLowerCase();
    const [h, m] = document.getElementById('newLimitTime').value.split(':').map(Number);
    if (!domain || !isValidDomain(domain)) { showStatus('❌ שם אתר לא תקף'); return; }
    const ms = (h * 60 + m) * 60 * 1000;
    if (!ms) { showStatus('❌ הזמן חייב להיות גדול מ-0'); return; }
    chrome.storage.sync.get(['siteLimits'], (r) => {
        const siteLimits = r.siteLimits || {};
        siteLimits[domain] = ms;
        chrome.storage.sync.set({ siteLimits });
        document.getElementById('newLimitDomain').value = '';
        renderSiteLimits(siteLimits);
        showStatus('✅ הגבלה נוספה');
    });
}

function deleteSiteLimit(domain) {
    chrome.storage.sync.get(['siteLimits'], (r) => {
        const siteLimits = r.siteLimits || {};
        const updated = Object.fromEntries(Object.entries(siteLimits).filter(([k]) => k !== domain));
        chrome.storage.sync.set({ siteLimits: updated });
        renderSiteLimits(updated);
        showStatus('✅ הגבלה נמחקה');
    });
}

function setupIgnoredSitesUI() {
    chrome.storage.sync.get(['ignoredSites'], (r) => renderIgnoredSites(r.ignoredSites || []));
}

function renderIgnoredSites(sites) {
    const container = document.getElementById('ignoredSitesList');
    container.innerHTML = '';
    if (!sites.length) {
        const p = document.createElement('p');
        p.style.cssText = 'text-align:center;color:#999;';
        p.textContent = 'אין אתרים לא נספרים';
        container.appendChild(p);
        return;
    }
    sites.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'blocked-site-item';
        const label = document.createElement('div');
        label.className = 'blocked-site-domain';
        label.textContent = domain;
        const btn = document.createElement('button');
        btn.className = 'btn-action btn-delete';
        btn.textContent = '🗑️ מחק';
        btn.addEventListener('click', () => deleteIgnoredSite(domain));
        item.appendChild(label);
        item.appendChild(btn);
        container.appendChild(item);
    });
}

function addIgnoredSite() {
    const domain = document.getElementById('newIgnoredDomain').value.trim().toLowerCase();
    if (!domain || !isValidDomain(domain)) { showStatus('❌ שם אתר לא תקף'); return; }
    chrome.storage.sync.get(['ignoredSites'], (r) => {
        const sites = r.ignoredSites || [];
        if (sites.includes(domain)) { showStatus('❌ האתר כבר קיים ברשימה'); return; }
        sites.push(domain);
        chrome.storage.sync.set({ ignoredSites: sites });
        document.getElementById('newIgnoredDomain').value = '';
        renderIgnoredSites(sites);
        showStatus('✅ אתר נוסף');
    });
}

function deleteIgnoredSite(domain) {
    chrome.storage.sync.get(['ignoredSites'], (r) => {
        const sites = (r.ignoredSites || []).filter(d => d !== domain);
        chrome.storage.sync.set({ ignoredSites: sites });
        renderIgnoredSites(sites);
        showStatus('✅ אתר הוסר');
    });
}

function setupBlockedSitesUI() {
    chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
        renderBlockedSites(result.blockedSitesAdvanced || []);
    });
}

function renderBlockedSites(blockedSites) {
    const container = document.getElementById('blockedSitesList');
    container.innerHTML = '';

    if (blockedSites.length === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'text-align:center;color:#999;';
        p.textContent = 'אין אתרים חסומים כרגע';
        container.appendChild(p);
        return;
    }

    blockedSites.forEach(site => {
        const item = document.createElement('div');
        item.className = 'blocked-site-item';

        const info = document.createElement('div');
        const domainEl = document.createElement('div');
        domainEl.className = 'blocked-site-domain';
        domainEl.textContent = site.domain;
        const infoEl = document.createElement('div');
        infoEl.className = 'blocked-site-info';
        if (site.enableUnblockTime) infoEl.textContent += `• unblock: ${site.unblockDuration} דק `;
        if (site.enableConditionalBlock) infoEl.textContent += `• חסימה: ${site.blockStartTime}-${site.blockEndTime}`;
        info.appendChild(domainEl);
        info.appendChild(infoEl);

        const actions = document.createElement('div');
        actions.className = 'blocked-site-actions';
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action btn-edit';
        editBtn.textContent = '⚙️ ערוך';
        editBtn.addEventListener('click', () => editBlockedSite(site.domain));
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action btn-delete';
        deleteBtn.textContent = '🗑️ מחק';
        deleteBtn.addEventListener('click', () => deleteBlockedSite(site.domain));
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);
        container.appendChild(item);
    });
}

function addNewBlockedSite() {
    const domain = document.getElementById('newBlockedDomain').value.trim().toLowerCase();

    if (!domain) { showStatus('❌ אנא הזן שם אתר'); return; }
    if (!isValidDomain(domain)) { showStatus('❌ שם אתר לא תקף (עד: example.com)'); return; }

    chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
        const blockedSites = result.blockedSitesAdvanced || [];

        if (blockedSites.some(s => s.domain === domain)) {
            showStatus('❌ האתר כבר קיים ברשימה');
            return;
        }

        blockedSites.push({
            domain,
            message: 'בחרת לחסום את האתר הזה',
            enableUnblockTime: false,
            unblockDuration: 5,
            enableConditionalBlock: false,
            blockStartTime: '09:00',
            blockEndTime: '17:00'
        });

        chrome.storage.sync.set({ blockedSitesAdvanced: blockedSites });
        document.getElementById('newBlockedDomain').value = '';
        renderBlockedSites(blockedSites);
        showStatus('✅ אתר נוסף בהצלחה');
    });
}

function editBlockedSite(domain) {
    chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
        const site = (result.blockedSitesAdvanced || []).find(s => s.domain === domain);
        if (!site) return;

        currentEditingDomain = domain;
        document.getElementById('blockMessage').value = site.message || '';
        document.getElementById('enableUnblockTime').checked = site.enableUnblockTime || false;
        document.getElementById('unblockDuration').value = site.unblockDuration || 5;
        document.getElementById('enableConditionalBlock').checked = site.enableConditionalBlock || false;
        document.getElementById('blockStartTime').value = site.blockStartTime || '09:00';
        document.getElementById('blockEndTime').value = site.blockEndTime || '17:00';

        toggleUnblockTimeGroup();
        toggleConditionalGroup();
        document.getElementById('blockModal').style.display = 'block';
    });
}

function deleteBlockedSite(domain) {
    showConfirm(`האם אתה בטוח שברצונך למחוק את ${domain}?`, () => {
        chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
            const filtered = (result.blockedSitesAdvanced || []).filter(s => s.domain !== domain);
            chrome.storage.sync.set({ blockedSitesAdvanced: filtered });
            renderBlockedSites(filtered);
            showStatus('✅ אתר נמחק בהצלחה');
        });
    });
}

function setupModal() {
    const modal = document.getElementById('blockModal');

    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelBlockBtn').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    document.getElementById('enableUnblockTime').addEventListener('change', toggleUnblockTimeGroup);
    document.getElementById('enableConditionalBlock').addEventListener('change', toggleConditionalGroup);
    document.getElementById('saveBlockSettingsBtn').addEventListener('click', saveBlockSettings);
}

function closeModal() {
    document.getElementById('blockModal').style.display = 'none';
    currentEditingDomain = null;
}

function toggleUnblockTimeGroup() {
    document.getElementById('unblockTimeGroup').style.display =
        document.getElementById('enableUnblockTime').checked ? 'block' : 'none';
}

function toggleConditionalGroup() {
    document.getElementById('conditionalGroup').style.display =
        document.getElementById('enableConditionalBlock').checked ? 'block' : 'none';
}

function saveBlockSettings() {
    if (!currentEditingDomain) return;

    const enableConditionalBlock = document.getElementById('enableConditionalBlock').checked;
    const blockStartTime = document.getElementById('blockStartTime').value;
    const blockEndTime = document.getElementById('blockEndTime').value;

    if (enableConditionalBlock && blockStartTime >= blockEndTime) {
        showStatus('❌ שעת ההתחלה חייבת להיות לפני שעת הסיום');
        return;
    }

    chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
        const blockedSites = result.blockedSitesAdvanced || [];
        const idx = blockedSites.findIndex(s => s.domain === currentEditingDomain);

        if (idx >= 0) {
            blockedSites[idx] = {
                domain: currentEditingDomain,
                message: document.getElementById('blockMessage').value || 'בחרת לחסום את האתר הזה',
                enableUnblockTime: document.getElementById('enableUnblockTime').checked,
                unblockDuration: parseInt(document.getElementById('unblockDuration').value) || 5,
                enableConditionalBlock,
                blockStartTime,
                blockEndTime
            };

            chrome.storage.sync.set({ blockedSitesAdvanced: blockedSites });
            renderBlockedSites(blockedSites);
            closeModal();
            showStatus('✅ הגדרות עודכנו בהצלחה');
        }
    });
}

function saveSettings() {
    try {
        const [limitHours, limitMinutes] = document.getElementById('limitTime').value.split(':').map(Number);

        if (isNaN(limitHours) || isNaN(limitMinutes) || limitHours < 0 || limitMinutes < 0 || limitMinutes >= 60 || limitHours > 24) {
            showStatus('❌ שגיאה: הזמן חייב להיות בין 00:00 ל-24:00');
            return;
        }

        const resetHour = parseInt(document.getElementById('resetTime').value.split(':')[0]) || 0;
        if (isNaN(resetHour) || resetHour < 0 || resetHour > 23) {
            showStatus('❌ שגיאה: שעת האיפוס חייבת להיות בין 00:00 ל-23:00');
            return;
        }

        chrome.storage.sync.set({
            limitHours,
            limitMinutes,
            resetHour,
            enableNotifications: document.getElementById('enableNotifications').checked,
            enableWarning: document.getElementById('enableWarning').checked,
            showOverlay: document.getElementById('showOverlay').checked,
            showSiteTime: document.getElementById('showSiteTime').checked
        });

        chrome.storage.local.set({ dailyLimit: (limitHours * 60 + limitMinutes) * 60 * 1000 });

        chrome.alarms.create('dailyReset', {
            when: getNextResetTime(resetHour),
            periodInMinutes: 24 * 60
        });

        showStatus('✅ ההגדרות נשמרו בהצלחה!');
    } catch (e) {
        showStatus('❌ שגיאה בשמירת הגדרות: ' + e.message);
    }
}

function resetSettings() {
    showConfirm('האם אתה בטוח שאתה רוצה לחזור לברירות המחדל?\nהיסטוריה ואתרים חסומים לא יימחקו.', () => {
        chrome.storage.sync.set({
            limitHours: 2, limitMinutes: 0, resetHour: 0,
            enableNotifications: true, enableWarning: true,
            showOverlay: true, showSiteTime: true
        });
        chrome.storage.local.set({ dailyLimit: 2 * 60 * 60 * 1000 });
        loadSettings();
        showStatus('חזרנו לברירות המחדל');
    });
}

function isValidDomain(domain) {
    return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]{2,}$|^localhost$/.test(domain);
}

function getNextResetTime(hour) {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime();
}

function showConfirm(message, onConfirm) {
    const dialog = document.createElement('dialog');
    const msg = document.createElement('p');
    msg.textContent = message;
    const yes = document.createElement('button');
    yes.textContent = 'אשר';
    yes.addEventListener('click', () => { dialog.close(); dialog.remove(); onConfirm(); });
    const no = document.createElement('button');
    no.textContent = 'ביטול';
    no.addEventListener('click', () => { dialog.close(); dialog.remove(); });
    dialog.appendChild(msg);
    dialog.appendChild(yes);
    dialog.appendChild(no);
    document.body.appendChild(dialog);
    dialog.showModal();
}

function showStatus(message = 'ההגדרות נשמרו בהצלחה!') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
}
