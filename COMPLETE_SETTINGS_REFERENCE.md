# 🎯 Timer Settings Breakdown - Complete Configuration Guide

## Current Active Settings Summary (April 29, 2026)

```
╔═══════════════════════════════════════════════════════════════╗
║           TIME TRACKER EXTENSION - ACTIVE CONFIG              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ⏱️  DAILY LIMIT              : 2 Hours 0 Minutes            ║
║  🔄 RESET TIME               : 00:00 (Midnight)             ║
║  🔔 NOTIFICATIONS             : ✅ ENABLED                   ║
║  ⚠️  WARNING AT 80%           : ✅ ENABLED                   ║
║  🎨 OVERLAY WIDGET           : ✅ ENABLED                   ║
║  🌐 BROWSER FOCUS REQUIRED   : ✅ YES                        ║
║  📊 SITE TRACKING            : ✅ PER-DOMAIN                 ║
║  🚫 BLOCKED SITES            : ⚙️  CONFIGURABLE              ║
║  💾 DATA STORAGE             : ✅ LOCAL + SYNC               ║
║  📈 HISTORY RETENTION        : ✅ 90 DAYS                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Settings Categories Explained

### 1️⃣ TIME LIMITS

| Setting | Value | Purpose | Type |
|---------|-------|---------|------|
| **Daily Usage Limit** | 2:00 (hours:mins) | Total time allowed per day | User Configurable |
| **Daily Reset Time** | 00:00 (24h format) | When counter resets to 0 | User Configurable |
| **History Retention** | 90 days | How long data is kept | Fixed |

**Example:**
- Set limit to 3:30 (3.5 hours)
- Set reset to 08:00 (8 AM)
- Each day at 8:00 AM, timer resets and previous day's data is archived

---

### 2️⃣ NOTIFICATION SETTINGS

| Setting | Status | Action |
|---------|--------|--------|
| **Enable Notifications** | ✅ ON | Show popup when limit reached |
| **80% Warning** | ✅ ON | Show warning bar at 80% usage |
| **Overlay Display** | ✅ ON | Show floating timer in corner |

**Behaviors:**
```
Usage: 0%        → ✅ Green indicator
Usage: 50%       → ✅ Green indicator
Usage: 80%       → ⚠️  Yellow warning + "Getting close!"
Usage: 100%      → 🔴 Red + Alert window
Usage: 120%      → 📢 Alert repeats (snooze or dismiss)
```

---

### 3️⃣ BLOCKED SITES SETTINGS

#### Basic Blocking
```
Domain: facebook.com
Status: 🚫 BLOCKED
Action: Not counted, notification shown
```

#### Advanced Blocking Options
```
1. PERMANENT BLOCK
   ├─ Always blocked
   ├─ No exceptions
   └─ Custom message: "Break time! Take a walk 🚶"

2. CONDITIONAL BLOCK (Time-based)
   ├─ Block period: 09:00 - 17:00
   ├─ Allowed outside: 17:00 - 09:00
   └─ Custom message: "Focus hours! Work time 💪"

3. TEMPORARY UNLOCK
   ├─ Can temporarily unblock for: 5-120 minutes
   ├─ After time expires: Auto-blocked again
   └─ Useful for: Emergency access
```

---

## 🛑 Complete Stop Conditions List

### ❌ TIER 1 - IMMEDIATE STOP (Most Common)

1. **Browser Focus Lost**
   - Action: Alt+Tab to another app
   - Result: ⏹️ Timer pauses instantly
   - Resume: Click browser → timer resumes

2. **Tab Changed**
   - Action: Click different browser tab
   - Result: ⏹️ Old tab time saved, new tab starts counting
   - Scope: Per-domain tracking (independent counts)

3. **System URL Visited**
   - Action: Navigate to `chrome://`, `about:`, etc.
   - Result: ⏹️ Time NOT counted
   - Examples: Extensions page, Settings, New Tab, Bookmarks

4. **Blocked Site Accessed**
   - Action: Visit configured blocked domain
   - Result: ⏹️ Time NOT counted + notification
   - Recovery: Can temporarily unlock (if configured)

---

### ⚡ TIER 2 - CONDITIONAL STOP

5. **Tab Closed**
   - Scope: Time already saved before close
   - Result: ⏹️ No additional time counted
   - Data: Remains in statistics

6. **Extension Context Lost**
   - Causes: Uninstall, update, disable
   - Result: ⏹️ Stops immediately
   - Recovery: Page refresh or restart browser

7. **Tab Error/Crash**
   - Causes: Invalid URL, resource error
   - Result: ⏹️ Logged as error, time discarded
   - Log: Visible in DevTools console

---

### ✅ NOT STOPPING (Continues Running)

| Event | Timer Status | Example |
|-------|--------------|---------|
| Screen sleep | ✅ CONTINUES | Screensaver active, browser still open |
| Device locked | ✅ CONTINUES | Lock screen showing, browser in background |
| Mute active | ✅ CONTINUES | Sound off, notifications silent |
| Idle for hours | ✅ CONTINUES | No user activity but tab remains active |
| Network offline | ✅ CONTINUES | WiFi off but page already loaded |
| Background app | ✅ CONTINUES | Browser minimized but not closed |

---

## 📊 Data Storage Architecture

```
EXTENSION STORAGE
│
├─ chrome.storage.LOCAL (temporary)
│  ├─ totalTime: 1234567 (milliseconds)
│  ├─ siteTimes: { "youtube.com": 890000, ... }
│  ├─ dailyLimit: 7200000 (ms = 2 hours)
│  └─ lastReset: timestamp
│
└─ chrome.storage.SYNC (persistent)
   ├─ limitHours: 2
   ├─ limitMinutes: 0
   ├─ resetHour: 0
   ├─ enableNotifications: true
   ├─ enableWarning: true
   ├─ showOverlay: true
   ├─ blockedSitesAdvanced: [
   │   {
   │     domain: "facebook.com",
   │     message: "Custom message",
   │     enableUnblockTime: true,
   │     unblockDuration: 5,
   │     enableConditionalBlock: true,
   │     blockStartTime: "09:00",
   │     blockEndTime: "17:00"
   │   }
   │ ]
   └─ dailyHistory: [last 90 days of data]
```

---

## 🔄 Daily Reset Cycle

```
Day 1:                         Day 2:
┌─────────────────────┐       ┌─────────────────────┐
│ 00:00 - 23:59       │       │ 00:00 - 23:59       │
│ Timer: RUNNING      │       │ Timer: RUNNING      │
│ Time: 0 → 2:30      │  -->  │ Time: 0 → 1:45      │
│ Status: Active      │       │ Status: Active      │
└─────────────────────┘       └─────────────────────┘
         ↓                              ↓
    MIDNIGHT                       MIDNIGHT
    (Reset)                        (Reset)
         ↓                              ↓
    Save to history           Save to history
    Clear daily counter       Clear daily counter
```

---

## 🎛️ Configuration Checklist

### Basic Setup ✅
- [x] Daily limit configured (2 hours)
- [x] Reset time set (00:00)
- [x] Notifications enabled
- [x] Warning at 80% enabled
- [x] Overlay widget enabled

### Advanced Setup (Optional)
- [ ] Add blocked sites
- [ ] Configure conditional blocking
- [ ] Set temporary unlock times
- [ ] Customize alert messages
- [ ] Export historical data

---

## 🚨 Alert System Status

```
ALERT WORKFLOW
│
├─ User reaches LIMIT (100%)
│  ├─ Alert window opens: "Time's up! ⏰"
│  ├─ Buttons available:
│  │  ├─ "Snooze 5 min" → Alert hides for 5 min
│  │  ├─ "Snooze 15 min" → Alert hides for 15 min
│  │  └─ "Dismiss" → Alert hides until end of day
│  │
│  └─ Can configure: Enable/disable notification
│
└─ User at WARNING (80%)
   ├─ Visual indicator changes to 🟡 Yellow
   ├─ Message: "⚠️ Getting close to daily limit"
   └─ Does NOT stop timer
```

---

## 📋 Active Features Matrix

| Feature | Implemented | Working | Configurable |
|---------|-------------|---------|--------------|
| Time Tracking | ✅ | ✅ | ❌ |
| Daily Limit | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Blocked Sites | ✅ | ✅ | ✅ |
| Conditional Block | ✅ | ✅ | ✅ |
| Temporary Unlock | ✅ | ✅ | ✅ |
| Per-Domain Stats | ✅ | ✅ | ❌ |
| Weekly Reports | ✅ | ✅ | ❌ |
| Monthly Reports | ✅ | ✅ | ❌ |
| CSV Export | ✅ | ✅ | ❌ |
| 90-Day History | ✅ | ✅ | ❌ |

---

## 🎯 Summary

**Total Active Settings:** 9 configurable options  
**Total Stop Conditions:** 7 primary causes  
**Data Retention:** 90 days  
**Storage Methods:** 2 (Local + Sync)  
**Supported Timezones:** Local system timezone  
**Status:** ✅ **FULLY OPERATIONAL**

---

*Generated: April 29, 2026*  
*Version: 1.0*
