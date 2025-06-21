# Library & Bookshelf Features

## Overview
The Library & Bookshelf features form the core browsing experience of the AudioBookshelf mobile app. These features allow users to browse, filter, sort, and organize their audiobooks and podcasts across multiple libraries with support for series, collections, and authors.

## Key Features
- Multi-library support (audiobooks and podcasts)
- Multiple view modes (Grid/List/Alternative)
- Dynamic personalized shelves (Continue, Recent, Discover)
- Advanced filtering and sorting
- Series organization with sequence support
- Collections management
- Author browsing with images
- Offline support with local content
- Performance optimized for large libraries

## UI Components

### Main Components

#### Bookshelf Index (`pages/bookshelf/index.vue`)
Primary browsing interface with:
- Dynamic shelf system
- View mode toggle
- Filter/sort controls
- Pull-to-refresh
- Infinite scroll

#### Lazy Bookshelf (`components/bookshelf/LazyBookshelf.vue`)
Virtual scrolling container that:
- Renders only visible items
- Maintains scroll position
- Handles dynamic row heights
- Supports different view modes

#### Shelf Component (`components/bookshelf/Shelf.vue`)
Horizontal scrolling shelves for:
- Continue Listening
- Recent Additions
- Discover More
- Listen Again

### Card Components
- `BookCard.vue`: Standard book display
- `BookListCard.vue`: List view book display
- `AltViewBookCard.vue`: Alternative view with progress
- `SeriesCard.vue`: Series with book count
- `CollectionCard.vue`: Collection covers
- `AuthorCard.vue`: Author with photo

## Data Models

### Library Model
```javascript
{
  id: string,
  name: string,
  folders: Array,
  displayOrder: number,
  icon: string,
  mediaType: 'book' | 'podcast',
  provider: string,
  settings: {
    coverAspectRatio: number,    // 1 = square, 1.6 = book
    disableWatcher: boolean,
    metadataPrecedence: Array
  },
  createdAt: number,
  lastUpdate: number
}
```

### Library Item Model
```javascript
{
  id: string,
  ino: string,
  libraryId: string,
  folderId: string,
  path: string,
  relPath: string,
  isFile: boolean,
  mtimeMs: number,
  ctimeMs: number,
  birthtimeMs: number,
  addedAt: number,
  updatedAt: number,
  lastScan: number,
  scanVersion: string,
  isMissing: boolean,
  isInvalid: boolean,
  mediaType: 'book' | 'podcast',
  media: MediaObject,           // Book or Podcast metadata
  libraryFiles: Array,
  size: number
}
```

### Series Model
```javascript
{
  id: string,
  name: string,
  nameIgnorePrefix: string,     // For sorting
  libraryId: string,
  books: Array,                 // Array of book IDs
  totalDuration: number,
  addedAt: number,
  updatedAt: number
}
```

### Collection Model
```javascript
{
  id: string,
  libraryId: string,
  userId: string,
  name: string,
  description: string,
  cover: string,                // Cover path
  coverFullPath: string,
  books: Array,                 // Array of book IDs
  lastUpdate: number,
  createdAt: number
}
```

## State Management

### Libraries Store (`store/libraries.js`)
```javascript
state: {
  libraries: [],
  currentLibraryId: null,
  filterBy: 'all',
  orderBy: 'recent',
  orderDesc: true,
  collapseSeries: false,
  collapseBookSeries: false
}

getters: {
  currentLibrary: // Returns active library object
  currentLibraryMediaType: // 'book' or 'podcast'
  currentLibraryId: // Active library ID
}

actions: {
  loadLibraries()
  setCurrentLibrary(libraryId)
  updateFilterBy(filter)
  updateOrderBy(orderBy, orderDesc)
}
```

### User Store Library Settings
```javascript
{
  libraryViewMode: 'grid' | 'list',  // Per library
  coverAspectRatio: number,          // Override library default
  filterBy: string,                  // Last used filter
  orderBy: string,                   // Last used sort
  orderDesc: boolean,                // Sort direction
  collapseSeries: boolean            // Series grouping
}
```

## API Endpoints

### Library Management
- `GET /api/libraries`: List all libraries
- `GET /api/libraries/:id`: Get library details
- `GET /api/libraries/:id/items`: Get library items with pagination
- `GET /api/libraries/:id/series`: Get all series
- `GET /api/libraries/:id/collections`: Get collections
- `GET /api/libraries/:id/authors`: Get authors
- `GET /api/libraries/:id/personalized`: Get personalized shelves

### Query Parameters
```javascript
{
  limit: number,           // Items per page (default: 25)
  page: number,            // Page number (0-based)
  sort: string,            // Sort field
  desc: 0 | 1,            // Sort direction
  filter: string,          // Filter string
  minified: 0 | 1,        // Reduced payload
  include: string          // Include extra data
}
```

### Filter Syntax
```
// Examples:
"authors.name=John Steinbeck"
"series.name=Harry Potter"
"narrators.name=Jim Dale"
"metadata.title=1984"
"progress.finished=1"
"tags=fantasy"
```

## Performance Optimizations

### Virtual Scrolling
The LazyBookshelf component implements virtual scrolling:
```javascript
// Only renders visible items + buffer
computeVisibleItems() {
  const scrollTop = this.$el.scrollTop
  const containerHeight = this.$el.clientHeight
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight)
  
  return items.slice(
    Math.max(0, startIndex - bufferSize),
    Math.min(items.length, endIndex + bufferSize)
  )
}
```

### Lazy Loading
- Initial load: 50 items
- Subsequent loads: 25 items
- Triggered at 80% scroll position
- Debounced scroll events

### Image Optimization
- Lazy loading book covers
- Thumbnail generation
- Memory cleanup on unmount
- Placeholder while loading

## User Interactions

### Navigation Flow
1. **Library Selection**: Drawer → Select Library
2. **Browse Items**: Bookshelf with shelves and items
3. **Filter/Sort**: Header controls → Apply filters
4. **Item Details**: Tap item → Media page
5. **Series/Collection**: Tap → Dedicated browse page

### View Modes
1. **Grid View** (Default)
   - Covers with title below
   - 3 columns on phones, more on tablets
   - Shows progress bar

2. **List View**
   - Horizontal cards with metadata
   - Shows duration, author, narrator
   - Larger progress indicator

3. **Alternative View**
   - Square cards with overlay
   - Progress percentage shown
   - Compact for more items

### Filter Options
- All
- Finished
- In Progress
- Not Started
- Series Filter
- Author Filter
- Narrator Filter
- Genre Filter
- Tag Filter
- Missing/Invalid

### Sort Options
- Recent (added/updated)
- Title (A-Z/Z-A)
- Author (A-Z/Z-A)
- Duration (short-long/long-short)
- Progress (least-most/most-least)
- Random

## Offline Support

### Local Library
- Scans device folders
- Maintains local database
- Syncs progress when online
- Shows download status

### Downloaded Items
- Marked with icon
- Available offline
- Progress tracked locally
- Syncs when reconnected

## Real-time Updates

### Socket.IO Events
- `library_updated`: Refresh library data
- `item_added`: Add new item
- `item_updated`: Update item metadata
- `item_removed`: Remove item
- `collection_updated`: Refresh collection
- `series_updated`: Update series

## Best Practices

### Performance
1. Use `minified=1` for list views
2. Implement proper cleanup in `destroyed()`
3. Debounce scroll events (150ms)
4. Limit initial shelf items to 15
5. Use `v-show` instead of `v-if` for view toggles

### User Experience
1. Persist scroll position on navigation
2. Show loading states
3. Handle empty states gracefully
4. Provide clear filter indicators
5. Support pull-to-refresh

### Data Management
1. Cache library data in Vuex
2. Invalidate cache on updates
3. Handle pagination properly
4. Clean up listeners on unmount
5. Use computed properties for filtered data

### Accessibility
1. Proper ARIA labels on cards
2. Keyboard navigation support
3. Focus management on view changes
4. Screen reader announcements
5. High contrast mode support