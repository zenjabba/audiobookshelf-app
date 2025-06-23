# AudioBookshelf Mobile App - Feature Documentation

This document provides a comprehensive overview of all major features in the AudioBookshelf mobile app. Each feature has detailed documentation in its respective file.

## Core Features

### [Authentication & Server Connection](AUTHENTICATION_SERVER_CONNECTION.md)
Handles connecting to AudioBookshelf servers with local and OAuth authentication, custom headers support, and persistent session management.

### [Library & Bookshelf Management](LIBRARY_BOOKSHELF.md)
Multi-library browsing with grid/list views, personalized shelves, filtering/sorting, and virtual scrolling for performance optimization.

### [Media Playback](MEDIA_PLAYBACK.md)
Comprehensive audio playback with variable speed, chapter navigation, bookmarks, sleep timer, background playback, and platform-specific integrations (Android Auto, CarPlay).

### [E-Reader](EREADER.md)
Multi-format e-book reading (EPUB, PDF, MOBI, Comics) with customizable themes, fonts, touch/volume navigation, and progress tracking.

### [Download & Offline](DOWNLOAD_OFFLINE.md)
Queue-based download management with multi-part downloads, local media scanning (Android), cellular data controls, and offline playback support.

## Content Discovery & Organization

### [Search & Discovery](SEARCH_DISCOVERY.md)
Real-time search across all content types, podcast RSS discovery, and optimized search performance with debouncing.

### [Playlists](PLAYLISTS.md)
Custom playlist creation with drag-and-drop reordering, composite covers, and seamless player integration for continuous playback.

## User Experience

### [Statistics & History](STATISTICS_HISTORY.md)
Listening analytics with interactive charts, session tracking, listening streaks, and Year in Review feature.

### [Settings & Customization](SETTINGS_CUSTOMIZATION.md)
Comprehensive app configuration including UI themes, playback preferences, sleep timer settings, and platform-specific features.

## Technical Foundation

### [Technical Infrastructure](TECHNICAL_INFRASTRUCTURE.md)
Core systems including SQLite database, synchronization, logging with privacy protection, and native platform integrations.

## Development Notes

### Technology Stack
- **Frontend**: Vue.js 2 with Nuxt.js
- **Mobile Framework**: Capacitor
- **Database**: SQLite with native plugins
- **State Management**: Vuex
- **Native Platforms**: iOS (Swift) and Android (Java/Kotlin)

### Key Architectural Patterns
- Component-based UI architecture
- Event-driven real-time updates via WebSocket
- Progressive web app with native enhancements
- Offline-first design with sync capabilities

### Performance Optimizations
- Virtual scrolling for large libraries
- Lazy loading and image optimization
- Multi-part downloads for reliability
- Efficient database operations with caching

### Platform-Specific Features
- **Android**: Android Auto, external storage, local media scanning, Chromecast
- **iOS**: CarPlay, strict sandboxing, system audio session integration

## File Structure Reference

```
pages/                  # Vue.js pages/routes
├── bookshelf/         # Library browsing
├── media/             # Media details and playback
├── downloads.vue      # Download management
├── search.vue         # Global search
├── stats.vue          # Listening statistics
└── settings.vue       # App configuration

components/            # Reusable Vue components
├── app/              # Core app components (player, drawer)
├── bookshelf/        # Library browsing components
├── cards/            # Item display cards
├── modals/           # Modal dialogs
└── readers/          # E-book reader components

store/                # Vuex state management
├── user.js           # User auth and preferences
├── libraries.js      # Library data and settings
├── playerSettings.js # Playback configuration
└── downloads.js      # Download queue state

services/             # Business logic services
├── ApiService.js     # HTTP API communication
├── PlayerService.js  # Media playback logic
├── DownloadService.js # Download management
└── SyncService.js    # Data synchronization

plugins/              # Vue plugins and utilities
├── db.js            # Database initialization
├── serverHandler.js # Server communication
└── capacitor/       # Native platform plugins
```

## Development Best Practices

1. **Testing**: Test on real devices for audio/video features
2. **Performance**: Monitor memory usage, especially with large libraries
3. **Offline Support**: Ensure graceful degradation when disconnected
4. **Cross-Platform**: Test platform-specific features thoroughly
5. **User Data**: Handle user progress and settings with care
6. **Error Handling**: Provide meaningful error messages and recovery options

This documentation serves as a comprehensive guide for developers working on the AudioBookshelf mobile app, providing both high-level understanding and technical implementation details for each major feature area.