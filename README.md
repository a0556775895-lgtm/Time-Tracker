# ⏱️ Time Tracker - Chrome Extension

**Track your daily browser usage with alerts and limits**

## Features 📋

- ✅ Real-time tracking of browser usage
- ✅ Per-site time tracking
- ✅ Customizable daily time limits
- ✅ Visual warnings when approaching limits
- ✅ Settings page for fine-tuning
- ✅ Daily reset at midnight
- ✅ **Blocked sites with advanced options**
  - Custom block messages
  - Temporary unblock duration (configurable)
  - Conditional blocking (specific times only)
- ✅ **Advanced Visual Reports** 📈
  - Daily usage trends chart
  - Site distribution pie chart
  - Week-to-week comparison
  - Smart insights and statistics
  - CSV export functionality

## Installation 🚀

### Method 1: Developer Mode (Recommended for Development)

1. **Open Chrome** and go to `chrome://extensions/`
2. **Toggle "Developer mode"** (top-right corner)
3. Click **"Load unpacked"**
4. Select the `mine-exte` folder
5. The extension should now appear in your extensions list

### Method 2: Package as .crx (For Distribution)
1. Go to `chrome://extensions/`
2. Right-click the extension
3. Click "Pack extension"

## How It Works 🔍

### Main Components

- **manifest.json** - Extension configuration
- **popup.html/css/js** - Popup window showing stats
- **background.js** - Tracks active tab and accumulates time
- **options.html/css/js** - Settings page
- **content.js** - Runs on every webpage

### Tracking Logic

1. Extension watches for tab switches
2. When tab becomes inactive, time is recorded
3. Time is stored per domain (e.g., youtube.com)
4. Daily limit is compared against total usage
5. Notifications trigger when limit exceeded

## Usage 👨‍💻

### Basic Usage
1. **Click the extension icon** to see today's usage
2. **View tabs**:
   - 📊 **היום** (Today) - Current day stats
   - 🌐 **אתרים מובילים** (Top Sites) - Most visited domains
   - 📈 **דוחות** (Reports) - Weekly/monthly summaries

### Advanced Features

#### 📈 Visual Reports
1. Click the **📈 דוחות מלאים** button in popup
2. View detailed statistics:
   - **Daily Trends** - Line chart of usage over time
   - **Site Distribution** - Pie chart showing top sites
   - **Week Comparison** - Bar chart comparing weeks
   - **Smart Insights** - AI-generated suggestions
3. Filter by period: Week, Month, 3 Months, or All
4. Export data as CSV

#### 🚫 Advanced Blocked Sites
1. Go to **⚙️ Settings**
2. In **אתרים חסומים מתקדמים** section:
   - Enter domain name (e.g., `youtube.com`)
   - Click **➕ הוסף** to add
3. Click **⚙️ ערוך** to configure:
   - **Custom Block Message** - Show custom message when site is blocked
   - **Unblock Duration** - Allow temporary unblock (e.g., 5 minutes)
   - **Conditional Blocking** - Block only during specific hours (e.g., 9 AM - 5 PM)
4. Changes save automatically

### Settings ⚙️
1. **Limit Time** - Set maximum daily usage
2. **Reset Time** - Choose when to reset daily counter
3. **Notifications** - Enable/disable alerts
4. **Warning** - Show warning at 80% of limit
5. **Blocked Sites** - Add advanced blocking rules

## Customization 🎨

Edit CSS files to:
- **popup.css** - Change popup colors and layout
- **options.css** - Customize settings page
- **reports.css** - Modify report visualizations

Edit JS files to:
- **popup.js** - Add new tracking features
- **background.js** - Modify tracking logic
- **reports.js** - Change analytics calculations

## Default Settings

- **Daily Limit**: 2 hours
- **Notifications**: Enabled
- **Warning Threshold**: 80% of limit

## Testing Tips 🧪

1. Open popup frequently to see live updates
2. Switch between tabs to test tracking
3. Use DevTools: 
   - Right-click extension → "Inspect popup"
   - Right-click extension → "Background page"
4. Check stored data in DevTools → Application → Local Storage

## File Structure

```
mine-exte/
├── manifest.json          # Extension config
├── popup.html/css/js      # Popup interface
├── background.js          # Tab tracking logic
├── content.js             # Content script
├── options.html/css/js    # Settings page
├── images/                # Icons (placeholder)
└── README.md              # This file
```

## Known Limitations ⚠️

- Icon images need to be added manually (use SVG or PNG)
- Blocked sites feature not yet functional
- Background tracking may have slight delays
- Service worker restarts may cause time loss

## Future Improvements 🔮

- [ ] Export usage statistics
- [ ] Per-app tracking (Windows/Mac)
- [ ] Cloud sync across devices
- [ ] Pomodoro timer integration
- [ ] Dark mode
- [ ] Weekly/monthly reports

## Troubleshooting 🔧

**Extension not tracking?**
- Check DevTools console for errors
- Ensure "Developer mode" is enabled
- Reload extension (toggle on/off)

**Popup not updating?**
- Click the popup to refresh
- Check if background worker is running

**Settings not saving?**
- Use Chrome sync: chrome.storage.sync
- Clear browser cache

## Resources 📚

- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

---

**Made with ❤️ for productivity nerds**
