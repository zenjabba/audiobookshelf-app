# E-Reader Features

## Overview
The E-Reader feature provides comprehensive reading capabilities for digital books in the AudioBookshelf mobile app. It supports multiple formats including EPUB, PDF, MOBI, and comic book archives, with customizable themes, fonts, and navigation options optimized for mobile devices.

## Key Features
- Multi-format support (EPUB, PDF, MOBI, CBZ/CBR)
- Customizable themes (Light, Dark, Black/OLED)
- Font size and spacing controls
- Touch gesture navigation
- Volume button page turning
- Table of Contents navigation
- Progress tracking and sync
- Offline reading support
- Keep screen awake option
- Responsive layout adaptation

## Supported Formats

### EPUB
- Full text reflow
- Chapter navigation
- CSS style support
- Embedded fonts
- Image support
- Footnotes/links

### PDF
- Page-based navigation
- Zoom and pan
- Text selection
- Fixed layout preservation

### MOBI
- Converted to HTML for display
- Basic formatting support
- Chapter detection

### Comics (CBZ/CBR)
- Archive extraction
- Image sequence display
- Fit-to-screen options
- Page spreads support

## Architecture

### Component Hierarchy
```
Reader.vue (Main container)
├── ReaderToolbar.vue (Top controls)
├── ReaderBottomBar.vue (Progress/settings)
└── Format-specific readers
    ├── EpubReader.vue
    ├── PdfReader.vue
    ├── MobiReader.vue
    └── ComicReader.vue
```

### State Management
```javascript
// Reader state in component data
{
  ereaderSettings: {
    theme: 'dark',
    fontScale: 100,
    lineSpacing: 100,
    fontBoldness: 0,
    spread: 'auto',
    volumeButtons: true,
    volumeButtonsMode: 'turnPage',
    keepScreenAwake: true
  },
  currentLocation: {
    cfi: string,        // EPUB location
    page: number,       // PDF/Comic page
    percentage: number  // Progress 0-1
  }
}
```

## Reader Components

### Main Reader (`Reader.vue`)
- Manages reader initialization
- Handles format detection
- Controls toolbar visibility
- Manages settings persistence
- Handles progress updates

### EPUB Reader (`EpubReader.vue`)
```javascript
// Uses epub.js library
book = ePub(bookUrl)
rendition = book.renderTo('viewer', {
  width: '100%',
  height: '100%',
  allowScriptedContent: false,
  flow: 'paginated'
})

// Apply theme
rendition.themes.register(themeName, styles)
rendition.themes.select(themeName)
```

### PDF Reader (`PdfReader.vue`)
```javascript
// Uses pdf.js library
pdfjsLib.getDocument({
  url: pdfUrl,
  cMapUrl: '/cmaps/',
  cMapPacked: true
}).promise.then(pdfDoc => {
  // Render pages
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale })
    // Render to canvas
  })
})
```

### MOBI Reader (`MobiReader.vue`)
```javascript
// Server converts MOBI to HTML
fetch(`/api/ebooks/${id}/resource`).then(res => {
  // Display HTML content
  // Apply reader styles
  // Handle navigation
})
```

### Comic Reader (`ComicReader.vue`)
```javascript
// Extract and display images
{
  images: [
    { src: '/api/ebooks/id/page/0', width, height },
    { src: '/api/ebooks/id/page/1', width, height }
  ],
  currentPage: 0,
  fitMode: 'width' // width, height, screen
}
```

## Features

### Theme System
```css
/* Light Theme */
.reader-theme-light {
  background: #ffffff;
  color: #000000;
}

/* Dark Theme */
.reader-theme-dark {
  background: #232323;
  color: #ffffff;
}

/* Black/OLED Theme */
.reader-theme-black {
  background: #000000;
  color: #ffffff;
}
```

### Font Settings
- **Font Scale**: 50% - 300%
- **Line Spacing**: 100% - 300%
- **Font Boldness**: 0 - 3 (text stroke width)

### Touch Controls
```javascript
// Tap zones
const leftZone = screenWidth * 0.33
const rightZone = screenWidth * 0.67

if (tapX < leftZone) previousPage()
else if (tapX > rightZone) nextPage()
else toggleToolbars()
```

### Volume Button Navigation
```javascript
// Volume button modes
volumeButtonsMode: {
  'turnPage': 'Turn pages',
  'changeChapter': 'Change chapters',
  'disableTurnPage': 'Disable page turn'
}

// Implementation
document.addEventListener('volumeupbutton', () => {
  if (mode === 'turnPage') nextPage()
  else if (mode === 'changeChapter') nextChapter()
})
```

## Settings and Customization

### Reader Settings Modal
```javascript
{
  // Visual Settings
  theme: 'light' | 'dark' | 'black',
  fontScale: 50-300,          // Percentage
  lineSpacing: 100-300,       // Percentage
  fontBoldness: 0-3,          // Stroke width
  
  // Layout Settings (EPUB)
  spread: 'auto' | 'single',  // Page layout
  
  // Navigation Settings
  volumeButtons: boolean,
  volumeButtonsMode: string,
  keepScreenAwake: boolean
}
```

### Settings Persistence
- Stored in local device settings
- Applied on reader initialization
- Synced across reading sessions
- Format-specific settings preserved

## Navigation

### EPUB Navigation
1. **Table of Contents**
   - Chapter list with nesting
   - Direct navigation to sections
   - Current chapter highlighting

2. **Location-based**
   - CFI (Canonical Fragment Identifier) locations
   - Percentage-based progress
   - Page number estimation

### PDF Navigation
1. **Page-based**
   - Direct page input
   - Thumbnail navigation
   - Bookmarks support

2. **Scroll modes**
   - Single page
   - Continuous scroll
   - Spread view

### Comic Navigation
- Sequential page viewing
- Two-page spread support
- Fit-to-width/height/screen
- Pinch zoom on pages

## Progress Tracking

### Local Progress
```javascript
// Saved periodically and on pause
{
  libraryItemId: string,
  episodeId: null,
  ebookLocation: string,    // CFI for EPUB
  ebookProgress: number,    // 0-1 percentage
  currentPage: number,      // For PDF/Comics
  totalPages: number,
  lastUpdate: timestamp
}
```

### Server Sync
```javascript
// POST /api/me/progress/:id/sync
{
  ebookLocation: cfi,
  ebookProgress: percentage,
  duration: totalReadingTime,
  currentTime: currentReadingTime
}
```

### Progress Indicators
- Bottom bar progress display
- Page numbers (current/total)
- Percentage complete
- Time remaining estimates

## Offline Reading

### Downloaded Books
- Full book cached locally
- Progress tracked offline
- Syncs when reconnected
- Settings preserved

### Local Files
- Direct file access
- No server requirement
- Format auto-detection
- Progress saved locally

## Performance Optimizations

### EPUB Optimization
```javascript
// Location cache to improve navigation
const locationCache = new Map()
const MAX_CACHE_SIZE = 1024 * 1024 * 3 // 3MB

// Viewport-based rendering
rendition.on('rendered', () => {
  // Only process visible content
})
```

### PDF Optimization
- Progressive page loading
- Canvas pooling
- Resolution scaling
- Memory management

### Comic Optimization
- Image preloading (next 2 pages)
- Resolution adaptation
- Memory cleanup
- Lazy loading for large archives

## Error Handling

### Format Errors
```javascript
handleFormatError(error) {
  if (error.type === 'INVALID_EPUB') {
    // Show format error message
  } else if (error.type === 'MISSING_RESOURCE') {
    // Handle missing files
  } else if (error.type === 'CORRUPT_FILE') {
    // Suggest re-download
  }
}
```

### Loading States
- Initial loading spinner
- Chapter loading indicators
- Image loading placeholders
- Error recovery options

## Platform Differences

### iOS Specific
- WKWebView for EPUB rendering
- Swipe gesture handling
- Safe area considerations
- Font rendering adjustments

### Android Specific
- WebView with hardware acceleration
- Volume button event handling
- Back button navigation
- Screen wake lock API

## Best Practices

### Development
1. Test with various book sizes
2. Verify offline functionality
3. Check memory usage with large PDFs
4. Test gesture conflicts
5. Validate progress accuracy

### User Experience
1. Preserve reading position precisely
2. Apply settings immediately
3. Provide loading feedback
4. Handle errors gracefully
5. Optimize for one-handed use

### Performance
1. Limit concurrent image loads
2. Clear resources on exit
3. Cache calculated locations
4. Debounce progress saves
5. Optimize for battery life

## Future Enhancements
- Text-to-speech integration
- Annotation support
- Dictionary lookup
- Search within books
- Cloud sync for annotations
- Advanced typography options