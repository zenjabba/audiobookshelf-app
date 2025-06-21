# Statistics & History

## Overview
The Statistics & History feature provides comprehensive listening analytics, tracking user engagement with detailed charts, session history, and progress metrics. It includes listening time statistics, items finished tracking, and detailed playback history with real-time updates.

## Key Components

### Main Files
- `pages/stats.vue`: Main statistics dashboard
- `pages/media/_id/history.vue`: Item-specific history
- `components/charts/ListeningChart.vue`: Visual analytics
- `store/stats.js`: Statistics state management

## Listening Statistics

### Data Model
```javascript
{
  totalDays: number,           // Days since first listen
  totalMinutesListening: number,
  totalItemsFinished: number,
  totalSessions: number,
  currentDayOfYear: number,
  recentSessions: [{
    id: string,
    libraryItemId: string,
    displayTitle: string,
    displayAuthor: string,
    coverPath: string,
    duration: number,
    playMethod: number,
    mediaPlayer: string,
    startedAt: number,
    updatedAt: number
  }],
  listeningStats: {
    totalTime: number,
    items: {
      [itemId]: {
        totalTime: number,
        sessions: number,
        lastListenedAt: number
      }
    }
  }
}
```

### Daily Listening Chart
```javascript
// Chart data for last 30 days
{
  labels: ['Day 1', 'Day 2', ...],
  datasets: [{
    label: 'Minutes Listened',
    data: [45, 120, 67, ...],
    backgroundColor: 'rgba(139, 195, 74, 0.8)'
  }]
}
```

## Session History

### Session Tracking
```javascript
// Individual playback session
{
  id: string,
  userId: string,
  libraryItemId: string,
  episodeId: string,
  mediaType: 'book' | 'podcast',
  displayTitle: string,
  displayAuthor: string,
  date: string,              // YYYY-MM-DD
  dayOfWeek: string,
  duration: number,          // Session length in seconds
  timeListening: number,     // Actual listening time
  startTime: number,         // Start position in media
  currentTime: number,       // End position in media
  startedAt: number,         // Timestamp
  updatedAt: number,
  serverConnectionConfigId: string
}
```

### Event Grouping
- Group sessions by date
- Show continuous listening periods
- Aggregate daily totals
- Track listening streaks

## User Interface

### Statistics Dashboard
- Total listening time (all-time)
- Items finished counter
- Daily average calculations
- Recent activity feed
- Interactive listening chart
- Year in Review (December/January)

### History Views
- Chronological session list
- Filter by date range
- Search by title/author
- Group by media item
- Export functionality

### Visual Elements
```javascript
// Progress indicators
{
  dailyGoal: 60,            // Minutes per day
  currentStreak: 7,         // Days in a row
  longestStreak: 23,        // Best streak
  averageDaily: 45.6        // Average minutes/day
}
```

## Real-time Updates

### Live Session Tracking
```javascript
// Update during playback
updateListeningSession(sessionData) {
  // Update current session
  // Add to daily total
  // Trigger chart refresh
  // Sync with server
}
```

### Socket Events
- Session updates during playback
- Real-time chart updates
- Live progress tracking
- Instant sync status

## Year in Review

### Annual Summary (December/January)
```javascript
{
  totalTimeListening: number,
  totalItemsFinished: number,
  totalAuthors: number,
  totalGenres: number,
  longestSession: SessionObject,
  topMonth: string,
  topGenre: string,
  topAuthor: string,
  averageSessionLength: number,
  listeningStreak: number
}
```

### Visual Highlights
- Animated statistics reveal
- Achievement badges
- Comparison to previous year
- Social sharing capabilities

## Data Persistence

### Local Storage
- Recent sessions cache
- Chart data cache
- User preferences
- Offline session queue

### Server Sync
```javascript
// POST /api/me/listening-stats/sync
{
  sessions: [SessionObject],
  date: string,
  totalTime: number
}
```

## Performance Optimizations

### Data Aggregation
- Pre-computed daily totals
- Cached chart datasets
- Efficient date grouping
- Memory-conscious history loading

### Chart Rendering
- Canvas-based charts
- Lazy loading for large datasets
- Responsive updates
- Animation optimization

## Integration Points

### Media Player
- Automatic session creation
- Real-time progress updates
- Session completion tracking
- Pause/resume handling

### Progress System
- Session-based progress tracking
- Historical progress snapshots
- Cross-device synchronization
- Offline session queuing

## Best Practices
- Batch session updates for performance
- Handle timezone changes gracefully
- Validate session data integrity
- Provide data export options
- Respect user privacy preferences