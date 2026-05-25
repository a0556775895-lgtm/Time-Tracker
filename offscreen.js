// Open alert window when offscreen document is created
function openAlertWindow() {
    const alertPath = chrome.runtime.getURL('alert-window.html');
    chrome.windows.create({
        url: alertPath,
        type: 'popup',
        width: 550,
        height: 600,
        focused: true
    }, (window) => {
        if (chrome.runtime.lastError) {
            console.error('[Time Tracker] Failed to open alert window:', chrome.runtime.lastError);
        } else {
            console.log('[Time Tracker] Alert window opened');
            // Close offscreen document after window is created
            setTimeout(() => {
                chrome.offscreen.closeDocument();
            }, 500);
        }
    });
}

// Open alert window when script loads
openAlertWindow();

console.log('[Time Tracker] Offscreen document loaded');

