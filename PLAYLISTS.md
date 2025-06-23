# Playlists

## Overview
The Playlist feature allows users to create and manage custom playlists of audiobooks and podcasts. Playlists support drag-and-drop reordering, custom covers, and seamless integration with the media player for continuous playback.

## Key Components

### Main Files
- `pages/bookshelf/playlists.vue`: Playlist browser
- `pages/playlist/_id.vue`: Individual playlist view
- `components/cards/PlaylistCard.vue`: Playlist display card
- `modals/CreatePlaylistModal.vue`: Playlist creation
- `store/playlists.js`: Playlist state management

## Playlist Management

### Data Model
```javascript
{
  id: string,
  libraryId: string,
  userId: string,
  name: string,
  description: string,
  coverPath: string,
  items: [{
    libraryItemId: string,
    episodeId: string,
    title: string,
    subtitle: string,
    duration: number
  }],
  createdAt: number,
  updatedAt: number
}
```

### Operations
```javascript
// Create playlist
POST /api/playlists
{
  libraryId: string,
  name: string,
  description?: string,
  items: string[]  // Array of library item IDs
}

// Add items
POST /api/playlists/:id/item
{
  libraryItemId: string,
  episodeId?: string
}

// Remove items
DELETE /api/playlists/:id/item/:itemId

// Reorder items
POST /api/playlists/:id/reorder
{
  items: [{ libraryItemId, episodeId }]
}
```

## Playlist UI

### Playlist Cards
```javascript
// Visual representation with composite covers
{
  title: string,
  itemCount: number,
  duration: number,
  cover: string,      // Composite of first 4 item covers
  lastPlayedAt: number
}
```

### Playlist Browser
- Grid view with cover previews
- Sort by name, created date, or last played
- Filter by library
- Quick actions (play, edit, delete)

### Playlist Detail View
- Full item list with metadata
- Drag-and-drop reordering
- Progress indicators
- Batch selection for removal
- Playback controls

## Playback Integration

### Continuous Playback
```javascript
// Play entire playlist
startPlaylistPlayback(playlistId, startIndex = 0) {
  const playlist = this.getPlaylist(playlistId)
  this.playbackQueue = playlist.items
  this.currentQueueIndex = startIndex
  this.playCurrentItem()
}
```

### Queue Management
- Playlist items added to playback queue
- Maintains playlist order
- Progress tracking per item
- Auto-advance to next item

## Visual Features

### Composite Covers
```javascript
// Generate 2x2 grid from first 4 items
generateCompositeCover(items) {
  const covers = items.slice(0, 4).map(item => item.coverPath)
  return createComposite(covers, 400, 400)
}
```

### Responsive Design
- Grid layout on tablets
- List layout on phones
- Lazy loading for large playlists
- Smooth animations

## State Management

### Vuex Store
```javascript
// store/playlists.js
state: {
  playlists: [],
  currentPlaylist: null,
  isEditing: false
}

actions: {
  loadPlaylists({ commit }),
  createPlaylist({ commit }, playlist),
  updatePlaylist({ commit }, { id, updates }),
  deletePlaylist({ commit }, id),
  addToPlaylist({ commit }, { playlistId, items }),
  removeFromPlaylist({ commit }, { playlistId, itemId })
}
```

## Integration Points

### Library System
- Playlists are library-specific
- Items validated against library
- Real-time updates on library changes

### Media Player
- Direct playlist playback
- Queue integration
- Progress tracking
- Repeat modes

## Best Practices
- Validate items exist before adding
- Show loading states during operations
- Handle empty playlists gracefully
- Provide undo for destructive actions
- Optimize for large playlists