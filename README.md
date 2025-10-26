# Period Tracker Chrome Extension

Chrome extension that extracts date/time from photo EXIF data and manages menstrual flow records with AI estimation

> **Note**: This project was created for the **Google Chrome Built-in AI Challenge 2025**. Most of the code was written with the assistance of **Claude Code** (claude.ai/code).

## Features

- 📷 Auto-extract photo date/time from EXIF data
- 🤖 **AI-powered flow estimation** using Chrome Prompt API 
- 💾 Store data in Chrome Storage (local)
- 📊 History view with delete functionality
- 🔒 Complete local processing (no external data transmission except Chrome built-in AI)

## Setup

### 1. Install Chrome Extension

1. Clone or download this repository
   ```bash
   git clone <repository-url>
   cd chrome-extension
   ```

2. Open `chrome://extensions/` in Chrome

3. Enable "Developer mode" (top right toggle)

4. Click "Load unpacked"

5. Select the `chrome-extension` folder

6. Extension will appear in the toolbar


## How to Use

### Basic Workflow

1. **Click Extension Icon**
   - Click the toolbar icon to open popup

2. **Add New Record**
   - Click "Add New Record" button

3. **Select Photo**
   - Select an image file from your device (JPEG, PNG supported)
   - Date/time will be auto-extracted from EXIF data
   - For simple testing purpose, please use images inside testimage.zip used during development (Note: we used colored water on pads to simulate menstrual flow — these are not real samples.)

4. **AI Estimation (Automatic)**
   - After selecting a photo, AI automatically estimates menstrual flow volume (ml)
   - Processing status shown as "AI is analyzing..."
   - Estimated value appears in the "Flow Amount" field

5. **Review and Edit**
   - **Date & Time**: Auto-extracted from photo (editable)
   - **Flow Amount (ml)**: AI estimated value (editable, 0-50ml, integers only)
     - Click 🤖 button to re-estimate with AI if needed
   - **Notes**: Optional field for symptoms or observations

6. **Save**
   - Click "Save" button
   - Data is saved to Chrome Storage

7. **Success Screen**
   - Shows saved data preview
   - Options to add another record or view history

### Viewing History

1. Click "View History" from the main screen
2. Past records are displayed in reverse chronological order (newest first)
3. Each record supports:
   - **🗑️ Delete**: Delete the record (with confirmation dialog)
   - **Delete All Records**: Delete all history at once (appears when records exist)

## AI Flow Estimation Feature

### How It Works

- Uses **Chrome Prompt API** (Chrome's built-in AI)
- Analyzes sanitary pad images to estimate menstrual flow volume
- Assumes a standard 22.5cm regular pad size
- Estimates based on coverage area percentage
- Returns integer values between 0-50ml

### Estimation Guidelines

- Very light flow: 5-10ml (~30-40% coverage)
- Light flow: 10-15ml (~40-50% coverage)
- Moderate flow: 15-25ml (~50-60% coverage)
- Heavy flow: 25-35ml (~60-80% coverage)
- Very heavy flow: 35-50ml (~80-100% coverage)

### Re-estimation

- Click the 🤖 button next to the Flow Amount field to re-run AI estimation
- Useful if you want to try estimation again with the same image

### Fallback

- If AI estimation fails or Prompt API is unavailable, you can manually enter the value
- Manual input is always possible regardless of AI availability

## Troubleshooting

### Cannot Extract Date/Time from Photo

- **Cause**: Photo does not contain EXIF data
- **Solution**: File modification date is used automatically. Edit date/time manually if needed

### AI Estimation Fails

- **Cause**: Chrome Prompt API not available (requires Chrome Canary/Dev channel with experimental AI flag enabled)
- **Solution**:
  - Use Chrome Canary or Chrome Dev
  - Enable `chrome://flags/#optimization-guide-on-device-model`
  - Manually enter flow amount if AI is unavailable

### Cannot Save Data

- **Cause**: Chrome Storage capacity limit
- **Solution**:
  - Delete unnecessary records
  - Chrome Storage limit: ~5MB (can store thousands of records normally)

## Data Management

### Data Storage Location

All data is stored in **Chrome Storage (chrome.storage.local)**.
- No data is sent to external servers
- Data is deleted when the extension is uninstalled

### Data Backup (Planned for Phase 3)

JSON/CSV export/import functionality will be added in the future.

## Privacy and Security

### Data Protection

- **Complete Local Processing**: All data is processed locally only
- **No External Transmission**: Image data and records are never sent to external servers
  - **Exception**: When using Prompt API (Phase 2), image data is sent to Chrome's built-in AI (local processing within Chrome)
- **No Google Account Required**: No OAuth authentication needed

### Recommendations

- Backup data regularly (manual copy for now)
- Be cautious when using on shared computers
- Does not work in Private/Incognito mode (data cannot be saved)

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Main UI HTML
├── popup.js               # UI control and EXIF extraction
├── styles.css             # Stylesheet
├── lib/
│   ├── exif.js           # EXIF parsing library
│   ├── storage.js        # Chrome Storage API wrapper
│   └── prompt-api.js     # Prompt API wrapper (Phase 2)
├── icons/
│   ├── icon16.png        # Icon (16x16)
│   ├── icon48.png        # Icon (48x48)
│   └── icon128.png       # Icon (128x128)
└── README.md             # This file
```

## Implemented Features

### Phase 1: Basic Functionality ✅
- [x] EXIF date/time extraction
- [x] Manual data entry
- [x] Chrome Storage integration
- [x] History view
- [x] Delete functionality

### Phase 2: AI Integration ✅
- [x] Chrome Prompt API integration
- [x] Automatic flow estimation from images
- [x] Re-estimation feature (🤖 button)
- [x] AI availability check

### Phase 2.6: UI Simplification ✅
- [x] Removed clipboard copy functionality
- [x] Simplified save workflow

### Phase 2.7: Empty State Simplification ✅
- [x] Removed "No records yet" empty state UI
- [x] Simplified history display logic

## Future Feature Plans

### Phase 3: Enhanced Features
- [ ] Data export functionality (JSON/CSV)
- [ ] Data import functionality (backup restore)
- [ ] Filter and search functionality
- [ ] Statistics and graphs
- [ ] Batch photo registration

## Development Information

### Tech Stack

- **Manifest Version**: 3
- **Language**: Vanilla JavaScript (no build process required)
- **Libraries**:
  - EXIF.js: Image metadata extraction
- **APIs**:
  - Chrome Storage API
  - Chrome Prompt API (experimental)

### Development Process

This project was developed with extensive assistance from **Claude Code**:
- Architecture design and planning
- Code implementation (JavaScript, HTML, CSS)
- Chrome Prompt API integration
- Documentation writing
- Bug fixing and refinement

The development process demonstrates how AI-assisted coding tools can accelerate Chrome extension development, particularly when integrating experimental APIs like Chrome's Built-in AI.

### Development Environment

```bash
# Reload extension
Click "Reload" at chrome://extensions/

# Debugging
- Popup: Right-click → "Inspect"
- Check console for errors
```

### Contributions

Please submit bug reports and feature requests to Issues.

## FAQ

**Q: Can it automatically register to calendar?**
A: No. This extension saves data locally in Chrome Storage. You'll need to manually export and import to external calendar apps (export feature planned for Phase 3).

**Q: Does it work on mobile?**
A: No. Chrome extensions only work on desktop Chrome, not mobile browsers.

**Q: How many records can I store?**
A: Up to Chrome Storage capacity limit (~5MB). Normally you can store thousands of records.

**Q: Is AI estimation accurate?**
A: To say honestly, it is still under tuning/evaluation. AI estimation tries to provide a reasonable approximation based on visual coverage area, but it tends to overesimate the volume corrently. Results may vary depending on image quality, lighting, and pad type. You can always manually edit the estimated value.

**Q: Which Chrome version is required for AI features?**
A: Chrome Prompt API requires Chrome Canary or Chrome Dev with experimental AI flags enabled (`chrome://flags/#optimization-guide-on-device-model`). As of January 2025, this API is still experimental.

## License

MIT License

## Support

If you encounter issues, please check:
1. Chrome extension error logs (right-click → "Inspect")
2. Chrome version (recommended: latest version)
3. Image file format (supports JPEG, PNG)
4. For enabling local AI in your environment: Please check https://developer.chrome.com/docs/ai/get-started?hl=en#user-activation

---

**Note**: This extension handles personal health records. Use only in trusted environments.
