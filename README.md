# Time Tracker Chrome Extension

**Track your daily browser usage with alerts and limits**

## Features 📋

- ✅ Real-time tracking of browser usage
- ✅ Per-site time tracking with live updates
- ✅ Customizable daily time limits
- ✅ Visual warnings when approaching limits
- ✅ Settings page for configuration
- ✅ Daily reset at midnight
- ✅ **Advanced Site Blocking**
  - Custom block messages
  - Temporary unblock duration
  - Conditional blocking (specific times)
- ✅ **Visual Reports** 📈
  - Daily usage trends
  - Site distribution charts
  - Week-to-week comparison
  - Usage statistics
  - CSV export

## Installation 🚀

1. **Download or clone** this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (top-right corner)
4. Click **"Load unpacked"**
5. Select the project folder
6. The extension should now appear in your extensions list

## How It Works 🔍

### Core Components

- **manifest.json** - Extension configuration
- **popup.html/css/js** - Main interface showing stats
- **background.js** - Tracks active tabs and time
- **options.html/css/js** - Settings page
- **content.js** - Displays floating timer widget
- **reports.html/css/js** - Advanced analytics

### Tracking Logic

1. Monitors active tab and window focus
2. Pauses tracking when window loses focus or is minimized
3. Resumes tracking when returning to active browsing
4. Stores time per domain and total daily usage
5. Triggers notifications when limits are exceeded

## Usage 👨💻

### Basic Usage
1. **Click the extension icon** to view today's usage
2. **Navigate tabs**:
   - **Today** - Current day statistics
   - **Top Sites** - Most visited domains
   - **Reports** - Detailed analytics

### Advanced Features

#### 📈 Visual Reports
- **Daily Trends** - Usage patterns over time
- **Site Distribution** - Time spent per website
- **Comparative Analysis** - Week-to-week comparisons
- **Export Data** - Download usage data as CSV

#### 🚫 Site Blocking
- **Custom Messages** - Personalized block notifications
- **Temporary Unblock** - Allow brief access periods
- **Time-based Blocking** - Block sites during specific hours

### Settings ⚙️
- **Daily Limit** - Set maximum usage time
- **Reset Schedule** - Configure daily reset time
- **Notifications** - Enable/disable alerts
- **Warning Threshold** - Set early warning percentage
- **Blocked Sites** - Manage site restrictions

## File Structure

```
time-tracker/
├── manifest.json          # Extension configuration
├── popup.html/css/js      # Main popup interface
├── background.js          # Core tracking logic
├── content.js             # Floating timer widget
├── options.html/css/js    # Settings interface
├── reports.html/css/js    # Analytics dashboard
├── blocked.html/js        # Block page
├── alert-window.html/js   # Limit alerts
├── images/                # Extension icons
└── README.md              # Documentation
```


### Testing
1. Load extension in developer mode
2. Open DevTools for debugging:
   - Right-click extension → "Inspect popup"
   - Check "Service Worker" for background script
3. Monitor console for errors
4. Test tracking by switching tabs and windows

### Customization
- **CSS files** - Modify appearance and styling
- **JavaScript files** - Add features or change behavior
- **Storage** - Uses Chrome's local and sync storage APIs

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: tabs, storage, alarms, notifications, windows
- **Storage**: Chrome local storage for data, sync storage for settings
- **Architecture**: Service worker background script with content scripts

## Contributing 🤝

1. Fork the repository at [github.com/a0556775895-lgtm/Time-Tracker](https://github.com/a0556775895-lgtm/Time-Tracker)
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

---

**Built for productivity and focus** ⚡