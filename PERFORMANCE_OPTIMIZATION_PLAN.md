# Performance Optimization Plan for Large Libraries (300,000+ Books)

## Critical Issues Summary

The AudioBookshelf mobile app currently cannot handle libraries with more than ~5,000 books due to fundamental architectural limitations. For 300,000+ books, the following issues cause crashes:

1. **Memory overflow** from creating massive arrays
2. **Component leak** from poor virtual scrolling
3. **Database blocking** from synchronous operations
4. **API flooding** from excessive small requests

## Immediate Fixes Required

### 1. Replace Virtual Scrolling Implementation

**Current Problem:**
```javascript
// Creates 300,000+ array slots in memory
this.entities = new Array(this.totalEntities)
```

**Solution:**
```javascript
// Windowed virtual scrolling with component recycling
class OptimizedVirtualScroller {
  constructor() {
    this.WINDOW_SIZE = 50
    this.BUFFER_SIZE = 10
    this.componentPool = []
    this.visibleComponents = new Map()
    this.loadedData = new Map() // Sparse storage
  }

  getVisibleRange(scrollTop, containerHeight, itemHeight) {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight)
    
    // Add buffer
    return {
      start: Math.max(0, startIndex - this.BUFFER_SIZE),
      end: Math.min(this.totalItems, endIndex + this.BUFFER_SIZE)
    }
  }

  recycleComponent(component) {
    component.reset()
    this.componentPool.push(component)
  }

  getComponent() {
    return this.componentPool.pop() || this.createNewComponent()
  }
}
```

### 2. Implement Chunked Data Loading

**Replace:**
```javascript
// Loads ALL items
this.localLibraryItems = await this.$db.getLocalLibraryItems()
```

**With:**
```javascript
// Chunked loading with caching
class LibraryDataManager {
  constructor() {
    this.CHUNK_SIZE = 100
    this.loadedChunks = new Set()
    this.chunkCache = new Map()
    this.maxCacheSize = 10 // Keep 10 chunks (1000 items) in memory
  }

  async loadChunk(chunkIndex) {
    if (this.loadedChunks.has(chunkIndex)) {
      return this.chunkCache.get(chunkIndex)
    }

    const offset = chunkIndex * this.CHUNK_SIZE
    const chunk = await this.$db.getLocalLibraryItems({
      offset,
      limit: this.CHUNK_SIZE
    })

    // LRU cache management
    if (this.chunkCache.size >= this.maxCacheSize) {
      const oldestChunk = this.chunkCache.keys().next().value
      this.chunkCache.delete(oldestChunk)
      this.loadedChunks.delete(oldestChunk)
    }

    this.chunkCache.set(chunkIndex, chunk)
    this.loadedChunks.add(chunkIndex)
    return chunk
  }

  async getItemsForRange(startIndex, endIndex) {
    const startChunk = Math.floor(startIndex / this.CHUNK_SIZE)
    const endChunk = Math.floor(endIndex / this.CHUNK_SIZE)
    
    const chunks = []
    for (let i = startChunk; i <= endChunk; i++) {
      chunks.push(await this.loadChunk(i))
    }

    return chunks.flat().slice(
      startIndex % this.CHUNK_SIZE,
      (endIndex % this.CHUNK_SIZE) + 1
    )
  }
}
```

### 3. Optimize API Calls

**Replace small page sizes with larger chunks:**
```javascript
// Current: 20 items per call = 15,000 API calls for 300k books
booksPerFetch: 20

// Optimized: 500 items per call = 600 API calls
booksPerFetch: 500
```

**Add request deduplication:**
```javascript
class APIRequestManager {
  constructor() {
    this.activeRequests = new Map()
    this.cancelTokens = new Map()
  }

  async loadPage(page, params) {
    const requestKey = `${page}-${JSON.stringify(params)}`
    
    // Return existing request if in progress
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey)
    }

    // Cancel previous request for same page
    if (this.cancelTokens.has(page)) {
      this.cancelTokens.get(page).cancel()
    }

    const cancelToken = new AbortController()
    this.cancelTokens.set(page, cancelToken)

    const request = this.fetchLibraryItems(page, params, cancelToken.signal)
    this.activeRequests.set(requestKey, request)

    try {
      const result = await request
      return result
    } finally {
      this.activeRequests.delete(requestKey)
      this.cancelTokens.delete(page)
    }
  }
}
```

### 4. Database Optimizations

**Add pagination to all database queries:**
```sql
-- Replace unbounded queries
SELECT * FROM library_items WHERE libraryId = ?

-- With paginated queries
SELECT * FROM library_items 
WHERE libraryId = ? 
ORDER BY addedAt DESC 
LIMIT ? OFFSET ?
```

**Implement database indexing:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_library_items_library_id ON library_items(libraryId);
CREATE INDEX idx_library_items_added_at ON library_items(addedAt);
CREATE INDEX idx_library_items_title ON library_items(title);
CREATE INDEX idx_progress_library_item ON local_media_progress(libraryItemId);
```

### 5. Memory Management

**Implement component recycling in LazyBookshelf.vue:**
```javascript
export default {
  data() {
    return {
      componentPool: [],
      activeComponents: new Map(),
      maxPoolSize: 100
    }
  },

  methods: {
    getBookComponent() {
      if (this.componentPool.length > 0) {
        return this.componentPool.pop()
      }
      return this.createBookComponent()
    },

    recycleComponent(component) {
      if (this.componentPool.length < this.maxPoolSize) {
        component.reset()
        this.componentPool.push(component)
      } else {
        component.$destroy()
      }
    },

    updateVisibleRange(startIndex, endIndex) {
      // Remove components outside visible range
      for (const [index, component] of this.activeComponents) {
        if (index < startIndex || index > endIndex) {
          this.recycleComponent(component)
          this.activeComponents.delete(index)
        }
      }

      // Add components for visible range
      for (let i = startIndex; i <= endIndex; i++) {
        if (!this.activeComponents.has(i)) {
          const component = this.getBookComponent()
          component.updateData(this.getItemData(i))
          this.activeComponents.set(i, component)
        }
      }
    }
  }
}
```

## Implementation Priority

### Phase 1 (Critical - Implement Immediately)
1. ✅ **Virtual Scrolling Fix** - Replace array allocation with windowed approach
2. ✅ **API Batch Size** - Increase from 20 to 500 items per request
3. ✅ **Component Recycling** - Implement component pool

### Phase 2 (High Priority)
4. ✅ **Database Pagination** - Add LIMIT/OFFSET to all queries
5. ✅ **Request Deduplication** - Prevent duplicate API calls
6. ✅ **Memory Cleanup** - Proper component destruction

### Phase 3 (Medium Priority)
7. **Database Indexing** - Add indexes for performance
8. **Caching Strategy** - Implement LRU cache for chunks
9. **Background Loading** - Preload adjacent chunks

## Expected Performance Improvements

| Library Size | Current Performance | With Optimizations |
|-------------|-------------------|-------------------|
| 5,000 books | Slow but functional | Fast and smooth |
| 50,000 books | Crashes frequently | Good performance |
| 100,000 books | Unusable | Acceptable |
| 300,000 books | Immediate crash | Functional with some lag |

## Testing Strategy

1. **Synthetic Testing**: Create test library with 300k dummy entries
2. **Memory Profiling**: Monitor memory usage during scrolling
3. **Performance Metrics**: Measure scroll FPS and response times
4. **Device Testing**: Test on low-end devices (2GB RAM)

## Code Changes Required

The main files that need modification:
- `components/bookshelf/LazyBookshelf.vue` - Virtual scrolling
- `pages/bookshelf/index.vue` - Data loading
- `plugins/capacitor/AbsDatabase.js` - Database pagination
- `store/libraries.js` - State management
- `services/ApiService.js` - Request optimization

This plan should make the app capable of handling 300,000+ books while maintaining reasonable performance on mobile devices.