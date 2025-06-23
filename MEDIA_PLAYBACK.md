# Media Playback

## Overview
The Media Playback feature is the core functionality of the AudioBookshelf mobile app, providing comprehensive audio playback capabilities with cross-platform support. It handles audiobook and podcast playback with advanced features like variable speed control, chapter navigation, bookmarks, sleep timers, and platform-specific integrations.

## Key Features
- Multi-format audio playback (MP3, M4A, M4B, FLAC, OGG)
- Variable playback speed (0.5x - 3.0x)
- Chapter navigation and display
- Bookmarks with notes
- Sleep timer with multiple options
- Background playback
- Lock screen controls
- Android Auto integration
- Chromecast support (Android)
- Progress syncing across devices
- Offline playback support
- Playback queue management

## Player Architecture

### Component Structure
```
AudioPlayerContainer.vue (Main container)
├── AudioPlayer.vue (UI controls)
├── MediaSessionHandler.js (Platform integration)
├── PlayerService.js (Business logic)
└── Native Players
    ├── iOS: AVPlayer
    └── Android: ExoPlayer
```

### State Management

#### Player Settings Store (`store/playerSettings.js`)
```javascript
state: {
  playbackRate: 1.0,
  jumpForwardTime: 10,
  jumpBackwardTime: 10,
  autoSleepTimer: false,
  autoSleepTimerStartTime: '22:00',
  autoSleepTimerEndTime: '06:00',
  autoSleepTimerAutoRewind: 0,
  autoSleepTimerAutoRewindDelay: 5,
  sleepTimerLength: 900000, // 15 minutes
  shakeEnabled: false,
  disableSkipButtons: false,
  disableSeekBar: false,
  hapticFeedback: true
}
```

#### User Store Player State
```javascript
{
  currentPlaybackSession: {
    id: string,
    userId: string,
    libraryItemId: string,
    episodeId: string,
    mediaType: 'book' | 'podcast',
    displayTitle: string,
    displayAuthor: string,
    coverPath: string,
    playMethod: number,
    mediaPlayer: string,
    serverConnectionConfigId: string,
    localMediaProgressId: string
  },
  currentPlaybackRate: number,
  sleepTimerEndTime: number,
  sleepTimerRemaining: number
}
```

## Audio Handling

### Play Methods
1. **DirectPlay (0)**: Direct file streaming
2. **DirectStream (1)**: Server transcoding
3. **Transcode (2)**: Full transcoding
4. **Local (3)**: Local file playback

### Platform-Specific Players

#### iOS Implementation
```swift
// Uses AVPlayer with AVAudioSession
AVAudioSession.sharedInstance().setCategory(.playback)
player = AVPlayer(url: audioUrl)
player.rate = playbackRate
```

#### Android Implementation
```java
// Uses ExoPlayer with MediaSessionCompat
MediaSource mediaSource = new ProgressiveMediaSource.Factory(dataSourceFactory)
    .createMediaSource(MediaItem.fromUri(audioUrl));
player.setMediaSource(mediaSource);
player.setPlaybackSpeed(playbackRate);
```

### Web Fallback
```javascript
// HTML5 Audio element for development/web
const audio = new Audio(audioUrl)
audio.playbackRate = playbackRate
audio.currentTime = startTime
```

## Progress Sync Mechanism

### Local Progress Tracking
```javascript
// Saved every 10 seconds during playback
{
  id: string,
  libraryItemId: string,
  episodeId: string,
  duration: number,
  progress: number,        // 0-1 percentage
  currentTime: number,     // seconds
  isFinished: boolean,
  ebookLocation: string,
  ebookProgress: number,
  lastUpdate: number,
  startedAt: number,
  finishedAt: number
}
```

### Server Sync
```javascript
// POST /api/me/progress/:id/sync
{
  currentTime: number,
  duration: number,
  progress: number,
  isFinished: boolean
}

// Sync triggered:
// - Every 20 seconds during playback
// - On pause/stop
// - On app background
// - On chapter change
```

## Platform-Specific Integrations

### Media Session API
```javascript
// MediaSessionHandler.js
updateMetadata(sessionData) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sessionData.displayTitle,
      artist: sessionData.displayAuthor,
      album: sessionData.libraryItemId,
      artwork: [{
        src: sessionData.coverPath,
        sizes: '512x512',
        type: 'image/jpeg'
      }]
    })
  }
}
```

### Android Auto
```javascript
// AndroidAutoHandler.js
{
  enabled: true,
  browseLimitForRecentlyPlayed: 30,
  browseLimitForProgressBar: 8
}
```

### Lock Screen Controls
- Play/Pause
- Skip Forward/Backward
- Playback position
- Cover art display
- Chapter information

## Cast/Chromecast Support

### Android Implementation
```javascript
// CastHandler.js
castSession.loadMedia({
  contentId: audioUrl,
  contentType: 'audio/mpeg',
  streamType: 'BUFFERED',
  metadata: {
    type: 'audioBook',
    title: displayTitle,
    subtitle: displayAuthor,
    images: [{ url: coverUrl }]
  }
})
```

### Cast Progress Sync
- Updates every 2 seconds
- Syncs on cast connection/disconnection
- Handles seek events

## Sleep Timer

### Timer Options
1. **Fixed Times**: 5, 10, 15, 30, 45, 60, 90, 120 minutes
2. **End of Chapter**: Stops at chapter boundary
3. **Custom Duration**: User-defined time
4. **Auto Sleep Timer**: Time range based

### Features
- Fade out audio (last 30 seconds)
- Auto-rewind on timer end (configurable)
- Shake to reset (Android)
- Visual countdown in player

### Implementation
```javascript
// SleepTimerService.js
startTimer(duration, options) {
  this.endTime = Date.now() + duration
  this.fadeOut = options.fadeOut
  this.endOfChapter = options.endOfChapter
  
  this.interval = setInterval(() => {
    const remaining = this.endTime - Date.now()
    if (remaining <= 0) {
      this.handleTimerEnd()
    } else if (remaining <= 30000 && this.fadeOut) {
      this.startFadeOut()
    }
  }, 1000)
}
```

## Bookmarks System

### Bookmark Model
```javascript
{
  id: string,
  libraryItemId: string,
  title: string,
  time: number,           // seconds
  createdAt: number
}
```

### Operations
- Create bookmark at current position
- Jump to bookmark
- Edit bookmark title
- Delete bookmark
- Sync with server

## Playback Controls

### Basic Controls
- Play/Pause toggle
- Seek bar with buffering indicator
- Current time / Total duration display

### Jump Controls
- Jump backward (configurable: 5-30s)
- Jump forward (configurable: 5-30s)
- Previous/Next chapter
- Custom seek via progress bar

### Speed Control
- Range: 0.5x to 3.0x
- Step: 0.1x
- Presets: 0.75x, 1x, 1.25x, 1.5x, 2x
- Persisted per library item

## Chapter Navigation

### Chapter Display
- Current chapter title
- Chapter progress
- Total chapters
- Time remaining in chapter

### Chapter Modal
- Full chapter list
- Progress indicators
- Direct navigation
- Search capability

## Performance Considerations

### Memory Management
- Audio buffer size limits
- Cover image optimization
- Component cleanup on unmount
- Event listener management

### Battery Optimization
- Screen wake lock options
- Background playback efficiency
- Reduced UI updates when backgrounded

### Network Usage
- Chunked audio streaming
- Bandwidth detection
- Offline fallback
- Progress sync batching

## Error Handling

### Playback Errors
```javascript
handlePlaybackError(error) {
  switch(error.code) {
    case 'NETWORK_ERROR':
      // Retry with exponential backoff
      break
    case 'DECODE_ERROR':
      // Try alternative format
      break
    case 'PERMISSION_DENIED':
      // Request permissions
      break
  }
}
```

### Sync Errors
- Offline queue for progress updates
- Retry mechanism
- Conflict resolution
- User notification

## Event Flow

### Starting Playback
1. User taps play on library item
2. Check if downloaded/streaming
3. Initialize native player
4. Load audio source
5. Restore previous position
6. Start progress tracking
7. Update media session
8. Begin sync timer

### Progress Update
1. Native player reports time update
2. Update local progress database
3. Update UI components
4. Check chapter boundaries
5. Queue server sync
6. Update media session

### Stopping Playback
1. User action or completion
2. Save final position
3. Sync progress immediately
4. Clear media session
5. Release audio resources
6. Update library display

## Configuration

### User Settings
- Playback speed per item
- Jump times
- Auto-sleep preferences
- UI preferences (buttons, seekbar)
- Haptic feedback

### Player Settings
- Buffer size
- Seek accuracy
- Background mode
- Cast preferences
- Download quality

## Best Practices

### Development
1. Test on real devices for audio focus
2. Handle interruptions properly
3. Verify background playback
4. Test with various audio formats
5. Check memory usage with long books

### User Experience
1. Persist playback position accurately
2. Show clear loading states
3. Handle errors gracefully
4. Provide feedback for all actions
5. Maintain consistency across platforms

### Performance
1. Preload next chapter
2. Cache cover images
3. Batch progress updates
4. Minimize background CPU usage
5. Optimize for battery life

## Future Enhancements
- Variable speed per narrator
- Silence trimming
- Chapter download priority
- Crossfade between files
- EQ settings
- Bluetooth button mapping