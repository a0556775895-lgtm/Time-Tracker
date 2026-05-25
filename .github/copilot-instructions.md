# Chrome Extension Project - Copilot Instructions

## Project Overview

This is a **Time Tracker Chrome Extension** that monitors daily browser usage with customizable limits and alerts.

## Development Guidelines

### Architecture

- **Manifest V3** compatible
- Uses **Chrome Storage API** for persistent data
- **Service Worker** pattern for background tasks
- Communicates via message passing between contexts

### File Purposes

- `manifest.json` - Declares permissions and extension structure
- `popup.html/js/css` - User-facing dashboard showing usage stats
- `background.js` - Core tracking logic watching tab switches
- `options.html/js/css` - Settings interface
- `content.js` - Minimal script injected into web pages

### Key Functions

- **saveActiveTabTime()** - Records time spent on current tab/domain
- **updateDisplay()** - Updates popup UI with current stats
- **formatTime()** - Converts milliseconds to human-readable format

### Testing Workflow

1. Make code changes
2. Go to `chrome://extensions/`
3. Find this extension and click the refresh icon
4. Open popup to see changes
5. Use DevTools for debugging

### Storage

- `chrome.storage.local` - Temporary daily stats (resets daily)
- `chrome.storage.sync` - User preferences (persists across devices)

## Next Steps

1. Create icon files (16x16, 48x48, 128x128)
2. Add error handling for edge cases
3. Implement block list feature
4. Add export statistics feature
5. Create more detailed reports page

## Common Tasks

- **Change UI colors**: Edit `popup.css` and `options.css`
- **Add tracking feature**: Modify `background.js` and save to storage
- **Add settings option**: Add to `options.html` form and handle in `options.js`

## Debugging Tips

- Check popup: Right-click extension icon → Inspect popup
- Check background: Right-click extension → "Inspect background page"  
- View console: F12 in popup or background pages
- View storage: DevTools → Application → Storage
