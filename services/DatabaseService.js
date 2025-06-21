/**
 * Optimized Database Operations for Large Libraries
 * Handles 300,000+ books efficiently with pagination and caching
 */

import { AbsDatabase } from '@/plugins/capacitor/AbsDatabase'

class OptimizedDatabaseService {
  constructor() {
    this.db = AbsDatabase
    this.cache = new Map()
    this.maxCacheSize = 1000 // Cache 1000 recent queries
    this.batchSize = 500 // Process in batches
    this.cacheTimeout = 300000 // 5 minutes
  }

  /**
   * Get paginated library items with caching
   */
  async getLibraryItemsPaginated(options = {}) {
    const {
      libraryId,
      offset = 0,
      limit = this.batchSize,
      sort = 'addedAt',
      desc = true,
      filter = null,
      mediaType = null
    } = options

    const cacheKey = this.createCacheKey('libraryItems', options)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const result = await this.db.getLibraryItemsPaginated({
        libraryId,
        offset,
        limit,
        sort,
        desc,
        filter,
        mediaType
      })

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Failed to get library items:', error)
      throw error
    }
  }

  /**
   * Get library items count with caching
   */
  async getLibraryItemsCount(libraryId, filter = null) {
    const cacheKey = this.createCacheKey('itemCount', { libraryId, filter })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const count = await this.db.getLibraryItemsCount({ libraryId, filter })
      this.setCache(cacheKey, count, 120000) // Cache for 2 minutes
      return count
    } catch (error) {
      console.error('Failed to get items count:', error)
      throw error
    }
  }

  /**
   * Bulk insert library items
   */
  async bulkInsertLibraryItems(items) {
    if (!items || !items.length) return

    // Process in batches to avoid memory issues
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize)
      await this.db.bulkInsertLibraryItems({ items: batch })
      
      // Clear cache as data has changed
      this.clearCache('libraryItems')
      this.clearCache('itemCount')
    }
  }

  /**
   * Bulk update library items
   */
  async bulkUpdateLibraryItems(updates) {
    if (!updates || !updates.length) return

    // Process in batches
    for (let i = 0; i < updates.length; i += this.batchSize) {
      const batch = updates.slice(i, i + this.batchSize)
      await this.db.bulkUpdateLibraryItems({ updates: batch })
    }

    // Clear cache
    this.clearCache('libraryItems')
  }

  /**
   * Search library items with optimized query
   */
  async searchLibraryItems(query, options = {}) {
    const {
      libraryId,
      limit = 50,
      mediaType = null
    } = options

    const cacheKey = this.createCacheKey('search', { query, libraryId, mediaType })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const results = await this.db.searchLibraryItems({
        query,
        libraryId,
        limit,
        mediaType
      })

      this.setCache(cacheKey, results)
      return results
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }

  /**
   * Get recently played items
   */
  async getRecentlyPlayed(limit = 20) {
    const cacheKey = this.createCacheKey('recentlyPlayed', { limit })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const items = await this.db.getRecentlyPlayed({ limit })
      this.setCache(cacheKey, items, 60000) // Cache for 1 minute
      return items
    } catch (error) {
      console.error('Failed to get recently played:', error)
      throw error
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase() {
    try {
      // Run VACUUM to reclaim space
      await this.db.executeQuery({ query: 'VACUUM' })
      
      // Analyze tables for better query planning
      await this.db.executeQuery({ query: 'ANALYZE' })
      
      // Clear cache after optimization
      this.cache.clear()
      
      return true
    } catch (error) {
      console.error('Database optimization failed:', error)
      return false
    }
  }

  /**
   * Create necessary indexes for performance
   */
  async createPerformanceIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_library_items_library_id ON library_items(libraryId)',
      'CREATE INDEX IF NOT EXISTS idx_library_items_added_at ON library_items(addedAt DESC)',
      'CREATE INDEX IF NOT EXISTS idx_library_items_title ON library_items(title)',
      'CREATE INDEX IF NOT EXISTS idx_library_items_author ON library_items(author)',
      'CREATE INDEX IF NOT EXISTS idx_library_items_series ON library_items(series)',
      'CREATE INDEX IF NOT EXISTS idx_library_items_composite ON library_items(libraryId, addedAt DESC)',
      'CREATE INDEX IF NOT EXISTS idx_library_items_filter ON library_items(libraryId, mediaType, isFinished)'
    ]

    for (const indexSql of indexes) {
      try {
        await this.db.executeQuery({ query: indexSql })
      } catch (error) {
        console.warn('Failed to create index:', error)
      }
    }
  }

  /**
   * Cache management utilities
   */
  createCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`
  }

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expires) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  setCache(key, data, ttl = this.cacheTimeout) {
    // Implement LRU cache eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  clearCache(type = null) {
    if (!type) {
      this.cache.clear()
      return
    }

    // Clear specific type
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = await this.db.getDatabaseStats()
      return {
        ...stats,
        cacheSize: this.cache.size,
        maxCacheSize: this.maxCacheSize
      }
    } catch (error) {
      console.error('Failed to get database stats:', error)
      return null
    }
  }
}

// Export as singleton
const databaseService = new OptimizedDatabaseService()
export default databaseService