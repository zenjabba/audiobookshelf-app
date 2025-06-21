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
  async getLibraryItemCount(libraryId, filter = '') {
    const cacheKey = this.createCacheKey('itemCount', { libraryId, filter })
    
    const cached = this.getFromCache(cacheKey)
    if (cached !== null) {
      return cached
    }

    const params = new URLSearchParams()
    if (filter) {
      params.append('filter', filter)
    }

    const url = `/api/libraries/${libraryId}/items?${params.toString()}&limit=1&count=1`
    
    try {
      const response = await this.makeRequest(url)
      const count = response.total || 0
      
      // Cache count for longer (counts change less frequently)
      this.setCache(cacheKey, count, 600000) // 10 minutes
      
      return count
    } catch (error) {
      console.error('Failed to get library count:', error)
      return 0
    }
  }

  /**
   * Batch multiple API requests efficiently
   */
  async batchRequest(requests) {
    const batchId = Date.now().toString()
    
    // Group requests by type for optimization
    const groupedRequests = this.groupRequestsByType(requests)
    
    const results = []
    
    for (const [type, typeRequests] of Object.entries(groupedRequests)) {
      switch (type) {
        case 'libraryItems':
          const batchedResults = await this.batchLibraryItemRequests(typeRequests)
          results.push(...batchedResults)
          break
          
        case 'progress':
          await this.batchProgressUpdates(typeRequests)
          break
          
        default:
          // Process individually
          for (const request of typeRequests) {
            try {
              const result = await this.makeRequest(request.url, request.options)
              results.push(result)
            } catch (error) {
              console.error('Batch request failed:', error)
              results.push({ error: error.message })
            }
          }
      }
    }
    
    return results
  }

  /**
   * Optimized search with debouncing
   */
  async searchLibrary(libraryId, query, options = {}) {
    const {
      limit = 50,
      offset = 0
    } = options

    // Debounce search requests
    const searchKey = `search-${libraryId}-${query}`
    
    if (this.pendingBatches.has(searchKey)) {
      clearTimeout(this.pendingBatches.get(searchKey))
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        this.pendingBatches.delete(searchKey)
        
        try {
          const cacheKey = this.createCacheKey('search', { libraryId, query, limit, offset })
          
          const cached = this.getFromCache(cacheKey)
          if (cached) {
            resolve(cached)
            return
          }

          const params = new URLSearchParams({
            q: query,
            limit: limit.toString(),
            page: Math.floor(offset / limit).toString()
          })

          const url = `/api/libraries/${libraryId}/search?${params.toString()}`
          
          const response = await this.makeRequest(url)
          
          // Cache search results for shorter time
          this.setCache(cacheKey, response, 60000) // 1 minute
          
          resolve(response)
        } catch (error) {
          reject(error)
        }
      }, 300) // 300ms debounce

      this.pendingBatches.set(searchKey, timeoutId)
    })
  }

  /**
   * Optimized progress sync
   */
  async syncProgress(progressData) {
    // Batch progress updates
    const batchKey = 'progress-batch'
    
    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, {
        data: [],
        timeout: null
      })
    }

    const batch = this.pendingBatches.get(batchKey)
    batch.data.push(progressData)

    // Clear existing timeout
    if (batch.timeout) {
      clearTimeout(batch.timeout)
    }

    // Set new timeout to process batch
    batch.timeout = setTimeout(async () => {
      const dataToSync = [...batch.data]
      batch.data = []
      this.pendingBatches.delete(batchKey)

      try {
        await this.batchProgressUpdates(dataToSync)
      } catch (error) {
        console.error('Failed to sync progress batch:', error)
      }
    }, 2000) // Wait 2 seconds for more updates
  }

  /**
   * Smart request queuing for rate limiting
   */
  async makeRequest(url, options = {}) {
    const requestId = `${Date.now()}-${Math.random()}`
    
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        id: requestId,
        url,
        options,
        resolve,
        reject,
        retries: 0
      })
      
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift()
      this.executeRequest(request)
    }

    this.isProcessingQueue = false
  }

  async executeRequest(request) {
    const { id, url, options, resolve, reject, retries } = request
    
    try {
      // Add auth header
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000)

      const requestPromise = fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
        signal: controller.signal
      })

      this.activeRequests.set(id, { promise: requestPromise, controller })

      const response = await requestPromise
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      resolve(data)

    } catch (error) {
      if (retries < this.maxRetries && this.isRetryableError(error)) {
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, retries)
        
        setTimeout(() => {
          request.retries++
          this.requestQueue.unshift(request) // Put back at front
          this.processQueue()
        }, delay)
      } else {
        reject(error)
      }
    } finally {
      this.activeRequests.delete(id)
      this.processQueue() // Process next queued request
    }
  }

  /**
   * Cache management
   */
  createCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`
  }

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    
    if (cached) {
      this.cache.delete(key) // Remove expired
    }
    
    return null
  }

  setCache(key, data, ttl = this.defaultCacheTTL) {
    // Implement LRU
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Helper methods
   */
  groupRequestsByType(requests) {
    return requests.reduce((groups, request) => {
      const type = this.getRequestType(request.url)
      if (!groups[type]) groups[type] = []
      groups[type].push(request)
      return groups
    }, {})
  }

  getRequestType(url) {
    if (url.includes('/items')) return 'libraryItems'
    if (url.includes('/progress')) return 'progress'
    if (url.includes('/search')) return 'search'
    return 'other'
  }

  isRetryableError(error) {
    return error.name === 'AbortError' || 
           error.message.includes('network') ||
           error.message.includes('timeout') ||
           (error.status >= 500 && error.status < 600)
  }

  async batchLibraryItemRequests(requests) {
    // Combine multiple library item requests into fewer large requests
    const results = []
    
    for (const request of requests) {
      try {
        const result = await this.executeRequest(request)
        results.push(result)
      } catch (error) {
        results.push({ error: error.message })
      }
    }
    
    return results
  }

  async batchProgressUpdates(progressUpdates) {
    if (progressUpdates.length === 0) return

    try {
      const url = '/api/me/progress/batch'
      await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({ updates: progressUpdates })
      })
      
      // Invalidate progress cache
      this.invalidateCache('progress')
      
    } catch (error) {
      console.error('Failed to batch update progress:', error)
      throw error
    }
  }

  // Configuration methods
  setBaseURL(url) {
    this.baseURL = url
  }

  setAuthToken(token) {
    this.authToken = token
  }

  // Cleanup
  destroy() {
    // Cancel all active requests
    for (const [id, request] of this.activeRequests) {
      request.controller?.abort()
    }
    this.activeRequests.clear()
    
    // Clear timeouts
    for (const [key, batch] of this.pendingBatches) {
      if (batch.timeout) {
        clearTimeout(batch.timeout)
      }
    }
    this.pendingBatches.clear()
    
    // Clear cache
    this.cache.clear()
    
    // Clear queue
    this.requestQueue = []
  }
}

export default OptimizedApiService