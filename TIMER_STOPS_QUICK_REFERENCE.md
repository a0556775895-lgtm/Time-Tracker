# ⏹️ Timer Pause Conditions - Quick Reference

## When Timer STOPS Counting ❌

### PRIMARY STOPS (Main Reasons)

#### 1. **Browser Loses Focus** 🪟
- **Trigger:** User switches to another application (Alt+Tab, clicking another window)
- **Code Location:** `background.js` - `chrome.windows.onFocusChanged`
- **Status:** ⏹️ PAUSED (resumes when browser window refocused)
- **Example:** Browser open → click on Slack → timer stops

#### 2. **Tab Switch** 🔄
- **Trigger:** User clicks on a different tab/window
- **Code Location:** `background.js` - `chrome.tabs.onActivated`
- **Status:** ⏹️ Previous tab saved, new tab starts counting
- **Example:** Google tab → click YouTube tab → Google time saved

#### 3. **System URLs (Skipped)** 🔐
- **Trigger:** Navigation to Chrome system pages
- **URLs:** `chrome://`, `about:`, `edge://`, etc.
- **Code Location:** `background.js` - `saveActiveTabTime()`
- **Status:** ⏹️ NOT COUNTED (time not added)
- **Examples:** 
  - `chrome://extensions`
  - `about:blank`
  - `about:newtab`

#### 4. **Blocked Sites** 🚫
- **Trigger:** Site is in blocked list (manually configured)
- **Code Location:** `background.js` - `saveTimeForDomain()`
- **Status:** ⏹️ NOT COUNTED + notification shown
- **Configuration:** Can be set in Options → Advanced Blocking
- **Types:** 
  - Permanent block
  - Conditional block (specific hours)
  - Temporary unlock (5-120 min)

---

### SECONDARY STOPS (Minor Reasons)

#### 5. **Tab Closed** ❌
- **Trigger:** Tab is closed/deleted
- **Status:** ⏹️ Previous time already saved
- **Note:** Site still appears in statistics

#### 6. **Extension Context Invalid** 🔌
- **Trigger:** Extension uninstalled, updated, or disabled
- **Code Location:** `content.js` - `isExtensionContextValid()`
- **Status:** ⏹️ STOPPED (requires page refresh)
- **Recovery:** Reload page or reinstall extension

#### 7. **Error Loading Tab** ⚠️
- **Trigger:** Tab URL is invalid/inaccessible
- **Status:** ⏹️ ERROR logged, time not counted
- **Example:** Corrupted URL, tab crashed

---

## What DOESN'T Stop the Timer ✅

| Condition | Timer Status |
|-----------|--------------|
| 💤 Sleep mode | ✅ CONTINUES (if browser open) |
| 🔇 Mute/Silent mode | ✅ CONTINUES |
| 🔋 Power saver mode | ✅ CONTINUES |
| 🔒 Screen locked | ✅ CONTINUES (in background) |
| 📱 Phone call/notification | ✅ CONTINUES |
| 🌐 Network disconnected | ✅ CONTINUES (local page) |

---

## Timer Behavior Summary

### During Normal Browsing
```
User browsing Google (0:05:32 on Google)
     ↓
User switches to YouTube
     ↓
Google time SAVED → YouTube time starts (0:00:00)
     ↓
Total time increases
```

### When Browser Loses Focus
```
User browsing Facebook (0:10:15 on Facebook)
     ↓
User switches to Slack (another app)
     ↓
Facebook time SAVED → Timer STOPS
     ↓
User switches back to Browser
     ↓
Facebook tab reactivates → Timer RESUMES from focus
```

### When Visiting Blocked Site
```
User tries facebook.com (if blocked)
     ↓
Blocked check: YES
     ↓
Time NOT COUNTED
     ↓
Notification: "🚫 Site Blocked"
     ↓
Daily time remains the same
```

---

## Storage & Reset

- **Daily Reset:** Automatic at configured time (default: 00:00)
- **Storage Type:** 
  - `chrome.storage.local` = Today's data only
  - `chrome.storage.sync` = Settings & History (90 days)
- **Reset Trigger:** Daily alarm at specified hour

---

## Configuration Options in Settings

| Option | Default | Stops Timer? |
|--------|---------|--------------|
| Daily Limit | 2 hours | No (triggers alert) |
| Reset Hour | 00:00 | No (data reset only) |
| Notifications | ON | No (alert only) |
| Warning at 80% | ON | No (warning only) |
| Overlay Widget | ON | No (display only) |
| Blocked Sites | None | **YES ✅** |
| Conditional Block | OFF | **YES ✅** |

---

## Visual Timer State Diagram

```
[RUNNING] ─── Browser loses focus ───→ [PAUSED]
   ↑                                      │
   │                                      │
   └──────── Browser gains focus ────────┘

[RUNNING] ─── Tab switches ───→ [SAVE TIME] ─→ [NEW TAB STARTS]

[RUNNING] ─── Blocked site ───→ [SKIP] (no count)

[RUNNING] ─── System URL ───→ [SKIP] (no count)

[RUNNING] ─── End of day ───→ [RESET] ─→ [START NEW DAY]
```

---

**Last Updated:** April 29, 2026  
**Status:** ✅ All features verified and functional
