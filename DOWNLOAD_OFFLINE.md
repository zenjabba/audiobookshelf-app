# Download & Offline Features

## Overview
The Download & Offline features enable users to download audiobooks and podcasts for offline listening, manage local storage, and play content without an internet connection. The system supports multi-part downloads for reliability, local media scanning on Android, and intelligent network usage controls.

## Key Features
- Queue-based download management
- Multi-part download for large files
- Progress tracking and resumption
- Local media folder support (Android)
- Cellular data usage controls
- Storage management tools
- Offline playback with progress sync
- Background downloading
- Download prioritization

## Download Architecture

### Component Structure
```
DownloadService.js (Core service)
├── Download Queue Management
├── File System Operations
├── Progress Tracking
└── Platform Handlers
    ├── iOS: Internal storage only
    └── Android: Internal + External storage
```

### Download Process Flow
```javascript
1. User initiates download
2. Check storage availability
3. Create download record
4. Split into parts if needed
5. Queue download tasks
6. Download parts concurrently
7. Merge completed parts
8. Update local database
9. Notify completion
```

## Queue Management

### Download Queue Model
```javascript
{
  id: string,                    // Unique download ID
  libraryItemId: string,
  episodeId: string,             // For podcasts
  url: string,                   // Server download URL
  destinationPath: string,       // Local storage path
  filename: string,
  size: number,                  // Total size in bytes
  downloadType: 'singleAudio' | 'multiTrack' | 'ebook',
  parts: [{
    id: string,
    start: number,             // Byte range start
    end: number,               // Byte range end
    status: 'pending' | 'downloading' | 'completed' | 'failed',
    progress: number           // 0-100
  }],
  status: 'queued' | 'downloading' | 'completed' | 'failed',
  progress: number,              // Overall progress 0-100
  startedAt: timestamp,
  completedAt: timestamp
}
```

### Queue Operations
```javascript
// Add to queue
DownloadService.addToQueue({
  libraryItemId,
  episodeId,
  downloadType,
  url,
  size
})

// Pause/Resume
DownloadService.pauseDownload(downloadId)
DownloadService.resumeDownload(downloadId)

// Remove from queue
DownloadService.removeFromQueue(downloadId)
```

## Multi-Part Download

### Part Configuration
```javascript
// Files > 100MB split into parts
const PART_SIZE = 10 * 1024 * 1024  // 10MB per part
const MAX_CONCURRENT_PARTS = 3

function createParts(totalSize) {
  const parts = []
  let start = 0
  
  while (start < totalSize) {
    const end = Math.min(start + PART_SIZE - 1, totalSize - 1)
    parts.push({ start, end, status: 'pending' })
    start = end + 1
  }
  
  return parts
}
```

### Part Download
```javascript
// Download with range headers
fetch(url, {
  headers: {
    'Range': `bytes=${part.start}-${part.end}`
  }
})
```

## Local Media Support

### Android External Folders
```javascript
// Local folder configuration
{
  id: string,
  name: string,
  path: string,              // e.g., /storage/emulated/0/Audiobooks
  type: 'folder',
  recursive: boolean,        // Scan subfolders
  autoScan: boolean,
  lastScan: timestamp
}

// Folder operations
LocalMediaScanner.addFolder(path)
LocalMediaScanner.scanFolder(folderId)
LocalMediaScanner.removeFolder(folderId)
```

### Local Media Model
```javascript
{
  id: string,
  folderId: string,
  path: string,
  filename: string,
  mimeType: string,
  size: number,
  duration: number,
  metadata: {
    title: string,
    author: string,
    narrator: string,
    series: string,
    albumArtist: string,
    album: string,
    publishedYear: string
  },
  audioTracks: [{
    index: number,
    path: string,
    filename: string,
    duration: number
  }],
  lastModified: timestamp
}
```

## Storage Management

### Storage Locations
```javascript
// iOS
/var/mobile/Containers/Data/Application/{app-id}/
├── Library/
│   ├── LocalDatabase/       // SQLite database
│   └── NoCloud/            // Downloaded files
└── tmp/                    // Temporary downloads

// Android
/Android/data/com.audiobookshelf.app/
├── databases/              // SQLite database
├── files/                  // Internal storage
└── External folders        // User-selected locations
```

### Storage Operations
```javascript
// Check available space
const freeSpace = await Filesystem.getFreeDiskSpace()
const requiredSpace = downloadSize * 1.1  // 10% buffer

if (freeSpace < requiredSpace) {
  throw new Error('Insufficient storage')
}

// Clean up partial downloads
await Filesystem.deleteFile({
  path: partialPath,
  directory: Directory.Data
})
```

### Storage Info Display
```javascript
// Download item storage info
{
  size: formatBytes(item.size),
  downloadedAt: formatDate(item.completedAt),
  storageLocation: item.isExternal ? 'External' : 'Internal',
  tracks: item.audioTracks.length
}
```

## Network Controls

### Cellular Data Settings
```javascript
// User preference levels
{
  ALWAYS: 'always',      // Use cellular for streaming/downloading
  ASK: 'ask',           // Prompt user each time
  NEVER: 'never'        // WiFi only
}

// Check before download
async function canDownloadOnCellular() {
  const networkStatus = await Network.getStatus()
  const userPref = store.getters['globals/getUseCellularData']
  
  if (networkStatus.connectionType === 'wifi') return true
  if (userPref === 'never') return false
  if (userPref === 'always') return true
  
  // Show prompt for 'ask'
  return await showCellularPrompt()
}
```

### Network Status Monitoring
```javascript
Network.addListener('networkStatusChange', status => {
  if (!status.connected) {
    DownloadService.pauseAllDownloads()
  } else if (status.connectionType === 'wifi') {
    DownloadService.resumePausedDownloads()
  }
})
```

## Download Management UI

### Downloads Page (`pages/downloads.vue`)
- List of downloaded items
- Storage usage per item
- Delete downloaded items
- Play offline content
- Filter by media type

### Downloading Page (`pages/downloading.vue`)
- Active download queue
- Progress indicators
- Pause/Resume controls
- Download speed display
- Error status

### Download Indicators
```javascript
// Progress calculation
const totalProgress = parts.reduce((sum, part) => {
  return sum + (part.progress * (part.end - part.start))
}, 0) / totalSize * 100

// Speed calculation
const downloadSpeed = bytesDownloaded / (Date.now() - startTime) * 1000
const remainingTime = (totalSize - bytesDownloaded) / downloadSpeed
```

## Platform Differences

### Android
- External folder support
- Local media scanning
- File browser integration
- Track reordering for local media
- Background service for downloads

### iOS
- Internal storage only
- iTunes file sharing
- Background download tasks
- Stricter file system access
- iCloud backup exclusion

## Error Handling

### Download Errors
```javascript
handleDownloadError(error, downloadId) {
  switch(error.type) {
    case 'NETWORK_ERROR':
      // Retry with exponential backoff
      this.retryDownload(downloadId, attempt + 1)
      break
      
    case 'STORAGE_FULL':
      // Show storage management dialog
      this.showStorageFullError()
      break
      
    case 'SERVER_ERROR':
      // Mark as failed, allow manual retry
      this.markDownloadFailed(downloadId)
      break
      
    case 'AUTH_ERROR':
      // Re-authenticate and retry
      this.reauthenticateAndRetry(downloadId)
      break
  }
}
```

### Recovery Mechanisms
1. **Partial Download Resume**: Save progress and resume from last byte
2. **Automatic Retry**: Exponential backoff for network errors
3. **Manual Retry**: User-initiated retry for permanent failures
4. **Cleanup**: Remove corrupted partial files

## Offline Playback

### Progress Tracking
```javascript
// Local progress saved during offline playback
{
  localMediaProgressId: string,
  currentTime: number,
  duration: number,
  progress: number,
  isFinished: boolean,
  lastUpdate: timestamp
}

// Sync when online
syncOfflineProgress() {
  const offlineProgress = await getOfflineProgress()
  for (const progress of offlineProgress) {
    await api.syncProgress(progress)
  }
}
```

### Offline Mode Detection
```javascript
// Automatic offline mode
const isOffline = !navigator.onLine || !serverReachable

if (isOffline) {
  // Show only downloaded content
  // Use local database
  // Queue sync operations
}
```

## Performance Optimizations

### Download Optimizations
- Concurrent part downloads
- Chunked transfer encoding
- Resume capability
- Background downloading
- Queue prioritization

### Storage Optimizations
- Compression for text files
- Efficient file naming
- Duplicate detection
- Automatic cleanup of old downloads

## Best Practices

### Development
1. Test with large files (>1GB)
2. Simulate network interruptions
3. Test storage full scenarios
4. Verify background download behavior
5. Test with various file formats

### User Experience
1. Clear progress indicators
2. Accurate time estimates
3. Easy queue management
4. Informative error messages
5. Smart cellular data warnings

### Performance
1. Limit concurrent downloads
2. Implement proper cleanup
3. Monitor memory usage
4. Optimize database queries
5. Use efficient file operations

## Future Enhancements
- Selective chapter downloads
- Download scheduling
- Bandwidth limiting
- P2P download support
- Cloud storage integration
- Smart download suggestions