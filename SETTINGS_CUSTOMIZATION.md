# Settings & Customization

## Overview
The Settings & Customization feature provides comprehensive app configuration options including UI themes, playback preferences, sleep timer settings, data usage controls, and platform-specific features. It ensures a personalized experience across different devices and use cases.

## Key Components

### Main Files
- `pages/settings.vue`: Main settings interface
- `pages/account.vue`: Account and server settings
- `store/globals.js`: Global app settings
- `store/playerSettings.js`: Playback-specific settings
- `modals/ReaderSettingsModal.vue`: E-reader customization

## UI Customization

### Theme Settings
```javascript
{
  appTheme: 'light' | 'dark' | 'black',
  accentColor: string,        // Hex color code
  readerTheme: 'light' | 'dark' | 'black',
  followSystemTheme: boolean
}
```

### Display Options
```javascript
{
  language: string,           // ISO language code
  useSystemFont: boolean,
  hapticFeedback: boolean,
  showProgressPercent: boolean,
  animationsEnabled: boolean
}
```

### Layout Preferences
```javascript
{
  libraryViewMode: 'grid' | 'list',
  coverAspectRatio: number,   // 1.0 = square, 1.6 = book
  itemsPerRow: number,        // Grid columns
  collapseSeries: boolean,
  showSeriesProgress: boolean
}
```

## Playback Settings

### Jump Controls
```javascript
{
  jumpForwardTime: number,    // 5-30 seconds
  jumpBackwardTime: number,   // 5-30 seconds
  autoRewindTime: number,     // 0-30 seconds on resume
  disableSkipButtons: boolean,
  disableSeekBar: boolean
}
```

### Speed and Quality
```javascript
{
  defaultPlaybackRate: number, // 0.5-3.0x
  mp3IndexSeekingEnabled: boolean,
  audioQuality: 'low' | 'medium' | 'high',
  streamingQuality: 'adaptive' | 'high'
}
```

### Advanced Player Settings
```javascript
{
  enableChapterSkip: boolean,
  autoPlayNext: boolean,
  crossfadeDuration: number,  // 0-10 seconds
  normalizeVolume: boolean,
  backgroundPlayback: boolean
}
```

## Sleep Timer Configuration

### Basic Settings
```javascript
{
  defaultSleepTimer: number,  // Minutes
  fadeOutEnabled: boolean,
  fadeOutDuration: number,    // Seconds
  endOfChapterEnabled: boolean,
  shakeToResetEnabled: boolean // Android only
}
```

### Auto Sleep Timer
```javascript
{
  autoSleepEnabled: boolean,
  autoSleepStartTime: string, // "22:00"
  autoSleepEndTime: string,   // "06:00"
  autoSleepWeekdaysOnly: boolean,
  autoRewindOnSleep: number,  // 0-300 seconds
  autoRewindDelay: number     // 1-30 seconds delay
}
```

## Data Usage Controls

### Network Settings
```javascript
{
  useCellularData: 'always' | 'ask' | 'never',
  downloadOnCellular: 'always' | 'ask' | 'never',
  streamQualityOnCellular: 'low' | 'medium' | 'high',
  meteredConnectionWarning: boolean
}
```

### Storage Management
```javascript
{
  maxCacheSize: number,       // MB
  autoClearCache: boolean,
  downloadLocation: string,   // Android only
  backupSettings: boolean
}
```

## Platform-Specific Features

### Android Settings
```javascript
{
  androidAutoEnabled: boolean,
  browseLimitRecentlyPlayed: number,
  browseLimitProgress: number,
  useSystemMediaPlayer: boolean,
  requestIgnoreBatteryOptimizations: boolean
}
```

### iOS Settings
```javascript
{
  carPlayEnabled: boolean,
  useSystemAudioSession: boolean,
  allowBackgroundRefresh: boolean,
  enableSiri: boolean
}
```

## E-Reader Settings

### Visual Customization
```javascript
{
  fontScale: number,          // 50-300%
  lineSpacing: number,        // 100-300%
  fontBoldness: number,       // 0-3
  marginSize: 'small' | 'medium' | 'large',
  textAlign: 'left' | 'center' | 'justify'
}
```

### Navigation Settings
```javascript
{
  volumeButtonsEnabled: boolean,
  volumeButtonMode: 'turnPage' | 'changeChapter' | 'disabled',
  tapZoneNavigation: boolean,
  swipeNavigation: boolean,
  keepScreenAwake: boolean
}
```

## Settings Persistence

### Local Storage
```javascript
// Device-specific settings
{
  ui: UISettings,
  player: PlayerSettings,
  reader: ReaderSettings,
  network: NetworkSettings,
  platform: PlatformSettings
}
```

### Server Sync
```javascript
// User preferences synced across devices
{
  playbackSettings: PlayerSettings,
  uiPreferences: UISettings,
  lastUpdated: timestamp
}
```

## Settings Import/Export

### Backup Format
```javascript
{
  version: string,
  timestamp: number,
  settings: {
    ui: UISettings,
    player: PlayerSettings,
    reader: ReaderSettings,
    // Excludes sensitive data
  }
}
```

### Migration Handling
```javascript
// Handle settings version changes
migrateSettings(oldVersion, newVersion) {
  // Apply incremental migrations
  // Validate setting values
  // Set defaults for new settings
}
```

## User Interface

### Settings Organization
- Grouped by category (UI, Playback, etc.)
- Search functionality
- Quick access to frequently changed settings
- Reset to defaults option per category

### Interactive Elements
- Live preview for themes
- Test buttons for jump times
- Audio quality comparison
- Real-time validation

## Integration Points

### Theme System
- Automatic theme switching
- System theme following
- Custom accent colors
- High contrast support

### Player Integration
- Real-time setting application
- No restart required
- Seamless transitions
- Setting persistence during playback

## Best Practices
- Provide sensible defaults
- Validate setting ranges
- Show setting effects immediately
- Group related settings logically
- Support setting reset/restore
- Handle edge cases gracefully