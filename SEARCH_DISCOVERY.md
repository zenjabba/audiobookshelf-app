# Search & Discovery

## Overview
The Search & Discovery feature provides comprehensive search capabilities across the library, including global search, podcast discovery, and real-time search results. It supports searching through books, podcasts, series, authors, narrators, and tags with optimized performance and intuitive UI.

## Key Components

### Main Files
- `pages/search.vue`: Main search interface
- `pages/bookshelf/add-podcast.vue`: Podcast RSS feed discovery
- `components/cards/SearchItemCard.vue`: Search result display
- `services/ApiService.js`: Search API calls

## Search Functionality

### Global Search
```javascript
// Real-time search with debouncing
searchQuery: debounce(async function(query) {
  if (query.length < 2) return
  
  const results = await this.$store.dispatch('search', {
    q: query,
    library: this.currentLibraryId
  })
  
  this.searchResults = results
}, 500)
```

### Search Categories
- **Library Items**: Books and podcasts
- **Series**: Book series
- **Collections**: User collections  
- **Authors**: Author names
- **Narrators**: Narrator names
- **Tags**: Genre and custom tags

### Search API
```javascript
// GET /api/search
{
  q: string,           // Search query
  library?: string,    // Library ID filter
  limit?: number,      // Results limit
  page?: number        // Pagination
}

// Response structure
{
  results: [{
    libraryItem: LibraryItemObject,
    matchKey: string,    // What matched
    matchText: string    // Matched text
  }],
  total: number,
  page: number
}
```

## Podcast Discovery

### RSS Feed Addition
```javascript
// Add podcast by URL
{
  url: string,         // RSS feed URL
  autoDownloadEpisodes: boolean,
  autoDownloadSchedule: string
}
```

### Podcast Metadata Form
- Title and description override
- Author information
- Genre selection
- Auto-download settings
- Cover image upload

## Search Results UI

### Result Cards
```javascript
// SearchItemCard component
{
  type: 'book' | 'podcast' | 'series' | 'author' | 'narrator',
  item: SearchResultObject,
  matchText: string,
  library: LibraryObject
}
```

### Navigation
- Tap result → Navigate to item detail
- Author/Narrator → Filter by author/narrator
- Series → Browse series items
- Tags → Filter by tag

## Performance Optimizations

### Debounced Search
- 500ms delay to prevent excessive API calls
- Cancel previous requests on new input
- Minimum 2 characters required

### Result Caching
- Cache recent searches
- Clear cache on library changes
- Persistent across app sessions

### Lazy Loading
- Load first 25 results
- Infinite scroll for more results
- Progressive result enhancement

## Search History

### Recent Searches
```javascript
{
  query: string,
  timestamp: number,
  resultCount: number,
  libraryId: string
}
```

### Quick Access
- Recent search suggestions
- Popular searches
- Search within current filter

## Integration Points

### Library System
- Respects current library context
- Multi-library search support
- Real-time updates from library changes

### Player Integration
- Play from search results
- Add to queue from search
- Direct media actions

## Best Practices
- Always debounce search input
- Show loading states during search
- Handle empty results gracefully
- Provide search suggestions
- Clear results when appropriate