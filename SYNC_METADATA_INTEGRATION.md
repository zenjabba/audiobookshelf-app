# SyncLibraryMetadata Integration Summary

This document summarizes the integration of the new `syncLibraryMetadata` plugin method to optimize the mobile app for large libraries (5000+ items).

## Changes Made

### 1. **pages/bookshelf/index.vue**
- Added library size checking before fetching categories
- Added background metadata sync for libraries > 5000 items
- Added sync progress tracking (console logging only for now)
- Cleanup of sync interval on component destroy

### 2. **pages/bookshelf/library.vue**
- Added conditional rendering to use OptimizedBookshelf for large libraries
- Falls back to standard LazyBookshelf for smaller libraries
- Library size threshold: 5000 items

### 3. **components/bookshelf/LazyBookshelf.vue**
- Updated `fetchChunkData` to check local metadata cache first
- Falls back to API calls if no local data available
- Updated `getTotalEntityCount` to use sync progress for accurate counts
- Added automatic background sync start for large libraries on initial load

### 4. **store/libraries.js**
- Added new action `setCurrentLibraryWithSync` that:
  - Sets the current library
  - Checks library size
  - Starts background metadata sync for libraries > 5000 items
- Updated `fetch` action to use the new sync-aware action
- Updated `load` action to use the new sync-aware action

### 5. **layouts/default.vue**
- Updated library initialization to use `setCurrentLibraryWithSync` action
- Ensures metadata sync starts when user connects to server

## How It Works

1. **Library Detection**: When a library is selected or the app connects, it checks the library size via the `/api/libraries/{id}/stats` endpoint.

2. **Automatic Sync**: For libraries with more than 5000 items, the app automatically starts a background metadata sync using `$db.syncLibraryMetadata()`.

3. **Local Cache Usage**: Components like LazyBookshelf check the local metadata cache first before making API calls, significantly improving performance for large libraries.

4. **Progress Tracking**: The sync progress can be monitored via `$db.getLibrarySyncProgress()`. Currently logged to console but can be exposed in UI if needed.

5. **Fallback Behavior**: If local data is not available or sync hasn't completed, the app falls back to standard API calls ensuring functionality is never broken.

## Benefits

- **Improved Performance**: Large libraries (300,000+ items) load much faster using local cached metadata
- **Reduced Server Load**: Fewer API calls needed after initial sync
- **Better Offline Support**: Metadata available locally for offline browsing
- **Progressive Enhancement**: Small libraries continue to work as before
- **Background Operation**: Sync happens in background without blocking UI

## Future Enhancements

1. **UI Progress Indicator**: Add visual sync progress in the bookshelf UI
2. **Manual Sync Trigger**: Add option in settings to manually trigger metadata sync
3. **Sync Status in Settings**: Show last sync time and status
4. **Configurable Threshold**: Allow users to set the library size threshold for optimization