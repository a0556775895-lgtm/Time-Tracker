document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupBlockedSitesUI();
    setupModal();

    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    document.getElementById('addBlockedBtn').addEventListener('click', addNewBlockedSite);
});

let currentEditingDomain = null;

function loadSettings() {
    chrome.storage.sync.get(['limitHours', 'limitMinutes', 'resetHour', 'enableNotifications', 'enableWarning', 'showOverlay'], (result) => {
        const hours = String(result.limitHours || 2).padStart(2, '0');
        const minutes = String(result.limitMinutes || 0).padStart(2, '0');
        document.getElementById('limitTime').value = `${hours}:${minutes}`;

        const resetHour = String(result.resetHour || 0).padStart(2, '0');
        document.getElementById('resetTime').value = `${resetHour}:00`;

        document.getElementById('enableNotifications').checked = result.enableNotifications !== false;
        document.getElementById('enableWarning').checked = result.enableWarning !== false;
        document.getElementById('showOverlay').checked = result.showOverlay !== false;
    });
}

function setupBlockedSitesUI() {
    chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
        renderBlockedSites(result.blockedSitesAdvanced || []);
    });
}

function renderBlockedSites(blockedSites) {
    const container = document.getElementById('blockedSitesList');

    if (blockedSites.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">אין אתרים חסומים כרגע</p>';
        return;
    }

    container.innerHTML = blockedSites.map(site => `
        <div class="blocked-site-item">
            <div>
                <div class="blocked-site-domain">${site.domain}</div>
                <div class="blocked-site-info">
                    ${site.enableUnblockTime ? `• unblock: ${site.unblockDuration} דק` : ''}
                    ${site.enableConditionalBlock ? `• חסימה: ${site.blockStartTime}-${site.blockEndTime}` : ''}
                </div>
            </div>
            <div class="blocked-site-actions">
                <button class="btn-action btn-edit" data-domain="${site.domain}">⚙️ ערוך</button>
                <button class="btn-action btn-delete" data-domain="${site.domain}">🗑️ מחק</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.btn-edit').forEach(btn =>
        btn.addEventListener('click', () => editBlockedSite(btn.dataset.domain))
    );
    container.querySelectorAll('.btn-delete').forEach(btn =>
        btn.addEventListener('click', () => deleteBlockedSite(btn.dataset.domain))
    );
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
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${domain}?`)) return;

    chrome.storage.sync.get(['blockedSitesAdvanced'], (result) => {
        const filtered = (result.blockedSitesAdvanced || []).filter(s => s.domain !== domain);
        chrome.storage.sync.set({ blockedSitesAdvanced: filtered });
        renderBlockedSites(filtered);
        showStatus('✅ אתר נמחק בהצלחה');
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
            showOverlay: document.getElementById('showOverlay').checked
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
    if (!confirm('האם אתה בטוח שאתה רוצה לחזור לברירות המחדל?\nהיסטוריה ואתרים חסומים לא יימחקו.')) return;

    // Only reset user preferences — preserve history and blocked sites
    chrome.storage.sync.set({
        limitHours: 2,
        limitMinutes: 0,
        resetHour: 0,
        enableNotifications: true,
        enableWarning: true,
        showOverlay: true
    });
    chrome.storage.local.set({ dailyLimit: 2 * 60 * 60 * 1000 });
    loadSettings();
    showStatus('חזרנו לברירות המחדל');
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

function showStatus(message = 'ההגדרות נשמרו בהצלחה!') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
}
