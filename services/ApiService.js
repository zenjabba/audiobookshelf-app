/**
 * Optimized API Service for Large Libraries
 * Handles 300,000+ books with request batching, deduplication, and caching
 */

class OptimizedApiService {
  constructor() {
    this.baseURL = ''
    this.authToken = ''
    
    // Request management
    this.activeRequests = new Map()
    this.requestQueue = []
    this.isProcessingQueue = false
    this.maxConcurrentRequests = 3
    
    // Caching
    this.cache = new Map()
    this.maxCacheSize = 500
    this.defaultCacheTTL = 300000 // 5 minutes
    
    // Request optimization
    this.batchSize = 500 // Increased from 20
    this.batchTimeout = 100 // ms to wait for batching
    this.pendingBatches = new Map()
    
    // Retry configuration
    this.maxRetries = 3
    this.retryDelay = 1000 // Start with 1 second
  }

  /**
   * Get library items with intelligent batching
   */
  async getLibraryItems(options = {}) {
    const {
      libraryId,
      offset = 0,
      limit = this.batchSize,
      sort = 'addedAt',
      desc = 1,
      filter = '',
      minified = 1
    } = options

    // Create cache key
    const cacheKey = this.createCacheKey('libraryItems', {
      libraryId, offset, limit, sort, desc, filter, minified
    })

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    // Create request key for deduplication
    const requestKey = `library-items-${libraryId}-${offset}-${limit}`
    
    // Return existing request if in progress
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey)
    }

    // Build query parameters
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: Math.floor(offset / limit).toString(),
      sort,
      desc: desc.toString(),
      minified: minified.toString()
    })

    if (filter) {
      params.append('filter', filter)
    }

    const url = `/api/libraries/${libraryId}/items?${params.toString()}`
    
    // Create request promise
    const requestPromise = this.makeRequest(url, {
      method: 'GET',
      timeout: 30000 // 30 second timeout for large responses
    }).then(response => {
      // Cache successful response
      this.setCache(cacheKey, response, this.defaultCacheTTL)
      return response
    }).catch(error => {
      console.error('Failed to fetch library items:', error)
      throw error
    }).finally(() => {
      this.activeRequests.delete(requestKey)
    })

    this.activeRequests.set(requestKey, requestPromise)
    return requestPromise
  }

  /**
   * Get library item count with caching
   */
  async getLibraryItemsCount(libraryId, filter = '') {
    const cacheKey = this.createCacheKey('libraryItemsCount', { libraryId, filter })
    
    // Check cache with shorter TTL for counts
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    const params = filter ? `?filter=${encodeURIComponent(filter)}` : ''
    const url = `/api/libraries/${libraryId}/items/count${params}`

    const result = await this.makeRequest(url)
    
    // Cache count for 2 minutes
    this.setCache(cacheKey, result, 120000)
    return result
  }

  /**
   * Batch multiple item requests
   */
  async getMultipleItems(itemIds) {
    if (!itemIds || !itemIds.length) return []

    // Split into batches of 100
    const batches = []
    for (let i = 0; i < itemIds.length; i += 100) {
      batches.push(itemIds.slice(i, i + 100))
    }

    // Process batches in parallel with concurrency limit
    const results = []
    for (let i = 0; i < batches.length; i += this.maxConcurrentRequests) {
      const batchPromises = batches
        .slice(i, i + this.maxConcurrentRequests)
        .map(batch => this.makeRequest('/api/items/batch', {
          method: 'POST',
          body: JSON.stringify({ itemIds: batch })
        }))

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.flat())
    }

    return results
  }

  /**
   * Make HTTP request with queue management
   */
  async makeRequest(url, options = {}) {
    // Wait if queue is full
    while (this.requestQueue.length >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return new Promise((resolve, reject) => {
      const request = {
        url,
        options,
        resolve,
        reject,
        retries: 0
      }

      this.requestQueue.push(request)
      this.processQueue()
    })
  }

  /**
   * Process request queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      // Process up to maxConcurrentRequests in parallel
      const batch = this.requestQueue.splice(0, this.maxConcurrentRequests)
      
      await Promise.all(batch.map(request => this.executeRequest(request)))
    }

    this.isProcessingQueue = false
  }

  /**
   * Execute individual request with retry logic
   */
  async executeRequest(request) {
    const { url, options, resolve, reject, retries } = request

    try {
      // Use native HTTP if available (Capacitor)
      const response = await this.$http({
        url: this.baseURL + url,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        data: options.body,
        timeout: options.timeout || 10000
      })

      resolve(response.data)
    } catch (error) {
      // Retry logic
      if (retries < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelay * Math.pow(2, retries) // Exponential backoff
        
        setTimeout(() => {
          request.retries = retries + 1
          this.requestQueue.unshift(request)
          this.processQueue()
        }, delay)
      } else {
        reject(error)
      }
    }
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true // Network error
    
    const status = error.response.status
    return status >= 500 && status < 600
  }

  /**
   * Cache management
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

  setCache(key, data, ttl = this.defaultCacheTTL) {
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

  /**
   * Clear cache
   */
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
   * Update configuration
   */
  setConfig(config) {
    if (config.baseURL) this.baseURL = config.baseURL
    if (config.authToken) this.authToken = config.authToken
    if (config.$http) this.$http = config.$http
  }
}

// Export as singleton
const apiService = new OptimizedApiService()
export default apiService